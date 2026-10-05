import argparse
import json
import math
import os
import queue
import signal
import sys
import threading
import time

import sounddevice as sd
from vosk import KaldiRecognizer, Model, SetLogLevel


GRAMMAR = [
    "future mindset coach wake up",
    "future mindset",
    "[unk]",
]
TARGET = "future mindset coach wake up"
SAMPLE_RATE = 16000
CHANNELS = 1
BLOCK_MS = 250
DETECTION_COOLDOWN_SECONDS = 1.4


def emit(message_type, **payload):
    payload["type"] = message_type
    print(json.dumps(payload, separators=(",", ":")), flush=True)


def normalize_text(text):
    return " ".join(text.strip().lower().split())


def contains_phrase(text, phrase):
    words = normalize_text(text).split()
    phrase_words = normalize_text(phrase).split()
    if len(words) < len(phrase_words):
        return False
    return any(words[index:index + len(phrase_words)] == phrase_words for index in range(len(words) - len(phrase_words) + 1))


def parse_args():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--model", required=True)
    return parser.parse_args()


def rms_and_peak(data):
    if not data:
        return 0.0, 0, 0.0
    sample_count = len(data) // 2
    if sample_count == 0:
        return 0.0, 0, 0.0

    total_sq = 0.0
    peak = 0
    clipped = 0
    for index in range(0, len(data), 2):
        sample = int.from_bytes(data[index:index + 2], "little", signed=True)
        absolute = abs(sample)
        total_sq += sample * sample
        peak = max(peak, absolute)
        if absolute >= 32700:
            clipped += 1

    return math.sqrt(total_sq / sample_count), peak, (clipped / sample_count) * 100.0


def run_worker():
    args = parse_args()
    if not os.path.isdir(args.model):
        emit("error", code="model_missing")
        return 2

    stop_event = threading.Event()
    audio_queue = queue.Queue(maxsize=20)
    detection_latched = False
    last_detection_at = 0.0
    stats_started_at = time.monotonic()
    max_peak = 0
    rms_total = 0.0
    rms_count = 0
    max_clip_pct = 0.0

    def stop_from_signal(_signum, _frame):
        stop_event.set()

    signal.signal(signal.SIGINT, stop_from_signal)
    signal.signal(signal.SIGTERM, stop_from_signal)

    def watch_stdin():
        for line in sys.stdin:
            try:
                command = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(command, dict) and command.get("type") == "stop":
                stop_event.set()
                return
        # Parent exited or closed the pipe: never retain an orphan microphone.
        stop_event.set()

    threading.Thread(target=watch_stdin, daemon=True).start()

    try:
        SetLogLevel(-1)
        model = Model(args.model)
        recognizer = KaldiRecognizer(model, SAMPLE_RATE, json.dumps(GRAMMAR))
        recognizer.SetWords(False)
    except Exception:
        emit("error", code="model_load_failed")
        return 2

    def audio_callback(indata, _frames, _time_info, status):
        if status:
            emit("error", code="microphone_stream_warning")
        try:
            audio_queue.put_nowait(bytes(indata))
        except queue.Full:
            pass

    emit("ready")
    if stop_event.is_set():
        return 0

    try:
        stream = sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=int(SAMPLE_RATE * BLOCK_MS / 1000),
            dtype="int16",
            channels=CHANNELS,
            callback=audio_callback,
        )
    except Exception:
        emit("error", code="microphone_unavailable")
        return 3

    try:
        with stream:
            emit("listening")
            while not stop_event.is_set():
                try:
                    data = audio_queue.get(timeout=0.1)
                except queue.Empty:
                    continue

                rms, peak, clip_pct = rms_and_peak(data)
                rms_total += rms
                rms_count += 1
                max_peak = max(max_peak, peak)
                max_clip_pct = max(max_clip_pct, clip_pct)

                try:
                    if recognizer.AcceptWaveform(data):
                        text = normalize_text(json.loads(recognizer.Result()).get("text", ""))
                    else:
                        text = normalize_text(json.loads(recognizer.PartialResult()).get("partial", ""))
                except Exception:
                    emit("error", code="recognition_failed")
                    return 4

                now = time.monotonic()
                if (
                    not detection_latched
                    and contains_phrase(text, TARGET)
                    and now - last_detection_at >= DETECTION_COOLDOWN_SECONDS
                ):
                    detection_latched = True
                    last_detection_at = now
                    emit("wake_detected")
                    stop_event.set()

    except Exception:
        emit("error", code="microphone_stream_failed")
        return 3
    finally:
        elapsed = max(time.monotonic() - stats_started_at, 0.001)
        avg_rms = rms_total / rms_count if rms_count else 0.0
        emit(
            "stopped",
            seconds=round(elapsed, 2),
            avgRms=round(avg_rms, 1),
            peak=max_peak,
            clipPct=round(max_clip_pct, 4),
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(run_worker())

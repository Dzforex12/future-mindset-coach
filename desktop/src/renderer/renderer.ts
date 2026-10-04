const openCoachButton = document.querySelector<HTMLButtonElement>("#open-coach");
const launchStatus = document.querySelector<HTMLElement>("#launch-status");
const languageSelect = document.querySelector<HTMLSelectElement>("#voice-language");
const dialectField = document.querySelector<HTMLElement>("#albanian-dialect-field");
const dialectSelect = document.querySelector<HTMLSelectElement>("#albanian-dialect");
const startListeningButton = document.querySelector<HTMLButtonElement>("#start-listening");
const stopListeningButton = document.querySelector<HTMLButtonElement>("#stop-listening");
const voiceStatus = document.querySelector<HTMLElement>("#voice-status");
const uploadConfirmation = document.querySelector<HTMLElement>("#upload-confirmation");
const transcribeButton = document.querySelector<HTMLButtonElement>("#transcribe-audio");
const deleteAudioButton = document.querySelector<HTMLButtonElement>("#delete-audio");
const transcriptPanel = document.querySelector<HTMLElement>("#transcript-panel");
const transcriptInput = document.querySelector<HTMLTextAreaElement>("#transcript");
const clearTranscriptButton = document.querySelector<HTMLButtonElement>("#clear-transcript");
const sendToCoachButton = document.querySelector<HTMLButtonElement>("#send-to-coach");
const microphoneStatus = document.querySelector<HTMLElement>("#microphone-status");

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let recordingChunks: Blob[] = [];
let pendingRecording: Blob | null = null;
let recordingTimeout: number | null = null;
let isStartingRecording = false;
let isTranscribing = false;
let isListening = false;
let isFinalizingRecording = false;

function setVoiceStatus(message: string, state?: "error" | "active" | "ready") {
    if (!voiceStatus) return;
    voiceStatus.textContent = message;
    voiceStatus.dataset.state = state ?? "ready";
}

function getLanguageMode(): "en" | "it" | "sq-standard" | "sq-kosovo" {
    if (languageSelect?.value === "it") return "it";
    if (languageSelect?.value === "sq") {
        return dialectSelect?.value === "kosovo" ? "sq-kosovo" : "sq-standard";
    }
    return "en";
}

function updateVoiceControls() {
    const recordingBusy = isStartingRecording || isListening || isFinalizingRecording || isTranscribing;
    if (startListeningButton) startListeningButton.disabled = recordingBusy || Boolean(pendingRecording);
    if (stopListeningButton) stopListeningButton.hidden = !isListening;
    if (languageSelect) languageSelect.disabled = recordingBusy;
    if (dialectSelect) dialectSelect.disabled = recordingBusy;
    if (transcribeButton) transcribeButton.disabled = isTranscribing || !pendingRecording;
    if (deleteAudioButton) deleteAudioButton.disabled = isTranscribing || !pendingRecording;
    if (sendToCoachButton) sendToCoachButton.disabled = isTranscribing || !transcriptInput?.value.trim();
}

function stopTracks() {
    if (recordingTimeout !== null) {
        window.clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    if (microphoneStatus) microphoneStatus.textContent = "";
}

function finishRecording(reason?: string) {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    isListening = false;
    isFinalizingRecording = true;
    if (stopListeningButton) stopListeningButton.hidden = true;
    setVoiceStatus(reason ?? "Finishing recording…", "ready");
    try {
        mediaRecorder.stop();
        stopTracks();
    } catch {
        stopTracks();
        mediaRecorder = null;
        isFinalizingRecording = false;
        recordingChunks = [];
        setVoiceStatus("Recording stopped unexpectedly. Please try again.", "error");
        updateVoiceControls();
    }
    updateVoiceControls();
}

async function startRecording() {
    if (isStartingRecording || isListening || isTranscribing) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setVoiceStatus("Microphone recording is unavailable in this app.", "error");
        return;
    }

    isStartingRecording = true;
    pendingRecording = null;
    recordingChunks = [];
    if (transcriptInput) transcriptInput.value = "";
    if (transcriptPanel) transcriptPanel.hidden = true;
    if (uploadConfirmation) uploadConfirmation.hidden = true;
    setVoiceStatus("Requesting microphone access…", "ready");
    updateVoiceControls();

    let permissionRequested = false;
    try {
        permissionRequested = await window.coachDesktop.requestMicrophone();
        if (!permissionRequested) {
            setVoiceStatus("Microphone permission was denied. Try again from Start Listening.", "error");
            return;
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: { ideal: 1 },
                sampleRate: { ideal: 16_000 },
                echoCancellation: true,
                noiseSuppression: true,
            },
            video: false,
        });

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "";
        if (!mimeType) {
            stopTracks();
            setVoiceStatus("This device cannot record the required audio format.", "error");
            return;
        }

        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordingChunks.push(event.data);
        };
        mediaRecorder.onerror = () => {
            stopTracks();
            mediaRecorder = null;
            recordingChunks = [];
            pendingRecording = null;
            isListening = false;
            isFinalizingRecording = false;
            setVoiceStatus("Recording failed. Check microphone access and try again.", "error");
            updateVoiceControls();
        };
        mediaRecorder.onstop = () => {
            stopTracks();
            const recordedType = mediaRecorder?.mimeType || "audio/webm";
            mediaRecorder = null;
            isListening = false;
            isFinalizingRecording = false;
            if (recordingChunks.length === 0) {
                recordingChunks = [];
                pendingRecording = null;
                setVoiceStatus("No audio was captured. Please try again.", "error");
            } else {
                pendingRecording = new Blob(recordingChunks, { type: recordedType });
                recordingChunks = [];
                if (uploadConfirmation) uploadConfirmation.hidden = false;
                setVoiceStatus("Recording ready", "ready");
            }
            updateVoiceControls();
        };
        mediaRecorder.start(250);
        isListening = true;
        setVoiceStatus("Listening…", "active");
        if (microphoneStatus) microphoneStatus.textContent = "Microphone active";
        updateVoiceControls();
        recordingTimeout = window.setTimeout(() => {
            finishRecording("Maximum recording time reached. Recording ready.");
        }, 30_000);
    } catch (error) {
        stopTracks();
        mediaRecorder = null;
        recordingChunks = [];
        isListening = false;
        const errorName = error instanceof DOMException ? error.name : "";
        setVoiceStatus(
            errorName === "NotFoundError" || errorName === "DevicesNotFoundError"
                ? "No microphone was found. Connect a microphone and try again."
                : errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
                    ? "Microphone access was denied. Allow access and try again."
                    : "Could not start the microphone. Check its connection and try again.",
            "error",
        );
    } finally {
        isStartingRecording = false;
        if (permissionRequested) {
            await window.coachDesktop.completeMicrophoneRequest().catch(() => false);
        }
        if (!isListening && microphoneStatus) microphoneStatus.textContent = "";
        updateVoiceControls();
    }
}

async function transcribeRecording() {
    if (!pendingRecording || isTranscribing) return;

    const recording = pendingRecording;
    pendingRecording = null;
    isTranscribing = true;
    if (uploadConfirmation) uploadConfirmation.hidden = true;
    setVoiceStatus("Transcribing…", "active");
    updateVoiceControls();

    let audioData: Uint8Array | null = null;
    try {
        audioData = new Uint8Array(await recording.arrayBuffer());
        const result = await window.coachDesktop.transcribeAudio({
            audioData,
            mimeType: recording.type || "audio/webm",
            languageMode: getLanguageMode(),
        });
        if (!result.ok) {
            setVoiceStatus(result.error, "error");
            return;
        }
        if (!result.transcript.trim()) {
            setVoiceStatus("No speech was recognized. Please record again.", "error");
            return;
        }
        if (transcriptInput) transcriptInput.value = result.transcript;
        if (transcriptPanel) transcriptPanel.hidden = false;
        setVoiceStatus("Transcript ready", "ready");
    } catch {
        setVoiceStatus("Could not transcribe this recording. Please check your connection and try again.", "error");
    } finally {
        audioData?.fill(0);
        recordingChunks = [];
        pendingRecording = null;
        isTranscribing = false;
        updateVoiceControls();
    }
}

openCoachButton?.addEventListener("click", async () => {
    if (launchStatus) launchStatus.textContent = "Opening Coach…";

    try {
        await window.coachDesktop.openCoach();
        if (launchStatus) launchStatus.textContent = "Coach is open in the desktop app.";
    } catch {
        if (launchStatus) launchStatus.textContent = "Could not open Coach.";
    }
});

languageSelect?.addEventListener("change", () => {
    if (dialectField) dialectField.hidden = languageSelect.value !== "sq";
});

startListeningButton?.addEventListener("click", () => {
    void startRecording();
});

stopListeningButton?.addEventListener("click", () => {
    finishRecording();
});

transcribeButton?.addEventListener("click", () => {
    void transcribeRecording();
});

deleteAudioButton?.addEventListener("click", () => {
    if (isTranscribing) return;
    pendingRecording = null;
    recordingChunks = [];
    if (uploadConfirmation) uploadConfirmation.hidden = true;
    setVoiceStatus("Recording deleted from this device.", "ready");
    updateVoiceControls();
});

clearTranscriptButton?.addEventListener("click", () => {
    if (transcriptInput) transcriptInput.value = "";
    setVoiceStatus("Transcript cleared.", "ready");
    updateVoiceControls();
    transcriptInput?.focus();
});

transcriptInput?.addEventListener("input", updateVoiceControls);

sendToCoachButton?.addEventListener("click", async () => {
    const transcript = transcriptInput?.value.trim();
    if (!transcript) return;

    sendToCoachButton.disabled = true;
    try {
        const opened = await window.coachDesktop.sendTranscriptToCoach(transcript);
        setVoiceStatus(
            opened
                ? "Transcript copied. Paste it into Mindset Coach."
                : "Could not open Mindset Coach. Your transcript is still here.",
            opened ? "ready" : "error",
        );
    } catch {
        setVoiceStatus("Could not open Mindset Coach. Your transcript is still here.", "error");
    } finally {
        updateVoiceControls();
    }
});

window.addEventListener("beforeunload", () => {
    stopTracks();
    try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    } catch {
        mediaRecorder = null;
    }
    mediaRecorder = null;
    recordingChunks = [];
    pendingRecording = null;
});

updateVoiceControls();

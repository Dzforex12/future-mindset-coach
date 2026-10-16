declare function cleanCoachTextForSpeech(text: string): string;
declare function boundCoachSpeechText(text: string): string;

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
const enableWakeButton = document.querySelector<HTMLButtonElement>("#enable-wake");
const disableWakeButton = document.querySelector<HTMLButtonElement>("#disable-wake");
const wakeStateElement = document.querySelector<HTMLElement>("#wake-state");
const wakeDetailElement = document.querySelector<HTMLElement>("#wake-detail");
const wakeMicrophoneStatus = document.querySelector<HTMLElement>("#wake-microphone-status");
const commandStatus = document.querySelector<HTMLElement>("#command-status");
const commandConfirmation = document.querySelector<HTMLElement>("#command-confirmation");
const runCommandButton = document.querySelector<HTMLButtonElement>("#run-command");
const cancelCommandButton = document.querySelector<HTMLButtonElement>("#cancel-command");
const coachAskPanel = document.querySelector<HTMLElement>("#coach-ask-panel");
const askCoachButton = document.querySelector<HTMLButtonElement>("#ask-coach");
const prepareActionButton = document.querySelector<HTMLButtonElement>("#prepare-action");
const cancelCoachButton = document.querySelector<HTMLButtonElement>("#cancel-coach");
const actionProposalPanel = document.querySelector<HTMLElement>("#action-proposal-panel");
const actionConfirmation = document.querySelector<HTMLElement>("#action-confirmation");
const approveActionButton = document.querySelector<HTMLButtonElement>("#approve-action");
const cancelActionButton = document.querySelector<HTMLButtonElement>("#cancel-action");
const coachResponsePanel = document.querySelector<HTMLElement>("#coach-response-panel");
const coachResponseElement = document.querySelector<HTMLElement>("#coach-response");
const stopSpeakingButton = document.querySelector<HTMLButtonElement>("#stop-speaking");
const closeCoachResponseButton = document.querySelector<HTMLButtonElement>("#close-coach-response");
const speechStatus = document.querySelector<HTMLElement>("#speech-status");
let speechFlowBusy = false;
let dynamicSpeechActive = false;
let dynamicSpeechFlowComplete = true;
let voiceDisposed = false;
const localResponses = new LocalVoiceResponses((state, message) => {
    if (speechStatus) {
        speechStatus.hidden = !message;
        speechStatus.textContent = message;
        speechStatus.dataset.state = state;
    }
});
let commandToken: string | null = null;
let commandReviewVersion = 0;
let commandReviewPending = false;
let commandRunning = false;
let coachRequestPending = false;
let coachRequestVersion = 0;
let actionPlanning = false;
let actionRunning = false;
let actionProposalId: string | null = null;
let actionRequestVersion = 0;

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let recordingChunks: Blob[] = [];
let pendingRecording: Blob | null = null;
let recordingTimeout: number | null = null;
let isStartingRecording = false;
let isTranscribing = false;
let isListening = false;
let isFinalizingRecording = false;
let currentWakeStatus: WakeStatus = {
    enabled: false,
    state: "off",
    microphoneActive: false,
    message: "Wake Word OFF",
};
let lastWakeHandoffId: string | null = null;

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
    const responseVisible = coachResponsePanel?.hidden === false;
    const actionBusy = actionPlanning || actionRunning || Boolean(actionProposalId);
    const recordingBusy = isStartingRecording || isListening || isFinalizingRecording || isTranscribing || speechFlowBusy || coachRequestPending || responseVisible || actionBusy;
    const commandBusy = commandReviewPending || commandRunning || Boolean(commandToken) || actionBusy;
    if (startListeningButton) startListeningButton.disabled = recordingBusy || Boolean(pendingRecording) || commandBusy;
    if (transcriptInput) transcriptInput.disabled = recordingBusy || commandRunning;
    if (clearTranscriptButton) clearTranscriptButton.disabled = recordingBusy || commandRunning;
    if (runCommandButton) runCommandButton.disabled = !commandToken || commandReviewPending || commandRunning;
    if (cancelCommandButton) cancelCommandButton.disabled = commandRunning || speechFlowBusy;
    if (stopListeningButton) stopListeningButton.hidden = !isListening;
    if (stopSpeakingButton) {
        stopSpeakingButton.hidden = !dynamicSpeechActive;
        stopSpeakingButton.disabled = !dynamicSpeechActive;
    }
    if (languageSelect) languageSelect.disabled = recordingBusy;
    if (dialectSelect) dialectSelect.disabled = recordingBusy;
    if (transcribeButton) transcribeButton.disabled = isTranscribing || !pendingRecording;
    if (deleteAudioButton) deleteAudioButton.disabled = isTranscribing || !pendingRecording;
    if (sendToCoachButton) sendToCoachButton.disabled = recordingBusy || commandReviewPending || commandRunning || !transcriptInput?.value.trim();
    if (askCoachButton) askCoachButton.disabled = coachRequestPending || actionBusy || !transcriptInput?.value.trim();
    if (prepareActionButton) prepareActionButton.disabled = coachRequestPending || actionBusy || !transcriptInput?.value.trim();
    if (cancelCoachButton) cancelCoachButton.disabled = actionPlanning ? false : !coachRequestPending && coachAskPanel?.hidden !== false;
    if (approveActionButton) approveActionButton.disabled = !actionProposalId || actionRunning || actionPlanning;
    if (cancelActionButton) cancelActionButton.disabled = !actionProposalId || actionRunning;
    updateWakeControls();
}

function updateWakeControls() {
    const voiceBusy = isStartingRecording || isListening || isFinalizingRecording || isTranscribing || Boolean(pendingRecording) || coachRequestPending || coachResponsePanel?.hidden === false;
    const wakeBusy = currentWakeStatus.state === "starting" || currentWakeStatus.state === "handoff";
    if (enableWakeButton) enableWakeButton.disabled = currentWakeStatus.enabled || voiceBusy || wakeBusy;
    if (disableWakeButton) disableWakeButton.disabled = !currentWakeStatus.enabled && currentWakeStatus.state !== "error";
}

function renderWakeStatus(status: WakeStatus) {
    currentWakeStatus = status;

    let title = "Wake Word OFF";
    let detail = "Say \"Future Mindset Coach, wake up\" after enabling.";

    if (status.state === "starting") {
        title = "Wake Word ON";
        detail = "Starting local wake listener...";
    } else if (status.state === "listening") {
        title = "Wake Word ON";
        detail = "Listening locally...";
    } else if (status.state === "detected") {
        title = "Wake detected";
        detail = "Handing off to Voice Coach...";
    } else if (status.state === "handoff") {
        title = "I'm listening...";
        detail = "Handing off to Voice Coach...";
    } else if (status.state === "paused") {
        title = status.enabled ? "Wake Word ON" : "Wake Word OFF";
        detail = status.message;
    } else if (status.state === "error") {
        title = "Error";
        detail = status.message;
    }

    if (wakeStateElement) wakeStateElement.textContent = title;
    if (wakeDetailElement) wakeDetailElement.textContent = detail;
    if (wakeMicrophoneStatus) {
        wakeMicrophoneStatus.textContent = status.microphoneActive
            ? "Microphone active"
            : status.state === "paused"
                ? "Microphone paused"
                : "";
    }
    updateWakeControls();
}

async function completeVoiceFlow() {
    await window.coachDesktop.completeVoiceFlow().catch(() => false);
}

async function speakResponse(response: string, id: string): Promise<boolean> {
    if (voiceDisposed || isListening || mediaStream || speechFlowBusy) return false;
    speechFlowBusy = true;
    updateVoiceControls();
    try {
        const safe = await localResponses.speak(response);
        if (!safe || voiceDisposed) return false;
        return await window.coachDesktop.completeSpeech(id);
    } catch {
        setVoiceStatus("Voice response could not complete. Microphone remains paused.", "error");
        return false;
    } finally {
        speechFlowBusy = false;
        updateVoiceControls();
    }
}

async function speakCoachResponse(response: string): Promise<void> {
    const speechText = boundCoachSpeechText(cleanCoachTextForSpeech(response));
    dynamicSpeechActive = true;
    dynamicSpeechFlowComplete = false;
    speechFlowBusy = true;
    updateVoiceControls();
    try {
        if (!speechText) {
            setVoiceStatus("Coach response is visible, but there is no speech text.", "error");
            return;
        }
        await localResponses.speakText(speechText, getLanguageMode());
    } catch {
        setVoiceStatus("Coach response is visible, but local speech failed.", "error");
    } finally {
        dynamicSpeechActive = false;
        speechFlowBusy = false;
        updateVoiceControls();
        await completeDynamicSpeechFlow();
    }
}

async function completeDynamicSpeechFlow() {
    if (dynamicSpeechFlowComplete) return;
    dynamicSpeechFlowComplete = true;
    await completeVoiceFlow();
}

async function acknowledgeWake(id: string) {
    if (await speakResponse("wake", id)) {
        if (!voiceDisposed) await startRecording("wake");
    }
}

async function reviewCommand() {
    const version = ++commandReviewVersion;
    coachRequestVersion++;
    actionRequestVersion++;
    if (actionProposalId) {
        const staleProposalId = actionProposalId;
        actionProposalId = null;
        void window.coachDesktop.cancelAction(staleProposalId);
    }
    if (actionProposalPanel) actionProposalPanel.hidden = true;
    coachRequestPending = false;
    commandToken = null;
    commandReviewPending = true;
    if (commandConfirmation) commandConfirmation.hidden = true;
    if (coachAskPanel) coachAskPanel.hidden = true;
    if (coachResponsePanel) coachResponsePanel.hidden = true;
    if (commandStatus) commandStatus.textContent = "";
    updateVoiceControls();
    try {
        const result = await window.coachDesktop.prepareCommand(transcriptInput?.value ?? "");
        if (version !== commandReviewVersion) return;
        commandToken = result?.token ?? null;
        if (commandStatus) commandStatus.textContent = result
            ? `Command recognized: ${result.label}`
            : "No safe desktop command recognized.";
        if (commandConfirmation) commandConfirmation.hidden = !result;
        if (coachAskPanel) coachAskPanel.hidden = Boolean(result);
    } catch {
        if (version === commandReviewVersion && commandStatus) commandStatus.textContent = "Command recognition unavailable. No command was run.";
    } finally {
        if (version === commandReviewVersion) commandReviewPending = false;
        updateVoiceControls();
    }
}

async function cancelCommand() {
    commandReviewVersion++;
    coachRequestVersion++;
    actionRequestVersion++;
    actionPlanning = false;
    if (actionProposalId) {
        const staleProposalId = actionProposalId;
        actionProposalId = null;
        void window.coachDesktop.cancelAction(staleProposalId);
    }
    coachRequestPending = false;
    commandToken = null;
    commandReviewPending = false;
    if (commandConfirmation) commandConfirmation.hidden = true;
    if (coachAskPanel) coachAskPanel.hidden = true;
    if (actionProposalPanel) actionProposalPanel.hidden = true;
    if (coachResponsePanel) coachResponsePanel.hidden = true;
    if (commandStatus) commandStatus.textContent = "Command cancelled.";
    updateVoiceControls();
    await window.coachDesktop.cancelCommand();
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
        void completeVoiceFlow();
        updateVoiceControls();
    }
    updateVoiceControls();
}

async function startRecording(trigger: "manual" | "wake" = "manual") {
    if (voiceDisposed || speechFlowBusy || isStartingRecording || isListening || isTranscribing || pendingRecording || commandToken || commandReviewPending || commandRunning) {
        if (trigger === "wake") await completeVoiceFlow();
        return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setVoiceStatus("Microphone recording is unavailable in this app.", "error");
        if (trigger === "wake") await completeVoiceFlow();
        return;
    }

    isStartingRecording = true;
    pendingRecording = null;
    recordingChunks = [];
    if (transcriptInput) transcriptInput.value = "";
    if (transcriptPanel) transcriptPanel.hidden = true;
    if (commandStatus) commandStatus.textContent = "";
    if (uploadConfirmation) uploadConfirmation.hidden = true;
    setVoiceStatus(
        trigger === "wake" ? "I'm listening..." : "Requesting microphone access...",
        trigger === "wake" ? "active" : "ready",
    );
    updateVoiceControls();

    let permissionRequested = false;
    let recordingStarted = false;
    try {
        permissionRequested = await window.coachDesktop.requestMicrophone();
        if (!permissionRequested) {
            setVoiceStatus("Microphone permission was denied. Try again from Start Listening.", "error");
            await completeVoiceFlow();
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
            await completeVoiceFlow();
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
            void completeVoiceFlow();
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
                void completeVoiceFlow();
            } else {
                pendingRecording = new Blob(recordingChunks, { type: recordedType });
                recordingChunks = [];
                if (uploadConfirmation) uploadConfirmation.hidden = false;
                setVoiceStatus("Recording ready", "ready");
            }
            updateVoiceControls();
        };
        mediaRecorder.start(250);
        recordingStarted = true;
        isListening = true;
        setVoiceStatus(trigger === "wake" ? "I'm listening..." : "Listening...", "active");
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
        if (!recordingStarted) await completeVoiceFlow();
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
        await reviewCommand();
    } catch {
        setVoiceStatus("Could not transcribe this recording. Please check your connection and try again.", "error");
    } finally {
        audioData?.fill(0);
        recordingChunks = [];
        pendingRecording = null;
        isTranscribing = false;
        updateVoiceControls();
        await completeVoiceFlow();
    }
}

const removeWakeStatusListener = window.coachDesktop.onWakeStatus((status) => {
    renderWakeStatus(status);
    if (status.state === "handoff" && status.handoffId && status.handoffId !== lastWakeHandoffId) {
        lastWakeHandoffId = status.handoffId;
        void acknowledgeWake(status.handoffId);
    }
});

void window.coachDesktop.getWakeStatus().then((status) => {
    if (status) renderWakeStatus(status);
}).catch(() => {
    renderWakeStatus({
        enabled: false,
        state: "error",
        microphoneActive: false,
        message: "Wake Word status is unavailable.",
    });
});

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

enableWakeButton?.addEventListener("click", async () => {
    if (enableWakeButton) enableWakeButton.disabled = true;
    try {
        const status = await window.coachDesktop.enableWake();
        if (status) renderWakeStatus(status);
    } catch {
        renderWakeStatus({
            enabled: false,
            state: "error",
            microphoneActive: false,
            message: "Wake Word could not be enabled.",
        });
    } finally {
        updateWakeControls();
    }
});

disableWakeButton?.addEventListener("click", async () => {
    if (disableWakeButton) disableWakeButton.disabled = true;
    try {
        const status = await window.coachDesktop.disableWake();
        if (status) renderWakeStatus(status);
    } catch {
        renderWakeStatus({
            enabled: false,
            state: "error",
            microphoneActive: false,
            message: "Wake Word could not be disabled.",
        });
    } finally {
        updateWakeControls();
    }
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
    void completeVoiceFlow();
});

clearTranscriptButton?.addEventListener("click", () => {
    if (transcriptInput) transcriptInput.value = "";
    setVoiceStatus("Transcript cleared.", "ready");
    updateVoiceControls();
    void cancelCommand().catch(() => setVoiceStatus("Could not cancel command. Please retry.", "error"));
    transcriptInput?.focus();
});

transcriptInput?.addEventListener("input", () => { void reviewCommand(); });

cancelCommandButton?.addEventListener("click", () => {
    void cancelCommand().catch(() => setVoiceStatus("Could not cancel command. Please retry.", "error"));
});

runCommandButton?.addEventListener("click", async () => {
    if (!commandToken || commandRunning || commandReviewPending) return;
    const token = commandToken;
    commandToken = null;
    commandRunning = true;
    updateVoiceControls();
    try {
        const ran = await window.coachDesktop.runCommand(token);
        if (commandStatus) commandStatus.textContent = ran ? "Command opened in Coach." : "Command expired. Edit the transcript to review again.";
        if (ran) await speakResponse(ran.response, ran.speechId);
    } catch {
        if (commandStatus) commandStatus.textContent = "Could not run command. Please edit the transcript and retry.";
    } finally {
        commandRunning = false;
        if (commandConfirmation) commandConfirmation.hidden = true;
        updateVoiceControls();
    }
});

askCoachButton?.addEventListener("click", async () => {
    const transcript = transcriptInput?.value.trim();
    if (!transcript || coachRequestPending) return;

    const version = ++coachRequestVersion;
    coachRequestPending = true;
    if (coachAskPanel) coachAskPanel.hidden = false;
    if (commandStatus) commandStatus.textContent = "Thinking...";
    setVoiceStatus("Thinking...", "active");
    updateVoiceControls();

    try {
        const result = await window.coachDesktop.askCoach(transcript, getLanguageMode());
        if (version !== coachRequestVersion) return;
        if (!result.ok) {
            setVoiceStatus(result.error, "error");
            if (commandStatus) commandStatus.textContent = result.error;
            return;
        }

        if (coachResponseElement) coachResponseElement.textContent = result.response;
        if (coachAskPanel) coachAskPanel.hidden = true;
        if (coachResponsePanel) coachResponsePanel.hidden = false;
        if (commandStatus) commandStatus.textContent = "Coach response ready.";
        setVoiceStatus("Coach response ready", "ready");
        await speakCoachResponse(result.response);
    } catch {
        if (version === coachRequestVersion) {
            setVoiceStatus("Coach could not respond. Please try again.", "error");
            if (commandStatus) commandStatus.textContent = "Coach could not respond. Please try again.";
        }
    } finally {
        if (version === coachRequestVersion) {
            coachRequestPending = false;
            updateVoiceControls();
        }
    }
});

prepareActionButton?.addEventListener("click", async () => {
    const transcript = transcriptInput?.value.trim();
    if (!transcript || actionPlanning || actionProposalId) return;

    const version = ++actionRequestVersion;
    actionPlanning = true;
    coachRequestVersion++;
    if (commandStatus) commandStatus.textContent = "Preparing a safe action...";
    setVoiceStatus("Preparing a safe action...", "active");
    updateVoiceControls();

    try {
        const result = await window.coachDesktop.prepareAction(transcript, getLanguageMode());
        if (version !== actionRequestVersion) return;
        if (!result.ok) {
            setVoiceStatus(result.error, "error");
            if (commandStatus) commandStatus.textContent = result.error;
            return;
        }
        if (result.kind === "no_action") {
            if (commandStatus) commandStatus.textContent = "No safe action was identified.";
            setVoiceStatus("No safe action was identified.", "ready");
            if (coachAskPanel) coachAskPanel.hidden = false;
            return;
        }

        actionProposalId = result.proposalId;
        if (actionConfirmation) actionConfirmation.textContent = result.confirmation;
        if (coachAskPanel) coachAskPanel.hidden = true;
        if (actionProposalPanel) actionProposalPanel.hidden = false;
        if (commandStatus) commandStatus.textContent = "Action requires your approval.";
        setVoiceStatus("Review the proposed action.", "ready");
    } catch {
        if (version === actionRequestVersion) {
            setVoiceStatus("No safe action could be prepared right now.", "error");
            if (commandStatus) commandStatus.textContent = "No safe action could be prepared right now.";
        }
    } finally {
        if (version === actionRequestVersion) {
            actionPlanning = false;
            updateVoiceControls();
        }
    }
});

approveActionButton?.addEventListener("click", async () => {
    const proposalId = actionProposalId;
    if (!proposalId || actionRunning) return;
    actionRunning = true;
    if (commandStatus) commandStatus.textContent = "Opening the approved page...";
    setVoiceStatus("Opening the approved page...", "active");
    updateVoiceControls();

    try {
        const result = await window.coachDesktop.approveAction(proposalId);
        actionProposalId = null;
        if (actionProposalPanel) actionProposalPanel.hidden = true;
        if (result.ok) {
            if (commandStatus) commandStatus.textContent = result.message;
            setVoiceStatus(result.message, "ready");
        } else {
            if (commandStatus) commandStatus.textContent = result.error;
            setVoiceStatus(result.error, "error");
        }
    } catch {
        actionProposalId = null;
        if (actionProposalPanel) actionProposalPanel.hidden = true;
        setVoiceStatus("The approved action could not be completed.", "error");
        if (commandStatus) commandStatus.textContent = "The approved action could not be completed.";
    } finally {
        actionRunning = false;
        updateVoiceControls();
    }
});

cancelActionButton?.addEventListener("click", async () => {
    const proposalId = actionProposalId;
    if (!proposalId || actionRunning) return;
    actionRequestVersion++;
    actionProposalId = null;
    if (actionProposalPanel) actionProposalPanel.hidden = true;
    if (coachAskPanel) coachAskPanel.hidden = false;
    try {
        await window.coachDesktop.cancelAction(proposalId);
        setVoiceStatus("Action cancelled.", "ready");
        if (commandStatus) commandStatus.textContent = "Action cancelled.";
    } catch {
        setVoiceStatus("Could not cancel the action safely.", "error");
    } finally {
        updateVoiceControls();
    }
});

cancelCoachButton?.addEventListener("click", () => {
    void cancelCommand().catch(() => setVoiceStatus("Could not cancel Coach. Please retry.", "error"));
});

stopSpeakingButton?.addEventListener("click", async () => {
    if (!dynamicSpeechActive) return;
    dynamicSpeechActive = false;
    stopSpeakingButton.hidden = true;
    await localResponses.cancel();
    setVoiceStatus("Coach response remains on screen.", "ready");
    updateVoiceControls();
    await completeDynamicSpeechFlow();
});

closeCoachResponseButton?.addEventListener("click", async () => {
    coachRequestVersion++;
    coachRequestPending = false;
    if (dynamicSpeechActive) {
        dynamicSpeechActive = false;
        await localResponses.cancel();
    }
    if (coachResponsePanel) coachResponsePanel.hidden = true;
    setVoiceStatus("Coach response closed.", "ready");
    updateVoiceControls();
    await completeDynamicSpeechFlow();
});

sendToCoachButton?.addEventListener("click", async () => {
    const transcript = transcriptInput?.value.trim();
    if (!transcript) return;

    sendToCoachButton.disabled = true;
    try {
        await cancelCommand();
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
    voiceDisposed = true;
    localResponses.cancel();
    removeWakeStatusListener();
    stopTracks();
    try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    } catch {
        mediaRecorder = null;
    }
    mediaRecorder = null;
    recordingChunks = [];
    pendingRecording = null;
    void completeVoiceFlow();
});

updateVoiceControls();

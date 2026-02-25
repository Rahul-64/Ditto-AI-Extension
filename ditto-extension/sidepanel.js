/**
 * Ditto — Side Panel Script (Bugfix: Auto-context + Continuous Voice)
 *
 * Bug Fixes:
 * 1. Auto-starts conversation when highlighted text is captured
 * 2. Continuous voice mode — silence detection auto-sends, auto-re-listens after TTS
 */

// ── Configuration ──
const API_BASE = "https://ditto-ai.onrender.com";
const SILENCE_THRESHOLD = 15;   // RMS level below which = silence
const SILENCE_DURATION = 3000;  // 5s of silence before auto-stop (gives time to think)
const MIN_RECORDING_TIME = 3000; // 3s minimum before silence detection kicks in

// ── DOM References ──
const chatHistory = document.getElementById("chatHistory");
const welcomeCard = document.getElementById("welcomeCard");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const micIcon = document.getElementById("micIcon");
const voiceStatus = document.getElementById("voiceStatus");
const audioPlayer = document.getElementById("audioPlayer");
const contextCard = document.getElementById("contextCard");
const contextText = document.getElementById("contextText");
const contextSource = document.getElementById("contextSource");

// ── State ──
let currentContext = "";
let currentSourceUrl = "";
let conversationActive = false;  // voice loop active flag
let micStream = null;
let mediaRecorder = null;
let audioChunks = [];
let analyser = null;
let audioContext = null;
let hasAutoStarted = false;  // prevent double auto-start

// ═══════════════════════════════════════════
// CONTEXT MANAGEMENT
// ═══════════════════════════════════════════

function loadContext() {
    chrome.storage.local.get("dittoContext", (result) => {
        const ctx = result.dittoContext;
        if (ctx && ctx.text) {
            showContext(ctx.text, ctx.url);
            // Auto-start conversation on first context load
            if (!hasAutoStarted) {
                hasAutoStarted = true;
                autoStartConversation(ctx.text, ctx.url);
            }
        }
    });
}

function showContext(text, url) {
    currentContext = text;
    currentSourceUrl = url || "";

    if (contextCard && contextText) {
        contextText.textContent = text;
        contextSource.textContent = url ? `Source: ${url}` : "";
        contextCard.style.display = "block";
    }
}

// Listen for live context updates (user highlights new text while panel is open)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.dittoContext) {
        const ctx = changes.dittoContext.newValue;
        if (ctx && ctx.text) {
            showContext(ctx.text, ctx.url);
            // Auto-start for new context too
            autoStartConversation(ctx.text, ctx.url);
        }
    }
});

// ═══════════════════════════════════════════
// AUTO-START: Send initial AI greeting on context capture
// ═══════════════════════════════════════════

async function autoStartConversation(text, url) {
    if (welcomeCard) welcomeCard.style.display = "none";
    showTyping();

    try {
        const aiResponse = await sendToBackend("Analyze and explain this highlighted text for me.");
        removeTyping();
        appendMessage("ai", aiResponse);
    } catch (err) {
        removeTyping();
        appendMessage("ai", `⚠️ Could not connect to server. Make sure it's running on ${API_BASE}`);
        console.error("Auto-start error:", err);
    }
}

// ═══════════════════════════════════════════
// CHAT UI HELPERS
// ═══════════════════════════════════════════

function appendMessage(sender, text) {
    if (welcomeCard) welcomeCard.style.display = "none";

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", `message-${sender}`);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.textContent = text;

    const meta = document.createElement("div");
    meta.classList.add("msg-meta");
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.textContent = `${sender === "user" ? "You" : "Ditto"} · ${time}`;

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(meta);
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "message-ai");
    typingDiv.id = "typingIndicator";
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", "typing-indicator");
    bubble.innerHTML = "<span></span><span></span><span></span>";
    typingDiv.appendChild(bubble);
    chatHistory.appendChild(typingDiv);
    scrollToBottom();
}

function removeTyping() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    });
}

function setInputEnabled(enabled) {
    userInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    sendBtn.style.opacity = enabled ? "1" : "0.5";
}

function setVoiceStatus(text, className) {
    voiceStatus.textContent = text;
    voiceStatus.className = "voice-status" + (className ? ` ${className}` : "");
}

// ═══════════════════════════════════════════
// TEXT CHAT
// ═══════════════════════════════════════════

async function sendToBackend(message) {
    const payload = {
        message: message,
        context: currentContext,
        sourceUrl: currentSourceUrl,
    };

    const response = await fetch(`${API_BASE}/api/extension-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${response.status})`);
    }

    const data = await response.json();
    return data.response;
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    userInput.value = "";
    userInput.style.height = "auto";

    setInputEnabled(false);
    showTyping();

    try {
        const aiResponse = await sendToBackend(text);
        removeTyping();
        appendMessage("ai", aiResponse);
    } catch (err) {
        removeTyping();
        appendMessage("ai", `⚠️ Error: ${err.message}`);
        console.error("Ditto API error:", err);
    } finally {
        setInputEnabled(true);
        userInput.focus();
    }
}

// ═══════════════════════════════════════════
// CONTINUOUS VOICE LOOP (ported from Rude-AI)
// ═══════════════════════════════════════════

// Acquire mic stream once and keep it alive
async function acquireMic() {
    if (micStream) return micStream;
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup audio analyser for silence detection
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    return micStream;
}

function releaseMic() {
    if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
    }
    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
        analyser = null;
    }
}

// Start recording with automatic silence detection
function startListening() {
    if (!micStream || !conversationActive) return;

    audioChunks = [];
    mediaRecorder = new MediaRecorder(micStream, { mimeType: "audio/webm;codecs=opus" });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
        if (!conversationActive) return;
        if (audioChunks.length === 0) {
            if (conversationActive) startListening();
            return;
        }
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        await processVoice(audioBlob);
    };

    mediaRecorder.start(250); // collect in 250ms chunks
    setVoiceStatus("🎙️ Listening... speak now", "listening");
    micIcon.textContent = "graphic_eq";

    // Start silence detection
    const recordStartTime = Date.now();
    monitorSilence(recordStartTime);
}

// Monitor audio levels and auto-stop on silence
function monitorSilence(recordStartTime) {
    if (!analyser || !conversationActive) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let silenceStart = null;

    function check() {
        if (!conversationActive) return;

        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length) * 100;

        const elapsed = Date.now() - recordStartTime;

        if (rms < SILENCE_THRESHOLD && elapsed > MIN_RECORDING_TIME) {
            if (!silenceStart) silenceStart = Date.now();
            if (Date.now() - silenceStart >= SILENCE_DURATION) {
                // Silence detected — auto-stop recording
                stopListening();
                return;
            }
        } else {
            silenceStart = null; // reset on sound
        }

        requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
}

function stopListening() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setVoiceStatus("⏳ Processing...", "processing");
        micIcon.textContent = "hourglass_top";
    }
}

// Process voice → API → play response → auto re-listen
async function processVoice(audioBlob) {
    setVoiceStatus("⏳ Processing...", "processing");
    showTyping();

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("context", currentContext);
    formData.append("sourceUrl", currentSourceUrl);

    try {
        const response = await fetch(`${API_BASE}/api/extension-voice`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            removeTyping();
            // Could not understand — auto re-listen
            if (conversationActive) {
                setVoiceStatus("Couldn't understand — listening again...", "listening");
                setTimeout(() => { if (conversationActive) startListening(); }, 500);
            }
            return;
        }

        const data = await response.json();
        removeTyping();

        // Show transcribed user message
        if (data.transcript) {
            appendMessage("user", data.transcript);
        }

        // Show AI response
        appendMessage("ai", data.response);

        // Play TTS audio, then auto re-listen
        if (data.audio) {
            setVoiceStatus("🔊 Speaking...", "speaking");
            micIcon.textContent = "volume_up";

            const blob = base64ToBlob(data.audio, "audio/wav");
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.onended = () => {
                URL.revokeObjectURL(url);
                // ── AUTO RE-LISTEN → continuous loop ──
                if (conversationActive) {
                    startListening();
                }
            };
            audioPlayer.onerror = () => {
                if (conversationActive) startListening();
            };
            audioPlayer.play().catch(() => {
                if (conversationActive) startListening();
            });
        } else {
            // No audio — auto re-listen immediately
            if (conversationActive) startListening();
        }
    } catch (err) {
        removeTyping();
        appendMessage("ai", `⚠️ Voice error: ${err.message}`);
        console.error("Ditto voice error:", err);
        // Keep loop going on error
        if (conversationActive) {
            setVoiceStatus("Connection error — retrying...", "listening");
            setTimeout(() => { if (conversationActive) startListening(); }, 1000);
        }
    }
}

function base64ToBlob(b64, mime) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// Start the continuous voice conversation
async function beginVoiceConversation() {
    try {
        await acquireMic();
        conversationActive = true;
        micBtn.classList.add("recording");
        setInputEnabled(false);
        startListening();
    } catch (err) {
        setVoiceStatus("⚠️ Microphone access denied", "");
        console.error("Mic error:", err);
        setTimeout(() => setVoiceStatus("", ""), 3000);
    }
}

// Stop the voice conversation
function endVoiceConversation() {
    conversationActive = false;
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    releaseMic();
    micBtn.classList.remove("recording");
    micIcon.textContent = "mic";
    setVoiceStatus("", "");
    setInputEnabled(true);
}

// ═══════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════

// Send button
sendBtn.addEventListener("click", handleSend);

// Enter key (Shift+Enter for newline)
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Auto-grow textarea
userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + "px";
});

// Mic button — toggle continuous voice conversation
micBtn.addEventListener("click", () => {
    if (conversationActive) {
        endVoiceConversation();
    } else {
        beginVoiceConversation();
    }
});

// Space to interrupt AI speech
document.addEventListener("keydown", (e) => {
    if (e.key === " " && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (audioPlayer && !audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            if (conversationActive) startListening();
        }
    }
});

// ── Initialize ──
document.addEventListener("DOMContentLoaded", loadContext);

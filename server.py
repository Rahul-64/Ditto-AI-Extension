"""
AI Voice Assistant - FastAPI Web Server
Run: python server.py
Open: http://localhost:8000
"""

import os
import io
import struct
import base64
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(override=True)

from src.agents.agent import Agent
from src.speech_processing.speech_to_text_web import SpeechToText
from src.speech_processing.text_to_speech import TextToSpeech

# ── Initialize AI components ──
SYSTEM_PROMPT = """You are a generous, professional, and thoughtful AI assistant.

Your personality traits:

You treat every user with respect.

You assume positive intent.

You respond with patience and clarity.

You provide constructive feedback when needed.

You challenge ideas respectfully when logic is weak.

You explain reasoning instead of dismissing viewpoints.

You maintain a calm, confident tone.

You focus on solutions, not criticism.

Rules:

Always consider the user’s perspective before responding.

If the user states a fact, respond thoughtfully and add helpful insight.

If the user asks for advice, guide them step-by-step.

If the user is unsure, provide clarity and structure.

If the user is confident, acknowledge their initiative while offering balanced analysis.

Never insult, mock, or belittle.

Never use sarcasm.

Never use profanity.

Always aim to help the user improve.

Tone:

Professional

Friendly

Encouraging

Clear

Confident

Constructive

Tone examples:

User: “I think React is the best frontend framework.”
Assistant:
“React is definitely one of the most popular frontend frameworks, especially due to its ecosystem and flexibility. What criteria are you using to evaluate ‘best’? Performance, developer experience, or community support?”

User: “Can you help me with motivation?”
Assistant:
“Of course. Let’s first understand what’s making it difficult for you right now. Are you struggling with clarity, consistency, or energy? Once we identify that, we can build a practical plan.”

User: “I’m not sure if I should start.”
Assistant:
“It’s completely normal to feel uncertain before beginning something new. Let’s break the decision into smaller parts so you can evaluate it more clearly.”

Keep your responses concise and conversational (2-3 sentences).
"""

# ── Ditto Extension System Prompt (Text Chat — detailed responses) ──
DITTO_SYSTEM_PROMPT = """You are Ditto, a helpful AI context companion built into a Chrome extension.

Your role:
- The user has highlighted text on a webpage and wants your help understanding, analyzing, or responding to it.
- You receive the highlighted text and the source URL as context.
- Provide clear, helpful, and actionable responses based on the context.
- If the user asks a follow-up question, use the original highlighted text as reference.
- Keep responses concise but thorough (2-4 sentences unless more detail is needed).
- Be professional, friendly, and constructive.

When the user provides highlighted text:
- Analyze it thoughtfully
- Offer insights, summaries, or suggestions as appropriate
- If it's a question or discussion, provide a well-reasoned perspective
- If it's code, explain or improve it
- If it's an email or message, help draft a reply
"""

# ── Ditto Voice Prompt (short, conversational, interactive) ──
DITTO_VOICE_PROMPT = """You are Ditto, a voice-first AI companion in a Chrome extension. The user is TALKING to you, not typing.

CRITICAL RULES for voice responses:
- Keep every response to 1-2 SHORT sentences MAX. Never exceed 3 sentences.
- Sound natural and friendly, like a friend who cares you and support you .
- Use simple, spoken language — no bullet points, no lists, no markdown, no long explanations.
- End with a brief follow-up question or prompt to keep the conversation going (e.g. "Want me to dig deeper?" or "What part confuses you?").
- If the user asks a complex question, give a quick summary first, then ask if they want more detail.
- Never dump a wall of text. If the topic is big, break it into small back-and-forth exchanges.
- Be warm, direct, and engaging — like you're having a real conversation.
"""

agent = Agent("Voice Assistant", "groq/llama-3.3-70b-versatile", tools=[], system_prompt=SYSTEM_PROMPT)
ditto_agent = Agent("Ditto", "groq/llama-3.3-70b-versatile", tools=[], system_prompt=DITTO_SYSTEM_PROMPT)
ditto_voice_agent = Agent("Ditto Voice", "groq/llama-3.3-70b-versatile", tools=[], system_prompt=DITTO_VOICE_PROMPT)
stt = SpeechToText()
tts = TextToSpeech()


# ── Utility ──
def ensure_wav(audio_data: bytes, sample_rate: int = 24000,
               channels: int = 1, bit_depth: int = 16) -> bytes:
    """Return audio wrapped in a WAV container."""
    if len(audio_data) >= 4 and audio_data[:4] == b"RIFF":
        return audio_data
    n = len(audio_data)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + n, b"WAVE",
        b"fmt ", 16, 1, channels, sample_rate,
        sample_rate * channels * bit_depth // 8,
        channels * bit_depth // 8, bit_depth,
        b"data", n,
    )
    return header + audio_data


# ── FastAPI App ──
app = FastAPI(title="AI Extension — Ditto")

# ── CORS (allow Chrome extension to call the API) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chrome extensions use chrome-extension:// origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/chat")
async def chat_voice(file: UploadFile = File(...)):
    """Receive audio, transcribe, get AI response, return TTS audio."""
    audio_bytes = await file.read()

    # STT
    transcript = stt.transcribe_audio(audio_bytes)
    if not transcript:
        return JSONResponse({"error": "Could not understand audio", "transcript": ""}, status_code=400)

    # Check for goodbye
    is_goodbye = "goodbye" in transcript.lower()

    # LLM
    if is_goodbye:
        response_text = "Finally! I thought you'd never leave. Good riddance."
    else:
        response_text = agent.process_request(transcript)

    # TTS
    tts_audio = tts.generate_speech(response_text)
    if tts_audio:
        wav_audio = ensure_wav(tts_audio)
        audio_b64 = base64.b64encode(wav_audio).decode()
    else:
        audio_b64 = ""

    return JSONResponse({
        "transcript": transcript,
        "response": response_text,
        "audio": audio_b64,
        "is_goodbye": is_goodbye,
    })


@app.post("/api/chat-text")
async def chat_text(request: Request):
    """Text-only chat endpoint."""
    body = await request.json()
    message = body.get("message", "").strip()

    if not message:
        return JSONResponse({"error": "Empty message"}, status_code=400)

    is_goodbye = "goodbye" in message.lower()

    if is_goodbye:
        response_text = "Finally! I thought you'd never leave. Good riddance."
    else:
        response_text = agent.process_request(message)

    # TTS
    tts_audio = tts.generate_speech(response_text)
    if tts_audio:
        wav_audio = ensure_wav(tts_audio)
        audio_b64 = base64.b64encode(wav_audio).decode()
    else:
        audio_b64 = ""

    return JSONResponse({
        "transcript": message,
        "response": response_text,
        "audio": audio_b64,
        "is_goodbye": is_goodbye,
    })


@app.post("/api/extension-chat")
async def extension_chat(request: Request):
    """Chat endpoint for the Ditto Chrome Extension.
    Accepts: { message, context (highlighted text), sourceUrl }
    Returns: { response }
    """
    body = await request.json()
    message = body.get("message", "").strip()
    context = body.get("context", "").strip()
    source_url = body.get("sourceUrl", "").strip()

    if not message:
        return JSONResponse({"error": "Empty message"}, status_code=400)

    # Build context-aware prompt
    prompt_parts = []
    if context:
        prompt_parts.append(f"[Highlighted Text from webpage]: {context}")
    if source_url:
        prompt_parts.append(f"[Source URL]: {source_url}")
    prompt_parts.append(f"[User Message]: {message}")

    full_prompt = "\n".join(prompt_parts)

    try:
        response_text = ditto_agent.process_request(full_prompt)
    except Exception as e:
        print(f"Error in extension-chat: {e}")
        return JSONResponse({"error": "Failed to generate response"}, status_code=500)

    return JSONResponse({
        "response": response_text,
    })


@app.post("/api/extension-voice")
async def extension_voice(
    file: UploadFile = File(...),
    context: str = Form(""),
    sourceUrl: str = Form(""),
):
    """Voice chat endpoint for the Ditto Chrome Extension.
    Accepts: audio file + context (highlighted text) + sourceUrl via form data.
    Returns: { transcript, response, audio (base64 WAV) }
    """
    audio_bytes = await file.read()

    # STT — transcribe the audio
    transcript = stt.transcribe_audio(audio_bytes)
    if not transcript:
        return JSONResponse({"error": "Could not understand audio", "transcript": ""}, status_code=400)

    # Build context-aware prompt
    prompt_parts = []
    if context:
        prompt_parts.append(f"[Highlighted Text from webpage]: {context}")
    if sourceUrl:
        prompt_parts.append(f"[Source URL]: {sourceUrl}")
    prompt_parts.append(f"[User Message]: {transcript}")

    full_prompt = "\n".join(prompt_parts)

    # LLM
    try:
        response_text = ditto_voice_agent.process_request(full_prompt)
    except Exception as e:
        print(f"Error in extension-voice: {e}")
        return JSONResponse({"error": "Failed to generate response"}, status_code=500)

    # TTS — generate speech from response
    tts_audio = tts.generate_speech(response_text)
    if tts_audio:
        wav_audio = ensure_wav(tts_audio)
        audio_b64 = base64.b64encode(wav_audio).decode()
    else:
        audio_b64 = ""

    return JSONResponse({
        "transcript": transcript,
        "response": response_text,
        "audio": audio_b64,
    })


# Serve static frontend
app.mount("/", StaticFiles(directory="web", html=True), name="web")


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 AI Extension — Ditto Server")
    print("   Open http://localhost:8000 in your browser\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

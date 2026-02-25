# 🤖 Ditto — AI Context Companion (Chrome Extension)

A Chrome Extension that lets you highlight text on any webpage, right-click **"Talk with Ditto"**, and instantly chat with AI — via text or voice — right inside a sleek side panel.

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![Deepgram](https://img.shields.io/badge/Speech-Deepgram-orange)
![Groq](https://img.shields.io/badge/LLM-Groq_Llama_3.3-blue)
![Chrome](https://img.shields.io/badge/Extension-Manifest_V3-yellow)

## ✨ Features

- **📝 Context-Aware Chat**: Highlight text → right-click → Ditto analyzes it instantly
- **🎙️ Continuous Voice Mode**: Click mic once → speak → silence auto-sends → AI responds with voice → auto re-listens
- **⚡ Ultra Fast**: Powered by **Groq** (Llama 3.3 70B) + **Deepgram** (STT/TTS)
- **🛑 Interruptible**: Press `SPACE` to interrupt AI mid-sentence
- **🎨 Premium Dark UI**: Glassmorphism, glow effects, smooth animations
- **🌐 Web Voice Assistant**: Also includes a standalone browser-based voice assistant

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Rahul-64/Ditto-AI-Extension.git
cd Ditto-AI-Extension
pip install -r requirements.txt
```

### 2. Configure API Keys
Create a `.env` file in the root:
```ini
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=your_groq_key
```
- Get Deepgram key: [console.deepgram.com](https://console.deepgram.com)
- Get Groq key: [console.groq.com](https://console.groq.com)

### 3. Start the Server
```bash
python server.py
```
Server runs at **http://localhost:8000**

### 4. Load the Chrome Extension
1. Open `chrome://extensions/` in Chrome
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `ditto-extension/` folder
5. Done! Highlight text on any page → right-click → **"Talk with Ditto"**

---

## 📂 Project Structure

```
├── server.py                  # FastAPI backend (chat + voice endpoints)
├── ditto-extension/           # Chrome Extension (Manifest V3)
│   ├── manifest.json          # Extension config
│   ├── background.js          # Service worker (context menu + storage)
│   ├── sidepanel.html         # Side panel UI
│   ├── sidepanel.css          # Dark theme styles
│   └── sidepanel.js           # Chat + continuous voice logic
├── web/                       # Standalone web voice assistant
│   ├── index.html
│   ├── script.js
│   └── style.css
├── src/
│   ├── agents/agent.py        # LiteLLM agent (Groq/Llama 3.3)
│   └── speech_processing/     # Deepgram STT + TTS
├── requirements.txt
├── Procfile                   # Render deployment config
└── .env                       # API keys (local only)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Groq (Llama 3.3 70B) via LiteLLM |
| **Speech-to-Text** | Deepgram Nova-2 |
| **Text-to-Speech** | Deepgram Aura-2 |
| **Backend** | FastAPI + Uvicorn |
| **Extension** | Chrome Manifest V3, Side Panel API |
| **Frontend** | Vanilla JS, CSS3 (glassmorphism, animations) |

---

## 🌐 Deploy Backend (Render)

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect repo → Python 3
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Add env vars: `DEEPGRAM_API_KEY`, `GROQ_API_KEY`

> After deploying, update `API_BASE` in `ditto-extension/sidepanel.js` to your Render URL.

---

## 📝 License
MIT License

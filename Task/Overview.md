# 🎯 Project Objective: Ditto Chrome Extension

## 1️⃣ The Problem (Why are we building this?)

Currently, interacting with AI while browsing the web creates too much friction.

When a user reads a complex email, a frustrating Reddit thread, or a dense LinkedIn post, the current workflow is broken:

* **The Manual Loop:** Open a new tab ➡️ Load an AI site ➡️ Copy the text ➡️ Paste it ➡️ Type the prompt.
* **The Result:** Users abandon the process because it takes too long.
* **The Quality Drop:** When text is pasted in isolation, the AI loses the visual and structural context of the original webpage, leading to generic or inaccurate responses.

## 2️⃣ The Vision (The Ditto Solution)

**Bring the AI directly to where the user is thinking.** Ditto is a Chrome Extension that acts as a real-time context companion. The new workflow:

* **Highlight text** on any webpage.
* **Right-click** and select "Talk with Ditto".
* **Instantly chat** in a Chrome Side Panel where the AI already knows what you are looking at and exactly what you need help with.

---

## 3️⃣ Where Are We Now? (Our Unfair Advantage)

We are not starting from scratch. We are evolving a proven, high-speed AI engine into a browser-native tool. We already successfully built **Rude-AI**, which gives us a massive head start.

**What we currently have ready to use:**

* **Core Backend:** A functioning FastAPI server optimized for speed.
* **LLM Engine:** Lightning-fast AI responses powered by Groq (Llama 3 70B).
* **Audio Capabilities:** Deepgram integration (STT/TTS) ready to be deployed if we add voice features later.
* **Design System:** A premium, dark-themed, glassmorphic UI that is perfect for a sleek side panel.
* **Persona Logic:** The architecture to inject distinct personalities (like the Rude persona) into the AI, which we will adapt for Ditto's "modes" (e.g., Professional, Aggressive, Diplomatic).

---

## 4️⃣ What Are Our Next Goals? (The MVP Scope)

To get Ditto into users' hands quickly, we are focusing strictly on the Minimum Viable Product:

1. **The Browser Bridge:** Successfully capture highlighted text on any webpage.
2. **The Side Panel:** Render a clean, responsive chat interface inside Chrome's native side panel API.
3. **The Context Injector:** Pass the highlighted text securely to our backend so the AI understands the user's current webpage context.
4. **The Chat Loop:** Enable seamless, fast back-and-forth messaging inside the extension.

---

## 5️⃣ How Can We Achieve This? (Step-by-Step Execution)

**Step 1: Extension Scaffolding (Manifest V3)**

* Create the `manifest.json` with permissions for `sidePanel`, `contextMenus`, `storage`, and `activeTab`.
* Set up the Background Service Worker (`background.js`) to listen for right-click events.

**Step 2: UI Migration (The Side Panel)**

* Build a React or Vanilla JS frontend specifically for the Chrome Side Panel.
* Port the premium dark-mode CSS and chat bubble logic from the Rude-AI repository to ensure it looks polished immediately.

**Step 3: Backend Refactoring (FastAPI / Node)**

* Update the existing server to include a new API endpoint (e.g., `/extension-chat`).
* Modify the system prompt logic to accept two new variables: `<Highlighted_Text>` and `<Source_URL>`.

**Step 4: Wiring It Together**

* Connect the extension's frontend to your backend API.
* Implement Chrome Storage to save a lightweight session token so the user stays logged in.
* Test the end-to-end flow: Highlight Reddit text ➡️ Open Side Panel ➡️ AI generates a tailored reply.


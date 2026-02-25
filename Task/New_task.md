Here is the high-level roadmap for the entire project, followed by a deep dive into Phase 1 so you can start building immediately.

### 🗺️ The Roadmap: Project Phases

* **Phase 1: The Foundation (Extension Skeleton & Triggers)**
* Setting up Manifest V3.
* Creating the right-click context menu.
* Opening the Chrome Side Panel on click.


* **Phase 2: The Bridge (Context Capture & UI)**
* Grabbing the highlighted text from the browser.
* Building the React chat interface inside the Side Panel.
* Passing the text from the background script to the Side Panel UI.


* **Phase 3: The Brain (Backend API & Chat Loop)**
* Creating the new FastAPI/Node.js endpoint for the extension.
* Connecting the Side Panel frontend to the backend API.
* Handling the prompt injection and streaming the LLM response.


* **Phase 4: The Polish (Auth & Production Readiness)**
* Implementing JWT/Auth sync with the Ditto web app.
* Handling edge cases (token limits, no text selected).
* Final styling and preparing for the Chrome Web Store.



---

### 🚀 Phase 1 in Detail: The Foundation

**Objective:** Get a working Chrome extension loaded into your browser. By the end of this phase, you will highlight text, right-click it, see "Talk with Ditto," and clicking it will open your custom side panel.

#### 1. Directory Structure

Set up a clean, modular folder structure. Since you are building a modern UI, setting up a React environment for the side panel is ideal, but we will start with the raw extension files.

```text
ditto-extension/
├── public/
│   ├── manifest.json       # The configuration file
│   ├── icons/              # 16x16, 48x48, 128x128 png files
│   └── sidepanel.html      # The entry point for the UI
├── src/
│   ├── background.js       # Service worker handling right-clicks
│   └── sidepanel.jsx       # The React logic for the chat UI
└── package.json            # For your build tools (Vite/Webpack)

```

#### 2. Step-by-Step Execution

**Step 1.1: Create the `manifest.json**`
This is the heart of the extension. You need specific Manifest V3 permissions to make the side panel and right-click menus work.

* **Permissions needed:** `sidePanel`, `contextMenus`, `storage`, `activeTab`.
* **Action:** Define your background service worker and designate `sidepanel.html` as the default side panel.

**Step 1.2: Build the Background Service Worker (`background.js`)**
Chrome extensions run background scripts in isolated environments.

* **Action:** Use the `chrome.runtime.onInstalled` listener to create a context menu item called "Talk with Ditto."
* **Action:** Set up a `chrome.contextMenus.onClicked` listener. When the user clicks the menu item, it should trigger `chrome.sidePanel.open()` to slide the panel open on the active window.

**Step 1.3: Scaffolding the Side Panel (`sidepanel.html`)**
This is the HTML file that Chrome renders inside the side panel.

* **Action:** Create a basic HTML shell. For Phase 1, it just needs a `<div>` with "Ditto is awake" so you can visually confirm the panel opened successfully.

**Step 1.4: Load the Unpacked Extension into Chrome**
Test the skeleton locally.

* **Action:** Open Chrome and go to `chrome://extensions/`.
* **Action:** Toggle "Developer mode" on in the top right.
* **Action:** Click "Load unpacked" and select your `ditto-extension` folder.

#### 3. Phase 1 Success Criteria

* [ ] The Ditto icon appears in your Chrome extensions list.
* [ ] Highlighting text on any website and right-clicking shows the "Talk with Ditto" option.
* [ ] Clicking that option smoothly opens the right-hand side panel.

---

Would you like me to write the exact code for the `manifest.json` and `background.js` files so you can copy, paste, and complete Phase 1 right now?
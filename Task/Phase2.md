### 🚀 Phase 2 in Detail: The Interactive Chat Interface

**Objective:** Transform the static side panel into a fully interactive, auto-updating chat UI. By the end of this phase, the panel will dynamically update when new text is highlighted and allow users to type and render messages in a chat feed.

#### 1. File Updates

You will modify your existing files. No new files are strictly necessary, but the logic will expand.

* `sidepanel.html`: Add the chat history container and user input area.
* `sidepanel.css`: Add styles for chat bubbles (User vs. AI) and the input dock.
* `sidepanel.js`: Implement message rendering and dynamic storage listeners.

#### 2. Step-by-Step Execution

**Step 2.1: Chat UI Layout (`sidepanel.html`)**
Structure the panel into three distinct vertical zones: Header, Chat Area, and Input Dock.

* **Action:** Keep your current "Context Display Card" at the top (or make it the first message in the chat).
* **Action:** Add a scrollable `<div id="chat-history"></div>`.
* **Action:** Add a fixed-bottom input area containing a `<textarea id="user-input">` and a `<button id="send-btn">`.

**Step 2.2: Styling the Chat (`sidepanel.css`)**
Apply the premium dark theme to the conversation flow.

* **Action:** Style `.message-user` (e.g., aligned right, accent color background) and `.message-ai` (e.g., aligned left, dark gray background).
* **Action:** Style the input dock to stick to the bottom of the panel (`position: sticky` or flexbox layout) so it remains accessible while scrolling.

**Step 2.3: The Chat Logic (`sidepanel.js`)**
Build the engine that renders the conversation.

* **Action:** Write a function `appendMessage(sender, text)` that creates a new `<div>`, applies the correct CSS class based on the sender, and appends it to `#chat-history`.
* **Action:** Add an event listener to `#send-btn` and the `Enter` key on `#user-input`. When triggered, grab the text, call `appendMessage('user', text)`, and clear the input field.
* **Action:** Implement auto-scrolling so the `#chat-history` div automatically scrolls to the bottom whenever a new message is appended.

**Step 2.4: Dynamic Context Listener (`sidepanel.js`)**
Ensure the panel updates instantly if the user keeps the panel open and highlights *new* text on the webpage.

* **Action:** Add `chrome.storage.onChanged.addListener((changes, namespace) => { ... })`.
* **Action:** Inside the listener, check if `changes.selectedText` exists. If it does, dynamically update the UI context card with `changes.selectedText.newValue` without requiring a panel refresh.

#### 3. Phase 2 Success Criteria

* [ ] The side panel has a scrollable chat area and a fixed input box at the bottom.
* [ ] Typing a message and pressing Enter/Send renders a user chat bubble in the panel.
* [ ] Highlighting new text on the webpage instantly updates the context card in the open side panel without needing to close and reopen it.


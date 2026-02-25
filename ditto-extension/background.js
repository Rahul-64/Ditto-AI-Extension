/**
 * Ditto — Background Service Worker
 * 
 * Handles:
 * 1. Creating the "Talk with Ditto" context menu on install
 * 2. Opening the Chrome Side Panel when the menu item is clicked
 * 3. Storing the selected text for the side panel to retrieve
 */

// ── Create Context Menu on Install ──
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "talk-with-ditto",
        title: "Talk with Ditto",
        contexts: ["selection"]  // Only show when text is selected
    });

    console.log("✅ Ditto installed — context menu created.");
});


// ── Handle Context Menu Click ──
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "talk-with-ditto") {
        const selectedText = info.selectionText || "";
        const sourceUrl = tab?.url || "";

        // Store the selected text and source URL for the side panel
        chrome.storage.local.set({
            dittoContext: {
                text: selectedText,
                url: sourceUrl,
                timestamp: Date.now()
            }
        }, () => {
            console.log("📋 Context saved:", selectedText.substring(0, 80) + "...");
        });

        // Open the side panel on the current window
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

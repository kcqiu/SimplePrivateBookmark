// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ bookmarks: [], password: null });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "saveBookmark") {
    chrome.storage.local.get(["bookmarks"], (result) => {
      const bookmarks = result.bookmarks || [];
      bookmarks.push(message.bookmark);
      chrome.storage.local.set({ bookmarks });
      sendResponse({ status: "success" });
    });
    return true; // Will respond asynchronously.
  } else if (message.type === "getBookmarks") {
    chrome.storage.local.get(["bookmarks"], (result) => {
      sendResponse(result.bookmarks);
    });
    return true;
  } else if (message.type === "setPassword") {
    chrome.storage.local.set({ password: message.password });
    sendResponse({ status: "success" });
    return true;
  } else if (message.type === "getPassword") {
    chrome.storage.local.get(["password"], (result) => {
      sendResponse(result.password);
    });
    return true;
  }
});

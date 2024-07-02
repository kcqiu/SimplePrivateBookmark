/**
 * This event listener is triggered when the extension is installed.
 * It initializes the Chrome storage with an empty array of bookmarks and a null hash.
 * It also creates a context menu item for adding the current page to the bookmarks.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ bookmarks: [], hash: null });
  chrome.contextMenus.create({
    id: "addBookmark",
    title: "Add this page to Private Bookmarks",
    contexts: ["page"]
  })
});

/**
 * This event listener is triggered when a message is sent from the extension.
 * It handles different types of messages: saveBookmark, getBookmarks, setPassword, and getPassword.
 * For each type of message, it performs the corresponding operation on the Chrome storage and sends a response.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "saveBookmark") {
    chrome.storage.sync.get(["bookmarks"], (result) => {
      const bookmarks = result.bookmarks || [];
      bookmarks.push(message.bookmark);
      chrome.storage.sync.set({ bookmarks });
      sendResponse({ status: "success" });
    });
    return true; // Will respond asynchronously.
  } else if (message.type === "getBookmarks") {
    chrome.storage.sync.get(["bookmarks"], (result) => {
      sendResponse(result.bookmarks);
    });
    return true;
  } else if (message.type === "setPassword") {
    chrome.storage.sync.set({ hash: message.hash });
    sendResponse({ status: "success" });
    return true;
  } else if (message.type === "getPassword") {
    chrome.storage.sync.get(["password"], (result) => {
      sendResponse(result.hash);
    });
    return true;
  }
});


/**
 * This event listener is triggered when a context menu item is clicked.
 * If the clicked item is the "addBookmark" item, it checks the session status.
 * If the session is not active, it shows a notification to unlock the bookmarks.
 * If the session is active, it adds the current page to the bookmarks.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addBookmark") {
    chrome.storage.sync.get({hash: null}, (data) => {
      if (data.hash === null) {
        console.log("Unlock required")
        // If the user has not unlocked their private bookmarks, show a notification
        const notificationId = 'unlockRequired'
        chrome.notifications.create(notificationId,{
          type: 'basic',
          iconUrl: '../../assets/icons/default_icon.png',
          title: 'Unlock Required',
          message: 'Please click on the extension icon to unlock your bookmarks.'
        });
        //clear the notification
        setTimeout(() => {
          chrome.notifications.clear('unlockRequired');
        }, 5000);
      } else {
        // If the user has unlocked their private bookmarks, add the bookmark
        const url = tab.url;
        const title = tab.title;

        chrome.storage.sync.get({bookmarks: []}, (data) => {
          let bookmarks = data.bookmarks;
          bookmarks.push({url, title});
          chrome.storage.sync.set({bookmarks}, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              return;
            }
            console.log("Bookmark added successfully");
          });
        });
      }
    });
  }});

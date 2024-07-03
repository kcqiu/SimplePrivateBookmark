/**
 * Sets up initial storage values and context menu item when the extension is installed.
 *
 * This listener is triggered once when the extension is installed or updated to a new version.
 * It initializes the bookmarks storage with an empty array and a null hash value for password storage.
 * Additionally, it creates a context menu item that allows users to add the current page to their private bookmarks.
 */
chrome.runtime.onInstalled.addListener(() => {
    // Initialize bookmarks and hash in storage
    chrome.storage.sync.set({bookmarks: [], hash: null});

    // Create a context menu item for adding bookmarks
    chrome.contextMenus.create({
        id: "addBookmark",
        title: "Add this page to Private Bookmarks",
        contexts: ["page"]
    });
});


/**
 * Listens for messages from other parts of the extension and performs actions based on the message type.
 *
 * This listener supports four types of messages:
 * - "saveBookmark": Saves a bookmark to Chrome's storage. It retrieves the current list of bookmarks,
 *   adds the new bookmark from the message, and updates the storage. Responds with a success status.
 * - "getBookmarks": Retrieves the list of bookmarks from Chrome's storage and sends it as a response.
 * - "setPassword": Sets a new hash value for the password in Chrome's storage and responds with a success status.
 * - "getPassword": Retrieves the stored hash value of the password from Chrome's storage and sends it as a response.
 *
 * Each action returns true to indicate that it will respond asynchronously.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "saveBookmark") {
        chrome.storage.sync.get(["bookmarks"], (result) => {
            const bookmarks = result.bookmarks || [];
            bookmarks.push(message.bookmark);
            chrome.storage.sync.set({bookmarks});
            sendResponse({status: "success"});
        });
        return true; // Will respond asynchronously.
    } else if (message.type === "getBookmarks") {
        chrome.storage.sync.get(["bookmarks"], (result) => {
            sendResponse(result.bookmarks);
        });
        return true;
    } else if (message.type === "setPassword") {
        chrome.storage.sync.set({hash: message.hash});
        sendResponse({status: "success"});
        return true;
    } else if (message.type === "getPassword") {
        chrome.storage.sync.get(["hash"], (result) => {
            sendResponse(result.hash);
        });
        return true;
    }
});


/**
 * Handles the event when a context menu item is clicked.
 *
 * This function listens for clicks on the context menu item with the id "addBookmark". When this item is clicked,
 * it first checks if the session is active (i.e., if the user has unlocked their private bookmarks). If the session
 * is not active, it displays a notification prompting the user to unlock their bookmarks. This notification is cleared
 * after 5 seconds. If the session is active, it proceeds to add the current page (URL and title) to the bookmarks list
 * stored in Chrome's sync storage. After adding the bookmark, it sends a message to update the bookmarks display.
 * If an error occurs during the storage operation, it logs the error message.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addBookmark") {
        chrome.storage.sync.get({sessionActive: false}, (data) => {
            if (data.sessionActive === false) {
                console.log("Unlock required");
                // If the user has not unlocked their private bookmarks, show a notification
                const notificationId = 'unlockRequired';
                chrome.notifications.create(notificationId, {
                    type: 'basic',
                    iconUrl: '../../assets/icons/default_icon.png',
                    title: 'Unlock Required',
                    message: 'Please click on the extension icon to unlock your bookmarks.'
                });
                // Clear the notification after 5 seconds
                setTimeout(() => {
                    chrome.notifications.clear(notificationId);
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
                        chrome.runtime.sendMessage({action: "updateBookmarks"}).then(response => {
                            console.log("Response:", response);
                            console.log("Bookmark added successfully");
                        }).catch(error => {
                            console.error("Messaging error:", error);
                        });
                    });
                });
            }
        });
    }
});

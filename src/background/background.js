// Initialize bookmarks and encryption key
chrome.runtime.onInstalled.addListener(async () => {
    const key = await generateKey();
    const exportedKey = await exportKey(key);

    chrome.storage.sync.set({
        bookmarks: [],
        encryptionKey: exportedKey,
        hash: null,
        sessionActive: false // Ensure sessionActive is initialized
    });

    chrome.contextMenus.create({
        id: "addBookmark",
        title: "Add this page to Private Bookmarks",
        contexts: ["page"]
    });
});

// Generate a key
 async function generateKey() {
    return crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Export key to a format that can be stored
 async function exportKey(key) {
    const exported = await crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}

// Import key from stored format
 async function importKey(jwk) {
    return crypto.subtle.importKey(
        "jwk",
        JSON.parse(jwk),
        {
            name: "AES-GCM",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Convert ArrayBuffer to Base64 string
 function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
 function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// Encrypt data
 async function encryptData(data, key) {
    const enc = new TextEncoder();
    const encoded = enc.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encoded
    );
    return { iv: arrayBufferToBase64(iv), encrypted: arrayBufferToBase64(encrypted) };
}

// Decrypt data
 async function decryptData(encrypted, iv, key) {
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: base64ToArrayBuffer(iv),
        },
        key,
        base64ToArrayBuffer(encrypted)
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}

// Message listener for saving and retrieving bookmarks and handling password
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "saveBookmark") {
        chrome.storage.sync.get(["bookmarks", "encryptionKey"], async (result) => {
            const bookmarks = result.bookmarks || [];
            const key = await importKey(result.encryptionKey);
            const encryptedData = await encryptData(message.bookmark.url, key);
            bookmarks.push({
                title: message.bookmark.title,
                url: encryptedData.encrypted,
                iv: encryptedData.iv
            });
            chrome.storage.sync.set({ bookmarks });
            sendResponse({ status: "success" });
        });
        return true; // Will respond asynchronously.
    } else if (message.type === "getBookmarks") {
        chrome.storage.sync.get(["bookmarks", "encryptionKey"], async (result) => {
            const bookmarks = result.bookmarks || [];
            const key = await importKey(result.encryptionKey);

            for (const bookmark of bookmarks) {
                bookmark.url = await decryptData(bookmark.url, bookmark.iv, key);
            }

            sendResponse(bookmarks);
        });
        return true;
    } else if (message.type === "setPassword") {
        chrome.storage.sync.set({ hash: message.hash });
        sendResponse({ status: "success" });
        return true;
    } else if (message.type === "getPassword") {
        chrome.storage.sync.get(["hash"], (result) => {
            sendResponse(result.hash);
        });
        return true;
    } else if (message.type === "setSessionActive") {
        chrome.storage.sync.set({ sessionActive: message.sessionActive });
        sendResponse({ status: "success" });
        return true;
    }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addBookmark") {
        chrome.storage.sync.get({ sessionActive: false, bookmarks: [], encryptionKey: "" }, async (data) => {
            if (data.sessionActive === false) {
                console.log("Unlock required");
                const notificationId = 'unlockRequired';
                chrome.notifications.create(notificationId, {
                    type: 'basic',
                    iconUrl: '../../assets/icons/default_icon.png',
                    title: 'Unlock Required',
                    message: 'Please click on the extension icon to unlock your bookmarks.'
                });
                setTimeout(() => {
                    chrome.notifications.clear(notificationId);
                }, 5000);
            } else {
                const key = await importKey(data.encryptionKey);
                const encryptedData = await encryptData(tab.url, key);

                const bookmarks = data.bookmarks || [];
                bookmarks.push({
                    title: tab.title,
                    url: encryptedData.encrypted,
                    iv: encryptedData.iv
                });

                chrome.storage.sync.set({ bookmarks }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        return;
                    }
                    chrome.runtime.sendMessage({ action: "updateBookmarks" }).then(response => {
                        console.log("Response:", response);
                        console.log("Bookmark added successfully");
                    }).catch(error => {
                        console.error("Messaging error:", error);
                    });
                });
            }
        });
    }
});

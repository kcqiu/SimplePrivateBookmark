import { showMessage, hashPassword } from './utils.js';
import { Bookmark } from './bookmark.js';
const bookmark = new Bookmark();

export class Auth {
    constructor() {
        this.lockTimer = null;
        this.sessionActive = false;
        this.loginContainer = document.getElementById("loginContainer");
        this.bookmarkContainer = document.getElementById("bookmarkContainer");
        this.messageContainer = document.getElementById("messageContainer");
    }

    checkSession() {
        chrome.storage.sync.get(["hash", "sessionActive"], (data) => {
            const storedPassword = data.hash;
            this.sessionActive = data.sessionActive || false;
            console.log("checking session ", storedPassword, this.sessionActive)
            if (storedPassword === null) {
                showMessage("Please set an initial password to secure your bookmarks.", "black");
                document.getElementById("loginButton").title = "Set Password";
            } else {
                document.getElementById("loginButton").title = this.sessionActive ? "Unlock Bookmarks" : "Enter Password";
            }

            if (this.sessionActive) {
                this.loginContainer.style.display = "none";
                this.bookmarkContainer.style.display = "block";
                this.messageContainer.style.display = "none";
                this.startLockTimer();
                bookmark.loadBookmarks();
            }
        });
    }

    loginHandler() {
        const password = document.getElementById("passwordInput").value.trim();
        const hashPromise = hashPassword(password);
        if (!password) {
            showMessage("Password cannot be empty!", "red");
            return;
        }

        console.log("Password entered:", password);

        chrome.storage.sync.get("hash", (data) => {
            const storedHash = data.hash;
            console.log("Stored hash:", storedHash);

            if (storedHash === null) {
                // Set new password
                hashPromise.then((hash) => {
                    console.log("New hash:", hash);
                    chrome.storage.sync.set({ hash, sessionActive: true }, () => {
                        if (chrome.runtime.lastError) {
                            console.log("Storage error:", chrome.runtime.lastError.message);
                            return;
                        }
                        showMessage("Password set successfully!", "green");
                        document.getElementById("loginButton").title = "Unlock Bookmarks";
                        this.loginContainer.style.display = "none";
                        this.bookmarkContainer.style.display = "block";
                        this.sessionActive = true;
                        this.startLockTimer();
                    });
                });
            } else {
                hashPromise.then((hash) => {
                    console.log("Entered hash:", hash);
                    if (storedHash === hash) {
                        // Correct password, show bookmarks
                        this.loginContainer.style.display = "none";
                        this.bookmarkContainer.style.display = "block";
                        this.messageContainer.style.display = "none";
                        this.sessionActive = true;
                        this.startLockTimer();
                        bookmark.loadBookmarks();

                        // Load bookmarks
                    } else {
                        // Incorrect password
                        showMessage("Incorrect password!", "red");
                    }
                });
            }
        });
    }

    lockExtension() {
        clearTimeout(this.lockTimer);
        chrome.storage.sync.set({ sessionActive: false }, () => {
            if (chrome.runtime.lastError) {
                console.error("Lock error:", chrome.runtime.lastError.message);
                return;
            }
            this.sessionActive = false;
            this.bookmarkContainer.style.display = "none";
            this.loginContainer.style.display = "block";
            document.getElementById("passwordInput").value = "";
        });
    }

    startLockTimer() {
        clearTimeout(this.lockTimer);
        this.lockTimer = setTimeout(() => {
            this.lockExtension();
        }, 3600000); // 1 hour
    }
}
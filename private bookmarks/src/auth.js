import {showMessage, hashPassword} from './utils.js';
import {Bookmark} from './bookmark.js';
// Create a new instance of the Bookmark class
const bookmark = new Bookmark();

/**
 * The Auth class represents an authentication manager.
 * It provides methods to check the session, handle login, lock the extension, and start a lock timer.
 * The session status and hashed password are stored in the Chrome storage.
 *
 * @class
 * @property {number|null} lockTimer - The timer for automatically locking the extension.
 * @property {boolean} sessionActive - Whether the session is currently active.
 * @property {HTMLElement} loginContainer - The HTML element that displays the login form.
 * @property {HTMLElement} bookmarkContainer - The HTML element that displays the bookmarks.
 * @property {HTMLElement} messageContainer - The HTML element that displays messages.
 */
export class Auth {
    /**
     * Creates a new Auth manager.
     * Initializes the lock timer to null, the session status to false, and the containers to their corresponding HTML elements.
     *
     * @constructor
     */
    constructor() {
        this.lockTimer = null;
        this.sessionActive = false;
        this.loginContainer = document.getElementById("loginContainer");
        this.bookmarkContainer = document.getElementById("bookmarkContainer");
        this.messageContainer = document.getElementById("messageContainer");
    }

    /**
     * Checks the session status and the stored password.
     * If there is no stored password, it prompts the user to set an initial password.
     * If the session is active, it hides the login form, displays the bookmarks, and starts the lock timer.
     */
    checkSession() {
        chrome.storage.sync.get(["hash", "sessionActive"], (data) => {
            const storedPassword = data.hash;
            this.sessionActive = data.sessionActive || false;
            console.log("checking session ", storedPassword, this.sessionActive)
            if (storedPassword === null) {
                showMessage("Please set an initial password (4 characters minimum) to secure your bookmarks.", "black");
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

    /**
     * Handles the login process.
     * If the entered password is empty, it shows an error message and returns.
     * If there is no stored password, it sets the entered password as the new password.
     * If the entered password matches the stored password, it hides the login form, displays the bookmarks, and starts the lock timer.
     * If the entered password does not match the stored password, it shows an error message.
     */
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
                    chrome.storage.sync.set({hash, sessionActive: true}, () => {
                        if (chrome.runtime.lastError) {
                            console.log("Storage error:", chrome.runtime.lastError.message);
                            return;
                        }
                        showMessage("Password set successfully!", "green");
                        document.getElementById("loginButton").title = "Unlock Bookmarks";
                        setTimeout(() => {
                            this.loginContainer.style.display = "none";
                            this.bookmarkContainer.style.display = "block";
                            this.sessionActive = true;
                            this.startLockTimer();
                        }, 5000);
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

    /**
     * Locks the extension.
     * It clears the lock timer, sets the session status to false, hides the bookmarks, and displays the login form.
     */
    lockExtension() {
        clearTimeout(this.lockTimer);
        chrome.storage.sync.set({sessionActive: false}, () => {
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

    /**
     * Starts the lock timer.
     * It clears the previous lock timer and sets a new timer that will lock the extension after 1 hour.
     */
    startLockTimer() {
        clearTimeout(this.lockTimer);
        this.lockTimer = setTimeout(() => {
            this.lockExtension();
        }, 3600000); // 1 hour
    }
}
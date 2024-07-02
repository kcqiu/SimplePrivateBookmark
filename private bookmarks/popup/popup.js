import {Auth} from '../src/auth.js';
import {Bookmark} from '../src/bookmark.js'

document.addEventListener("DOMContentLoaded", () => {
    const auth = new Auth();
    const bookmark = new Bookmark();

    const passwordInput = document.getElementById("passwordInput");
    const loginButton = document.getElementById("loginButton");
    const saveButton = document.getElementById("saveButton");
    const lockButton = document.getElementById("lockButton");
console.log('here');
    // Ensure all elements are present before proceeding
    if(!lockButton || !passwordInput || !saveButton || !loginButton) {
        console.error("One or more elements are missing in the DOM.");
        return;
    }

    auth.checkSession();

    loginButton.addEventListener("click", () => auth.loginHandler());
    passwordInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            auth.loginHandler();
        }
    });

    saveButton.addEventListener("click", () => bookmark.saveBookmark());
    lockButton.addEventListener("click", () => auth.lockExtension());
});
// Import the Auth and Bookmark classes from their respective modules
import {Auth} from '../src/auth.js';
import {Bookmark} from '../src/bookmark.js'

// Add an event listener for the DOMContentLoaded event
// This event is fired when the initial HTML document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", () => {
    // Create new instances of the Auth and Bookmark classes
    const auth = new Auth();
    const bookmark = new Bookmark();

    // Get the HTML elements for the password input, login button, save button, and lock button
    const passwordInput = document.getElementById("passwordInput");
    const loginButton = document.getElementById("loginButton");
    const saveButton = document.getElementById("saveButton");
    const lockButton = document.getElementById("lockButton");

    // Log a message to the console
    console.log('here');

    // Check if all elements are present in the DOM
    // If any element is missing, log an error message to the console and return
    if(!lockButton || !passwordInput || !saveButton || !loginButton) {
        console.error("One or more elements are missing in the DOM.");
        return;
    }

    // Check the session status
    auth.checkSession();

    // Add event listeners for the click event of the login button and the keyup event of the password input
    // When the login button is clicked or the Enter key is pressed in the password input, call the loginHandler method of the Auth class
    loginButton.addEventListener("click", () => auth.loginHandler());
    passwordInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            auth.loginHandler();
        }
    });

    // Add event listeners for the click event of the save button and the lock button
    // When the save button is clicked, call the saveBookmark method of the Bookmark class
    // When the lock button is clicked, call the lockExtension method of the Auth class
    saveButton.addEventListener("click", () => bookmark.saveBookmark());
    lockButton.addEventListener("click", () => auth.lockExtension());
});
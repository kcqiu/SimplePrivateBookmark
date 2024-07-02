/**
 * Displays a message to the user.
 * The message is displayed in the "messageContainer" HTML element.
 * After 7 seconds, the message is hidden.
 *
 * @param {string} message - The message to display.
 * @param {string} color - The color of the message.
 */
export function showMessage(message, color) {
    const messageContainer = document.getElementById("messageContainer");
    messageContainer.textContent = message;
    messageContainer.style.color = color;
    messageContainer.style.display = "block";
    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 7000);
}

/**
 * Hashes a password using the SHA-256 algorithm.
 * The password is first encoded as a sequence of bytes using the TextEncoder API.
 * Then, the bytes are hashed using the SubtleCrypto.digest method.
 * Finally, the hash is converted to a hexadecimal string.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
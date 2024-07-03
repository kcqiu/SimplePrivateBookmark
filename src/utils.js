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
    }, 5000);

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

// Import key from stored format
export async function importKey(jwk) {
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
// Export key to a format that can be stored
export async function exportKey(key) {
    const exported = await crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}


// Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64) {
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
export async function encryptData(data, key) {
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
export async function decryptData(encrypted, iv, key) {
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

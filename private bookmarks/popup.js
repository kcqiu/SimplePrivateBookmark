// popup.js

document.addEventListener("DOMContentLoaded", () => {
  // Get elements from the DOM
  const loginContainer = document.getElementById("loginContainer");
  const bookmarkContainer = document.getElementById("bookmarkContainer");
  const passwordInput = document.getElementById("passwordInput");
  const loginButton = document.getElementById("loginButton");
  const saveButton = document.getElementById("saveButton");
  const lockButton = document.getElementById("lockButton");
  const bookmarkList = document.getElementById("bookmarkList");
  const messageContainer = document.getElementById("messageContainer");

  let lockTimer;
  let sessionActive = false;

  // Ensure all elements are present before proceeding
  if (
    !loginButton ||
    !passwordInput ||
    !saveButton ||
    !lockButton ||
    !bookmarkList ||
    !loginContainer ||
    !bookmarkContainer ||
    !messageContainer
  ) {
    console.error("One or more elements are missing in the DOM.");
    return;
  }

  // Check if a password is already set and if session is active
  chrome.storage.local.get(["hash", "sessionActive"], (data) => {
    const storedPassword = data.hash;
    sessionActive = data.sessionActive || false;

    if (storedPassword === null) {
      // Show initial password setup message
      showMessage(
        "Please set an initial password to secure your bookmarks.",
        "black"
      );
      loginButton.title = "Set Password";
    } else {
      loginButton.title = sessionActive ? "Unlock Bookmarks" : "Enter Password";
    }

    if (sessionActive) {
      loginContainer.style.display = "none";
      bookmarkContainer.style.display = "block";
      messageContainer.style.display = "none";
      startLockTimer();
      loadBookmarks();
    }
  });

  //listener for the login button
  loginButton.addEventListener("click", loginHandler);

  //listener for the password input field
  passwordInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      loginHandler();
    }
  });

  // Function to handle login
  function loginHandler() {
    const password = passwordInput.value.trim();
    const hashPromise = hashPassword(password);
    if (!password) {
      showMessage("Password cannot be empty!", "red");
      return;
    }

    // Check stored password and handle login or set password
    chrome.storage.local.get("hash", (data) => {
      const storedHash = data.hash;

      if (storedHash === null) {
        // Set new password
        hashPromise.then((hash) => {
          chrome.storage.local.set({ hash, sessionActive: true }, () => {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError.message);
            }
            showMessage("Password set successfully!", "green");
            loginButton.title = "Unlock Bookmarks";
            loginContainer.style.display = "none";
            bookmarkContainer.style.display = "block";
            sessionActive = true;
            startLockTimer();
          });
        });
      } else if (storedHash !== null) {
        hashPromise.then((hash) => {
          if (storedHash === hash) {
            // Correct password, show bookmarks
            loginContainer.style.display = "none";
            bookmarkContainer.style.display = "block";
            messageContainer.style.display = "none";
            sessionActive = true;
            startLockTimer();
            loadBookmarks();
          } else {
            // Incorrect password
            showMessage("Incorrect password!", "red");
          }
        });
      }
    });
  }

  //listener for the save button
  saveButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }

      const activeTab = tabs[0];
      const bookmark = { title: activeTab.title, url: activeTab.url };

      chrome.storage.local.get({ bookmarks: [] }, (data) => {
        const bookmarks = data.bookmarks;
        bookmarks.push(bookmark);

        chrome.storage.local.set({ bookmarks }, () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }
          loadBookmarks();
        });
      });
    });
  });

  //listener for the lock button
  lockButton.addEventListener("click", () => {
    lockExtension();
  });

  // Function to lock the extension
  function lockExtension() {
    clearTimeout(lockTimer);
    chrome.storage.local.set({ sessionActive: false }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      sessionActive = false;
      bookmarkContainer.style.display = "none";
      loginContainer.style.display = "block";
      passwordInput.value = "";
    });
  }

  // Function to start the lock timer
  function startLockTimer() {
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      lockExtension();
    }, 3600000); // 1 hour = 3600000 milliseconds
  }

  // Function to load and display bookmarks
  function loadBookmarks() {
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      const bookmarks = data.bookmarks;
      bookmarkList.innerHTML = "";
      bookmarks.forEach((bookmark, index) => {
        const bookmarkItem = document.createElement("div");
        bookmarkItem.classList.add("bookmark-item");

        const link = document.createElement("a");
        link.href = bookmark.url;
        link.textContent = bookmark.title;
        link.target = "_blank";
        bookmarkItem.appendChild(link);

        const deleteIcon = document.createElement("img");
        deleteIcon.src = "icons/delete_icon.png";
        deleteIcon.classList.add("delete-icon");
        deleteIcon.addEventListener("click", () => {
          deleteBookmark(index);
        });
        bookmarkItem.appendChild(deleteIcon);

        bookmarkList.appendChild(bookmarkItem);
      });
    });
  }

  // Function to delete a bookmark
  function deleteBookmark(index) {
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      const bookmarks = data.bookmarks;
      bookmarks.splice(index, 1);
      chrome.storage.local.set({ bookmarks }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        loadBookmarks();
      });
    });
  }

  // Function to show a message to the user
  function showMessage(message, color) {
    messageContainer.textContent = message;
    messageContainer.style.color = color;
    messageContainer.style.display = "block";
    setTimeout(() => {
      messageContainer.style.display = "none";
    }, 7000);
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    console.log(hashHex);
    return hashHex;
  }
});

/**
 * Represents a bookmark manager for a Chrome extension.
 * This class is responsible for managing the bookmark list displayed to the user,
 * including loading bookmarks when requested through a message.
 */
export class Bookmark {
    constructor() {
        // Reference to the HTML element that will display the list of bookmarks.
        this.bookmarkList = document.getElementById("bookmarkList");

        // Adds a listener for messages sent to this script. Specifically listens for
        // a message to update the bookmarks, at which point it calls `loadBookmarks`
        // to refresh the displayed list of bookmarks.
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "updateBookmarks") {
                console.log("Received updateBookmarks message");
                sendResponse({status: "success"});
                this.loadBookmarks();
            }
            return true;
        });
    }

    /**
     * Saves the currently active tab as a bookmark in Chrome's storage.
     *
     * This method queries the currently active tab in the current window to obtain its title and URL.
     * If there's no error in fetching the active tab and at least one tab is active, it constructs a bookmark
     * object with the title and URL of the active tab. This bookmark object is then added to the existing array
     * of bookmarks stored in Chrome's sync storage. After successfully updating the bookmarks array in storage,
     * it calls `loadBookmarks` to refresh the displayed list of bookmarks, ensuring the newly added bookmark
     * is visible to the user.
     */
    saveBookmark() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (chrome.runtime.lastError || tabs.length === 0) {
                return;
            }

            const activeTab = tabs[0];
            const bookmark = {title: activeTab.title, url: activeTab.url};

            chrome.storage.sync.get({bookmarks: []}, (data) => {
                const bookmarks = data.bookmarks;
                bookmarks.push(bookmark);

                chrome.storage.sync.set({bookmarks}, () => {
                    this.loadBookmarks(); // Load bookmarks after saving
                });
            });
        });
    }

    /**
     * Loads and displays bookmarks from Chrome's storage.
     *
     * This method fetches the stored bookmarks array from Chrome's sync storage and dynamically creates
     * HTML elements to display each bookmark in the `bookmarkList` container. Each bookmark is represented
     * by a `div` element containing a clickable link to the bookmarked URL and a delete icon for removing
     * the bookmark. Additionally, drag and drop event listeners are added to each bookmark item for reordering.
     *
     * The `dragstart` event stores the index of the dragged bookmark, while the `dragover` event allows the
     * bookmark to be dropped over another bookmark. The `drop` event calculates the new index for the dropped
     * bookmark and calls `moveBookmark` to update its position in the storage and UI.
     */
    loadBookmarks() {
        chrome.storage.sync.get({bookmarks: []}, (data) => {
            const bookmarks = data.bookmarks;

            this.bookmarkList.innerHTML = "";

            bookmarks.forEach((bookmark, index) => {
                const bookmarkItem = document.createElement("div");
                bookmarkItem.classList.add("bookmark-item");
                bookmarkItem.draggable = true;
                bookmarkItem.dataset.index = index;

                const linkAndDeleteContainer = document.createElement("div");
                linkAndDeleteContainer.classList.add("link-delete-container");

                const link = document.createElement("a");
                link.href = bookmark.url;
                link.target = "_blank";
                link.textContent = bookmark.title;

                const deleteIcon = document.createElement("img");
                deleteIcon.src = "../assets/icons/delete_icon.png";
                deleteIcon.title = "Delete this URL";
                deleteIcon.classList.add("delete-icon");
                deleteIcon.addEventListener("click", () => {
                    this.deleteBookmark(index);
                });

                linkAndDeleteContainer.appendChild(link);
                linkAndDeleteContainer.appendChild(deleteIcon);
                bookmarkItem.appendChild(linkAndDeleteContainer);
                this.bookmarkList.appendChild(bookmarkItem);

                // Add drag and drop event listeners
                bookmarkItem.addEventListener("dragstart", (event) => {
                    event.dataTransfer.setData("text/plain", index);
                });
                bookmarkItem.addEventListener("dragover", (event) => {
                    event.preventDefault();
                });
                bookmarkItem.addEventListener("drop", (event) => {
                    event.preventDefault();
                    const draggedIndex = event.dataTransfer.getData("text/plain");
                    this.moveBookmark(draggedIndex, index);
                });
            });
        });
    }

    /**
     * Moves a bookmark to a new position within the bookmarks list and updates the storage.
     *
     * This function first retrieves the current list of bookmarks from Chrome's storage. It then checks
     * if the new index is within the valid range of the bookmarks array. If the new index is valid, it
     * removes the bookmark from its old position and inserts it at the new position. Finally, it updates
     * the Chrome storage with the modified bookmarks list and reloads the bookmarks to reflect the changes.
     *
     * @param {number} oldIndex - The current index of the bookmark to be moved.
     * @param {number} newIndex - The new index where the bookmark should be moved to.
     */
    moveBookmark(oldIndex, newIndex) {
        // Get the current list of bookmarks
        chrome.storage.sync.get({bookmarks: []}, (data) => {
            let bookmarks = data.bookmarks;

            // Check if the new index is within the range
            if (newIndex < 0 || newIndex >= bookmarks.length) {
                console.error("New index is out of range.");
                return;
            }

            // Remove the bookmark from its current position
            let bookmark = bookmarks.splice(oldIndex, 1)[0];

            // Insert the bookmark at the new position
            bookmarks.splice(newIndex, 0, bookmark);

            // Save the updated bookmarks back to the Chrome storage
            chrome.storage.sync.set({bookmarks}, () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }
                this.loadBookmarks();
            });
        });
    }

    /**
     * Deletes a bookmark from the stored bookmarks list by its index and updates the bookmark list.
     *
     * This method retrieves the current list of bookmarks from Chrome's storage, removes the bookmark
     * at the specified index, and then updates the storage with the new list of bookmarks. After updating,
     * it reloads the bookmark list to reflect the changes.
     *
     * @param {number} index - The index of the bookmark to be deleted from the list.
     */
    deleteBookmark(index) {
        chrome.storage.sync.get({bookmarks: []}, (data) => {
            const bookmarks = data.bookmarks;
            bookmarks.splice(index, 1);
            chrome.storage.sync.set({bookmarks}, () => {
                this.loadBookmarks(); // Reload bookmarks after deleting
            });
        });
    }
}

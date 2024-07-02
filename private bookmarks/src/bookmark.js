/**
 * The Bookmark class represents a bookmark manager.
 * It provides methods to save, load, and delete bookmarks.
 * The bookmarks are stored in the Chrome storage and displayed in a list in the extension.
 *
 * @class
 * @property {HTMLElement} bookmarkList - The HTML element that displays the list of bookmarks.
 */
export class Bookmark {
    /**
     * Creates a new Bookmark manager.
     * Initializes the bookmark list to the HTML element with the ID "bookmarkList".
     *
     * @constructor
     */
    constructor() {
        this.bookmarkList = document.getElementById("bookmarkList");
    }

    /**
     * This method is used to save the current active tab as a bookmark.
     * It first queries the active tab in the current window.
     * If there is no active tab or an error occurs during the query, the method returns without doing anything.
     * Otherwise, it creates a bookmark object with the title and URL of the active tab.
     * It then gets the current list of bookmarks from the Chrome storage, adds the new bookmark to the list, and saves the updated list back to the Chrome storage.
     * After the new bookmark is saved, it calls the `loadBookmarks` method to refresh the list of bookmarks displayed in the extension.
     */
    saveBookmark() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || tabs.length === 0) {
                return;
            }

            const activeTab = tabs[0];
            const bookmark = { title: activeTab.title, url: activeTab.url };

            chrome.storage.sync.get({ bookmarks: [] }, (data) => {
                const bookmarks = data.bookmarks;
                bookmarks.push(bookmark);

                chrome.storage.sync.set({ bookmarks }, () => {
                    this.loadBookmarks(); // Load bookmarks after saving
                });
            });
        });
    }

    /**
     * This method is used to load the bookmarks from the Chrome storage.
     * It creates a new bookmark item for each bookmark and appends it to the bookmark list.
     * Each bookmark item consists of a link to the bookmarked page and a delete icon.
     * The delete icon has an event listener attached to it that deletes the bookmark when clicked.
     */
    loadBookmarks() {
        // Get the bookmarks from the Chrome storage
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;

            // Clear the bookmark list
            this.bookmarkList.innerHTML = "";

            // Create a new bookmark item for each bookmark
            bookmarks.forEach((bookmark, index) => {
                // Create the bookmark item container
                const bookmarkItem = document.createElement("div");
                bookmarkItem.classList.add("bookmark-item");

                // Create the container for the link and delete icon
                const linkAndDeleteContainer = document.createElement("div");
                linkAndDeleteContainer.classList.add("link-delete-container");

                // Create the link to the bookmarked page
                const link = document.createElement("a");
                link.href = bookmark.url;
                link.target = "_blank";
                link.textContent = bookmark.title;

                // Create the delete icon
                const deleteIcon = document.createElement("img");
                deleteIcon.src = "../assets/icons/delete_icon.png";
                deleteIcon.classList.add("delete-icon");

                // Attach an event listener to the delete icon that deletes the bookmark when clicked
                deleteIcon.addEventListener("click", () => {
                    this.deleteBookmark(index);
                });

                // Append the link and delete icon to the link and delete container
                linkAndDeleteContainer.appendChild(link);
                linkAndDeleteContainer.appendChild(deleteIcon);

                // Append the link and delete container to the bookmark item
                bookmarkItem.appendChild(linkAndDeleteContainer);

                // Append the bookmark item to the bookmark list
                this.bookmarkList.appendChild(bookmarkItem);
            });
        });
    }

    /**
     * This method is used to delete a bookmark from the Chrome storage.
     * It takes an index as a parameter which corresponds to the position of the bookmark in the bookmark list.
     * It first gets the current list of bookmarks from the Chrome storage.
     * It then removes the bookmark at the given index from the list using the `splice` method.
     * After the bookmark is removed, it saves the updated list back to the Chrome storage.
     * Finally, it calls the `loadBookmarks` method to refresh the list of bookmarks displayed in the extension.
     *
     * @param {number} index - The index of the bookmark to delete.
     */
    deleteBookmark(index) {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            bookmarks.splice(index, 1);
            chrome.storage.sync.set({ bookmarks }, () => {
                this.loadBookmarks(); // Reload bookmarks after deleting
            });
        });
    }
}

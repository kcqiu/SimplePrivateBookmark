// bookmark.js

export class Bookmark {
    constructor() {
        this.bookmarkList = document.getElementById("bookmarkList");
    }

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

    loadBookmarks() {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            this.bookmarkList.innerHTML = "";
            bookmarks.forEach((bookmark, index) => {
                const bookmarkItem = document.createElement("div");
                bookmarkItem.classList.add("bookmark-item");

                const linkAndDeleteContainer = document.createElement("div");
                linkAndDeleteContainer.classList.add("link-delete-container");

                const link = document.createElement("a");
                link.href = bookmark.url;
                link.target = "_blank";
                // link.textContent = bookmark.title.length > 20 ? bookmark.title.substring(0, 20) + '...' : bookmark.title;
                link.textContent = bookmark.title
                const deleteIcon = document.createElement("img");
                deleteIcon.src = "../assets/icons/delete_icon.png";
                deleteIcon.classList.add("delete-icon");
                deleteIcon.addEventListener("click", () => {
                    this.deleteBookmark(index);
                });

                linkAndDeleteContainer.appendChild(link);
                linkAndDeleteContainer.appendChild(deleteIcon);
                bookmarkItem.appendChild(linkAndDeleteContainer);
                this.bookmarkList.appendChild(bookmarkItem);
            });
        });
    }

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

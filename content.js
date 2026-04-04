/**
 * Wait for video element to appear in the DOM, then initialize tracking
 */
function waitForVideo() {
    const observer = new MutationObserver(() => {
        const video = document.querySelector("video");

        if (video) {
            observer.disconnect();
            initializeVideoTracking(video);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Initializes video tracking for a given video element
 * @param {HTMLVideoElement} video 
 */
function initializeVideoTracking(video) {
    const videoKey = window.location.pathname;

    restorePlaybackTime(video, videoKey);
    enableSoundOnInteraction(video);
    trackAndSaveProgress(video, videoKey);
}

/**
 * Restores the playback time of the video from storage
 * @param {HTMLVideoElement} video 
 * @param {string} videoKey 
 */
function restorePlaybackTime(video, videoKey) {
    loadTime(videoKey, (savedTime) => {
        if (!savedTime) return;

        video.addEventListener("loadedmetadata", () => {
            video.currentTime = savedTime;
        });
    });
}

/**
 * Loads the saved time for a video from storage
 * @param {string} videoKey 
 * @param {function} callback 
 */
function loadTime(videoKey, callback) {
    chrome.storage.sync.get(["videos"], (result) => {
        const videos = result.videos || {};
        callback(videos[videoKey]);
    });
}

/**
 * Tracks video progress and saves it to storage
 * @param {HTMLVideoElement} video 
 * @param {string} videoKey 
 */
function trackAndSaveProgress(video, videoKey) {
    let lastSavedSecond = 0;

    video.addEventListener("timeupdate", () => {
        const currentSecond = Math.floor(video.currentTime);

        if (currentSecond % 5 === 0 && currentSecond !== lastSavedSecond) {
            lastSavedSecond = currentSecond;
            saveTime(videoKey, video.currentTime);
        }
    });
}

/**
 * 
 * Saves the current time of the video to storage
 * @param {string} videoKey 
 * @param {number} time 
 * @returns 
 */
function saveTime(videoKey, time) {
    if (!isExtensionContextValid()) return;

    chrome.storage.sync.get(["videos"], (result) => {
        const videos = result.videos || {};

        videos[videoKey] = time;

        safeStorageSet({ videos });
    });
}

/**
 * Checks if the extension context is valid
 * @returns {boolean}
 */
function isExtensionContextValid() {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
}

/**
 * Safely sets storage data if the extension context is valid
 * @param {Object} data 
 */
function safeStorageSet(data) {
    if (!isExtensionContextValid()) return;

    try {
        chrome.storage.sync.set(data);
    } catch (e) {
        console.log("Storage write skipped (context invalidated)");
    }
}

/**
 * Unmutes video after first user interaction
 * @param {HTMLVideoElement} video 
 */
function enableSoundOnInteraction(video) {
    function unmute() {
        video.muted = false;
        video.volume = 1.0;

        document.removeEventListener("click", unmute);
        document.removeEventListener("keydown", unmute);
    }

    document.addEventListener("click", unmute);
    document.addEventListener("keydown", unmute);
}

/**
 * Start the script
 */
waitForVideo();
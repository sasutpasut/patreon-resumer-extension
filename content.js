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

function initializeVideoTracking(video) {
    const videoKey = window.location.pathname;

    // Restore saved time
    chrome.storage.local.get([videoKey], (result) => {
        const savedTime = result[videoKey];

        if (savedTime) {
            video.addEventListener("loadedmetadata", () => {
                video.currentTime = savedTime;
            });
        }
    });

    // --- UNMUTE LOGIC ---
    enableSoundOnInteraction(video);

    // Save progress every 5 sec
    let lastSaved = 0;

    video.addEventListener("timeupdate", () => {
        const current = Math.floor(video.currentTime);

        if (current % 5 === 0 && current !== lastSaved) {
            lastSaved = current;

            safeStorageSet({
                [videoKey]: video.currentTime
        });
        }
    });
}

function isExtensionContextValid() {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
}

function safeStorageSet(data) {
    if (!isExtensionContextValid()) return;

    try {
        chrome.storage.local.set(data);
    } catch (e) {
        console.log("Context invalidated");
    }
}

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

waitForVideo();
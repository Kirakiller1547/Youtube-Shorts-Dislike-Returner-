// ==UserScript==
// @name         YouTube Shorts Dislike Returner
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Zeigt die Dislikes bei YouTube Shorts wieder an.
// @author       Dein Name
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?bb=youtube.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Wir injizieren die CSS-Styles direkt per JavaScript in die Seite
    const style = document.createElement('style');
    style.innerHTML = `
        .my-custom-dislike-counter {
            color: #f1f1f1 !important;
            font-size: 12px !important;
            font-family: "Roboto", Arial, sans-serif;
            font-weight: 400;
            margin-top: 6px !important;
            display: block !important;
            text-align: center !important;
            width: 100%;
        }
    `;
    document.head.appendChild(style);

    function getShortsVideoId() {
        const match = window.location.href.match(/shorts\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    async function fetchDislikes(videoId) {
        try {
            const response = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.dislikes;
        } catch (error) {
            return null;
        }
    }

    async function updateShortsUI() {
        const videoId = getShortsVideoId();
        if (!videoId) return;

        const allButtons = document.querySelectorAll('button');
        let dislikeButton = null;

        allButtons.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            if (label.toLowerCase().includes('nicht mögen') || label.toLowerCase().includes('dislike')) {
                dislikeButton = btn;
            }
        });

        if (!dislikeButton) return;
        if (dislikeButton.dataset.hasCustomDislike === videoId) return;

        const dislikes = await fetchDislikes(videoId);
        if (dislikes === null) return;
        const formattedDislikes = Intl.NumberFormat('de-DE', { notation: "compact" }).format(dislikes);

        const oldCounter = dislikeButton.querySelector('.my-custom-dislike-counter');
        if (oldCounter) oldCounter.remove();

        const customCounter = document.createElement('div');
        customCounter.className = 'my-custom-dislike-counter';
        customCounter.innerText = formattedDislikes;

        dislikeButton.appendChild(customCounter);
        dislikeButton.dataset.hasCustomDislike = videoId;
    }

    setInterval(updateShortsUI, 700);
})();
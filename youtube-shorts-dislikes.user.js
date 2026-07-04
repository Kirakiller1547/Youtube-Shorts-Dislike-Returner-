// ==UserScript==
// @name         YouTube Shorts Dislike Returner
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Zeigt die Dislikes bei YouTube Shorts wieder an.
// @author       Dein Name
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @grant        GM_xmlhttpRequest
// @connect      returnyoutubedislikeapi.com
// @run-at       document-start
// ==/UserScript==
(function () {
    'use strict';

    // ---------- Styles ----------
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
            pointer-events: none;
        }
    `;
    document.documentElement.appendChild(style);

    // ---------- Cache & Zustand ----------
    const cache = new Map();       // videoId -> dislikes (oder null bei Fehler)
    const pending = new Set();     // videoIds, für die gerade ein Request läuft
    let lastAppliedId = null;

    // Der Umriss-Pfad des Dislike-Icons ist sprachunabhängig, dient als
    // zuverlässiger Fallback falls das aria-label nicht erkannt wird.
    const DISLIKE_PATH_HINT = 'M12 5';
    const DISLIKE_LABELS = [
        'dislike', 'nicht mögen', 'no me gusta', 'je n’aime pas', "je n'aime pas",
        'non mi piace', 'não gostei', 'niet leuk', 'nie podoba', 'не нравится',
        '低評価', '싫어요', '不喜欢', '不喜歡'
    ];

    function getShortsVideoId() {
        const match = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    // Ermittelt den aktuell sichtbaren Shorts-Renderer (nicht die
    // vorgeladenen Nachbar-Videos), damit der Zähler nie am falschen
    // Video angebracht wird.
    function getActiveShortsRenderer() {
        const renderers = document.querySelectorAll('ytd-reel-video-renderer');
        let best = null;
        let bestScore = -Infinity;
        renderers.forEach(r => {
            const rect = r.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const visibleTop = Math.max(rect.top, 0);
            const visibleBottom = Math.min(rect.bottom, window.innerHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            if (visibleHeight > bestScore) {
                bestScore = visibleHeight;
                best = r;
            }
        });
        return best;
    }

    function findDislikeButton(root) {
        if (!root) return null;
        const buttons = root.querySelectorAll('button');
        for (const btn of buttons) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (DISLIKE_LABELS.some(l => label.includes(l))) return btn;
        }
        // Fallback über das Icon-Pfad-Fragment
        for (const btn of buttons) {
            const path = btn.querySelector('svg path');
            if (path && path.getAttribute('d') && path.getAttribute('d').startsWith(DISLIKE_PATH_HINT)) {
                return btn;
            }
        }
        return null;
    }

    function gmFetch(url) {
        return new Promise((resolve) => {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: 8000,
                    onload: (res) => {
                        try {
                            if (res.status >= 200 && res.status < 300) {
                                resolve(JSON.parse(res.responseText));
                            } else {
                                resolve(null);
                            }
                        } catch (e) {
                            resolve(null);
                        }
                    },
                    onerror: () => resolve(null),
                    ontimeout: () => resolve(null)
                });
            } else {
                // Fallback ohne GM_xmlhttpRequest
                fetch(url).then(r => r.ok ? r.json() : null).then(resolve).catch(() => resolve(null));
            }
        });
    }

    async function fetchDislikes(videoId) {
        if (cache.has(videoId)) return cache.get(videoId);
        if (pending.has(videoId)) return null; // Request läuft bereits
        pending.add(videoId);
        try {
            const data = await gmFetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
            const dislikes = data && typeof data.dislikes === 'number' ? data.dislikes : null;
            cache.set(videoId, dislikes);
            return dislikes;
        } finally {
            pending.delete(videoId);
        }
    }

    function removeAllCounters() {
        document.querySelectorAll('.my-custom-dislike-counter').forEach(el => el.remove());
    }

    async function updateShortsUI() {
        const videoId = getShortsVideoId();
        if (!videoId) {
            if (lastAppliedId !== null) {
                removeAllCounters();
                lastAppliedId = null;
            }
            return;
        }

        const renderer = getActiveShortsRenderer();
        const dislikeButton = findDislikeButton(renderer || document);
        if (!dislikeButton) return;

        if (dislikeButton.dataset.hasCustomDislike === videoId) return;

        let dislikes = cache.get(videoId);
        if (dislikes === undefined) {
            dislikes = await fetchDislikes(videoId);
            if (dislikes === undefined || dislikes === null) return;
        }
        if (dislikes === null) return;

        // Zwischenzeitlich könnte der Nutzer weitergescrollt sein.
        if (getShortsVideoId() !== videoId) return;

        const formatted = new Intl.NumberFormat('de-DE', { notation: 'compact' }).format(dislikes);

        // Alte Zähler in diesem Button (und ggf. verwaiste woanders) entfernen
        const oldCounter = dislikeButton.querySelector('.my-custom-dislike-counter');
        if (oldCounter) oldCounter.remove();

        const customCounter = document.createElement('div');
        customCounter.className = 'my-custom-dislike-counter';
        customCounter.innerText = formatted;
        dislikeButton.appendChild(customCounter);
        dislikeButton.dataset.hasCustomDislike = videoId;
        lastAppliedId = videoId;
    }

    // ---------- Trigger: MutationObserver + Intervall als Sicherheitsnetz ----------
    let scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            scheduled = false;
            updateShortsUI();
        }, 150);
    }

    const observer = new MutationObserver(schedule);
    function startObserving() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            setTimeout(startObserving, 50);
        }
    }
    startObserving();

    // Reagiert auch auf SPA-Navigation (History-API) von YouTube
    ['yt-navigate-finish', 'popstate'].forEach(evt =>
        window.addEventListener(evt, schedule)
    );

    // Sicherheitsnetz, falls mal ein Event verpasst wird
    setInterval(updateShortsUI, 1000);
})();

// ==UserScript==
// @name         YouTube Shorts Dislike Returner
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Zeigt die Dislikes bei YouTube Shorts wieder an (eigener Button, da YouTube keinen Dislike-Button mehr rendert).
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
        .my-dislike-btn-wrapper {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 8px 0 !important;
        }
        .my-dislike-btn-icon {
            width: 48px;
            height: 48px;
            border-radius: 999px;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f1f1f1;
        }
        .my-dislike-btn-icon svg {
            width: 24px;
            height: 24px;
            fill: #f1f1f1;
        }
        .my-dislike-btn-count {
            color: #f1f1f1 !important;
            font-size: 12px !important;
            font-family: "Roboto", Arial, sans-serif;
            font-weight: 400;
            margin-top: 4px !important;
            text-align: center !important;
        }
        .my-dislike-btn-count.loading {
            opacity: 0.5;
        }
    `;
    document.documentElement.appendChild(style);

    // Material-Icon "thumb_down" (Standard-Icon, keine YouTube-eigene Grafik)
    const THUMB_DOWN_SVG = `<svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>`;

    // ---------- Cache & Zustand ----------
    const cache = new Map();
    const pending = new Set();

    const LIKE_LABEL_HINTS = ['liken', 'gefällt mir', 'like this', 'i like this'];

    function getShortsVideoId() {
        const match = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

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

    function findLikeButton(root) {
        if (!root) return null;
        const buttons = root.querySelectorAll('button');
        for (const btn of buttons) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (!label) continue;
            if (label.includes('dislike') || label.includes('nicht mögen')) continue;
            if (LIKE_LABEL_HINTS.some(l => label.includes(l))) return btn;
        }
        return null;
    }

    // Findet den "Aktions-Block" (Like/Kommentar/Teilen/Remix stehen
    // typischerweise als Geschwister-Elemente in einem gemeinsamen
    // Container). Gibt sowohl den Container als auch das Like-Element
    // (das Kind, direkt unter dem Container) zurück.
    function findActionItem(likeButton) {
        let el = likeButton;
        for (let i = 0; i < 6 && el && el.parentElement; i++) {
            const parent = el.parentElement;
            const buttonSiblings = Array.from(parent.children).filter(
                c => c.tagName === 'BUTTON' || (c.querySelector && c.querySelector('button'))
            );
            if (buttonSiblings.length >= 2) {
                return { container: parent, item: el };
            }
            el = parent;
        }
        // Fallback: direkter Elternknoten des Buttons
        return { container: likeButton.parentElement, item: likeButton };
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
                fetch(url).then(r => r.ok ? r.json() : null).then(resolve).catch(() => resolve(null));
            }
        });
    }

    async function fetchDislikes(videoId) {
        if (cache.has(videoId)) return cache.get(videoId);
        if (pending.has(videoId)) return undefined;
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

    function ensureDislikeElement(container, afterItem, videoId) {
        let el = container.querySelector('.my-dislike-btn-wrapper');
        if (el && el.dataset.videoId === videoId) return el;

        if (el) el.remove();

        el = document.createElement('div');
        el.className = 'my-dislike-btn-wrapper';
        el.dataset.videoId = videoId;
        el.innerHTML = `
            <div class="my-dislike-btn-icon">${THUMB_DOWN_SVG}</div>
            <div class="my-dislike-btn-count loading">…</div>
        `;
        afterItem.insertAdjacentElement('afterend', el);
        return el;
    }

    function removeAllCounters() {
        document.querySelectorAll('.my-dislike-btn-wrapper').forEach(el => el.remove());
    }

    let lastVideoId = null;

    async function updateShortsUI() {
        const videoId = getShortsVideoId();
        if (!videoId) {
            if (lastVideoId !== null) {
                removeAllCounters();
                lastVideoId = null;
            }
            return;
        }

        const renderer = getActiveShortsRenderer();
        const likeButton = findLikeButton(renderer || document);
        if (!likeButton) return;

        const { container, item } = findActionItem(likeButton);
        if (!container || !item) return;

        const el = ensureDislikeElement(container, item, videoId);
        const countEl = el.querySelector('.my-dislike-btn-count');

        let dislikes = cache.get(videoId);
        if (dislikes === undefined) {
            countEl.textContent = '…';
            countEl.classList.add('loading');
            dislikes = await fetchDislikes(videoId);
            if (dislikes === undefined) return; // Request lief bereits, später erneut versuchen
        }

        // Falls der Nutzer inzwischen weitergescrollt ist, nichts mehr anfassen.
        if (getShortsVideoId() !== videoId) return;

        if (dislikes === null) {
            countEl.textContent = '–';
            countEl.classList.remove('loading');
            return;
        }

        const formatted = new Intl.NumberFormat('de-DE', { notation: 'compact' }).format(dislikes);
        countEl.textContent = formatted;
        countEl.classList.remove('loading');
        lastVideoId = videoId;
    }

    // ---------- Trigger ----------
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

    ['yt-navigate-finish', 'popstate'].forEach(evt =>
        window.addEventListener(evt, schedule)
    );

    setInterval(updateShortsUI, 1000);
})();

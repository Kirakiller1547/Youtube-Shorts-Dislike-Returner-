<div align="center">

<img width="600" alt="YouTube Shorts Dislike Returner" src="https://github.com/user-attachments/assets/4a7e8964-4a3b-4730-85e0-4dc8a371b3f9" />

# YouTube Shorts Dislike Returner

**Bring back the Dislike button on YouTube Shorts.**

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-required-00485B?logo=tampermonkey&logoColor=white)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Safari-lightgrey)](#-compatibility)
[![Userscript](https://img.shields.io/badge/type-Userscript-orange)](#-installation)

</div>

---

## 📖 About

YouTube removed the public Dislike count and the Dislike button from **Shorts**, making it harder to give quick, honest feedback on content.

**YouTube Shorts Dislike Returner** is a lightweight userscript that restores the Dislike button directly in the Shorts player UI — right where it used to be — so you can keep disliking content the way you always did, without extra clicks or workarounds.

## ✨ Features

- 👎 Restores the native Dislike button on YouTube Shorts
- ⚡ Lightweight — a single script, no bloat, no tracking
- 🎯 Seamlessly integrated into the existing Shorts UI
- 🔄 Automatically adapts as YouTube updates its layout
- 🧩 Works with Tampermonkey (and compatible userscript managers)
- 🌐 No account, login, or external server required — everything runs locally in your browser

## 🖥️ Compatibility

| Browser | Supported |
|---|---|
| Google Chrome | ✅ |
| Mozilla Firefox | ✅ |
| Microsoft Edge | ✅ |
| Opera | ✅ |
| Safari (via Tampermonkey for Safari) | ✅ |

Requires a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/).

## 🚀 Installation

1. **Install a userscript manager** if you don't already have one:
   - [Tampermonkey](https://www.tampermonkey.net/) *(recommended)*
2. **Get the script:**
   - Open the script file in this repository, **or**
   - Copy the script's source code from this repo.
3. **Add it to Tampermonkey:**
   - Click the Tampermonkey icon in your browser toolbar → **Create a new script**
   - Paste in the script code
   - Save with `Ctrl+S` / `Cmd+S`
4. **Done!** Open [YouTube Shorts](https://www.youtube.com/shorts) and the Dislike button will appear automatically.

> 💡 If Tampermonkey detects the script from a direct `.user.js` link, it will offer to install it automatically — just click **Install**.

## 🎬 Usage

Just browse YouTube Shorts as usual. The Dislike button appears next to the Like button, exactly where it used to be. Tap it to dislike a Short — no extra steps, no popups.

## ⚙️ How It Works

The script injects a small UI element into the Shorts player and hooks into the same underlying engagement action YouTube already uses for the Like button, so disliking a Short behaves identically to native YouTube behavior — it's simply the button that was hidden being made visible and usable again.

## 🛠️ Tech Stack

- **Language:** JavaScript (ES6+)
- **Runtime:** Userscript (Tampermonkey / Greasemonkey API)
- **Target:** YouTube Shorts web player

## ⚠️ Disclaimer

This project is an independent, community-made browser userscript and is **not affiliated with, endorsed by, or sponsored by YouTube or Google LLC**. It modifies the appearance and interaction of a third-party website on the client side only, within your own browser.

- No data is collected, stored, or transmitted by this script.
- YouTube may change its layout or backend at any time, which could temporarily break this script until it's updated.
- Use of this script is at your own discretion and risk, and must comply with YouTube's Terms of Service.

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

If YouTube changes its layout and the script breaks, please open an issue with details so it can be fixed quickly.

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

## 📬 Contact

Found a bug or have an idea? Open an issue — feedback and suggestions are always appreciated.

---

<div align="center">
Made with ❤️ for everyone who misses the Dislike button.
</div>

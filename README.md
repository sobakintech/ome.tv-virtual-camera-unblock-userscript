# OmeTV Virtual Camera Unblock

A userscript that lets you use OBS and other virtual cameras on [ome.tv](https://ome.tv), which
normally rejects them as "virtual" and blocks your camera. Your real device names are kept as-is, with
no renaming and no fake webcam.

Works with OBS Virtual Camera, DroidCam, NVIDIA Broadcast, XSplit, Snap Camera, ManyCam, and most
others.

> [!WARNING]
> **Never click Start while your virtual camera is off** (e.g. OBS showing its default placeholder:
> the OBS logo on a dark blue background with a crossed-out camera icon beneath it). ome.tv treats
> that static placeholder feed as fake and **instantly bans your account.** Always start the virtual
> camera and confirm it's showing a live image *before* you connect.

## Install

**1. Get a userscript manager.** You need one browser extension to run the script:

- **Chrome / Brave:** use **[Tampermonkey](https://www.tampermonkey.net/)**. (Violentmonkey no longer
  runs here since Chrome removed Manifest V2 support in mid-2025.)
- **Edge:** use **[Violentmonkey](https://microsoftedge.microsoft.com/addons/detail/eeagobfjdenkkddmbclomhiblgggliao)**
  (free and open source, still supported on Edge) or Tampermonkey.
- **Firefox:** use **[Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/)** or
  Tampermonkey.

**2. Install the script.** Open
[ometv-unblock.user.js](https://github.com/sobakintech/ome.tv-virtual-camera-unblock-userscript/releases/latest/download/ometv-unblock.user.js)
(latest release). Your userscript manager will show its install page, where you click **Install**.
Updates then arrive automatically.

## Develop (hot reload)

```bash
bun install
bun run dev
```

vite-plugin-monkey serves a dev loader userscript on `http://localhost:3000`. Install that loader once
in Tampermonkey or Violentmonkey (open the URL the dev server prints). After that, editing anything
under `src/` hot-reloads on ome.tv. Just keep the tab open, no reinstalling.

## Build

```bash
bun run build      # outputs dist/ometv-unblock.user.js (+ .meta.js)
```

## Release

CI (`.github/workflows/release.yml`) builds and publishes the userscript as a release asset whenever a
`v*` tag is pushed:

```bash
git tag v1.2.0
git push origin v1.2.0
```

The release asset feeds `@downloadURL` and `@updateURL`, so installed copies auto-update. Metadata
(name, match, version, URLs) is defined once in `vite.config.js`; `version` comes from `package.json`.

## How it works

ome.tv's virtual-camera detection is entirely client-side. It funnels through one global,
`window.FCN`, whose `isValid(label)` and `isSuspicious(label)` methods match the device label against
about 75 known virtual-cam names and regexes. This userscript intercepts `window.FCN` at
`document-start` and neutralizes those two methods, so every device passes with its real name.

ManyCam is a special case. ome.tv has a separate hard-coded check that fires when a track label
contains `manycam`, which `FCN` doesn't cover. For that one camera we sanitize only the internal
track-label string it inspects (via `MediaStreamTrack.prototype.label`). The device picker reads
`enumerateDevices`, so the real "ManyCam" name still shows in the dropdown.

Built with Vite, vite-plugin-monkey (HMR), and Bun. Entry is `src/main.js`; the interception logic
lives in `src/shim.js`. Set `DEBUG = true` in `src/shim.js` to log when the checks are intercepted.
The patch must run before ome.tv captures its `getUserMedia` reference, hence `document-start`; if a
change ever seems not to take effect, hard-reload the tab.

## Disclaimer

This userscript is provided as-is, for educational purposes, with no warranty. You use it at your own
risk. I am **not responsible for any consequences to your account**, including bans, suspensions, or
any other action taken by ome.tv as a result of using this script.

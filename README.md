# OmeTV Virtual Camera Unblock

Userscript that makes OBS / virtual cameras usable on [ome.tv](https://ome.tv). ome.tv accepts the
stream then rejects it for looking virtual. Its detection is entirely client-side and funnels through
one global — `window.FCN.isValid(label)` / `.isSuspicious(label)`, which match the device label
against ~75 known virtual-cam names/regexes. This userscript intercepts `window.FCN` at
`document-start` and neutralizes those two methods, bypassing the check **at the root** — so your real
device names (e.g. "OBS Virtual Camera") pass through unchanged, with no renaming or stream spoofing.

> Known limitation: labels containing `manycam` hit a separate hard-coded client throw that isn't
> reachable through `FCN`; ManyCam is the one virtual cam this can't unblock without renaming it.

Built with [Vite](https://vitejs.dev) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
(HMR while you develop) and Bun.

## Install (users)

Grab the latest build from [Releases](https://github.com/sobakintech/ome.tv-userscript/releases/latest)
and open `ometv-unblock.user.js` — Tampermonkey / Violentmonkey will offer to install it. Updates are
delivered automatically via `@updateURL`.

## Develop (hot reload)

```bash
bun install
bun run dev
```

vite-plugin-monkey serves a **dev loader userscript** on `http://localhost:3000`. Install that loader
**once** in Tampermonkey / Violentmonkey (open the URL the dev server prints). From then on, editing
anything under `src/` hot-reloads on ome.tv — just keep the tab open, no reinstalling.

- Entry: `src/main.js` → `installShim()`
- The `FCN` interception lives in `src/shim.js`.
- Set `DEBUG = true` in `src/shim.js` to log when `FCN` is intercepted/neutralized.

> Note: the patch must land before ome.tv's bundle captures its `getUserMedia` reference, so it runs
> at `document-start`. If a change ever seems to not take effect, hard-reload the ome.tv tab.

## Build

```bash
bun run build      # -> dist/ometv-unblock.user.js  (+ .meta.js)
```

## Release

CI (`.github/workflows/release.yml`) builds and publishes the userscript as a release asset whenever a
`v*` tag is pushed:

```bash
git tag v2.0.0
git push origin v2.0.0
```

The release asset feeds `@downloadURL` / `@updateURL`, so installed copies auto-update. Metadata (name,
match, version, URLs) is defined once in `vite.config.js`; `version` comes from `package.json`.

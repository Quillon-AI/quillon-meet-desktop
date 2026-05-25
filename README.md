# Quillon Meet — Desktop

Cross-platform desktop wrapper for **Quillon Meet** — a privacy-focused
video-conferencing service from [Quillon](https://quillon.ru).

The desktop app is a thin Electron shell around the web client at
[meet.quillon.ru](https://meet.quillon.ru), adding system-level features
(`quillonmeet://` deep links, menu-bar integration, native screen-share
permissions).

- **Web client (main product):** https://meet.quillon.ru
- **Mobile apps:** [App Store](https://apps.apple.com/app/id6766286426) · [Google Play](https://play.google.com/store/apps/details?id=ru.quillon.meet)
- **Source organisation:** [github.com/Quillon-AI](https://github.com/Quillon-AI)

## Download

Signed installers are published on the public
[quillon-meet-dist](https://github.com/Quillon-AI/quillon-meet-dist/releases)
releases page.

| Platform | Format | Signing status |
|---|---|---|
| macOS (universal) | `.dmg` | **Signed + notarized** by Apple (Developer ID: KVILLON, OOO — `TDHN55CXZH`) |
| Windows x64 | `.exe` (NSIS) | **Currently unsigned** — see [Security & signing](#security--signing) below |

## Build from source

Requires Node.js 20+ and the platform's native toolchain (Xcode on macOS).

```bash
npm install
npm run build:mac    # Universal DMG
npm run build:win    # NSIS x64 installer
npm run build:all    # Both
```

Build output goes to `dist/`.

## Security & signing

**macOS:** every release is signed with Apple Developer ID `TDHN55CXZH`
and notarized through Apple's automated malware scan. Gatekeeper passes
silently.

**Windows:** the v1.0.3 installer is unsigned. Windows SmartScreen will
show "Windows protected your PC" the first time it runs and require
*More info → Run anyway*. We're applying to
[SignPath Foundation](https://signpath.org) for free OSS code-signing
sponsorship; once accepted, future releases will ship a properly signed
EXE with no SmartScreen prompt.

In the meantime, Windows users can use the full-featured web client at
[meet.quillon.ru](https://meet.quillon.ru) in any modern browser
(Chrome, Edge, Firefox).

## Contributing

Issues and pull requests welcome. Releases are automated via
`.github/workflows/build.yml` — tagging `vX.Y.Z` triggers
cross-platform builds and uploads artefacts to the releases page.

## License

[MIT](./LICENSE) — © 2026 KVILLON, OOO.

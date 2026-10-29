# VSCodium local build

Unofficial Linux x64 [VSCodium](https://github.com/VSCodium/vscodium) AppImages, rebuilt for each
new VS Code release with VSCodium's privacy patches ported forward.

## Install and update

Download the AppImage from the [latest release](../../releases/latest) and make it executable.
It carries zsync update information, so AppImageUpdate or Gear Lever updates it in place from
the newest release.

Not an official or signed VSCodium release. Linux x64 only.

## How releases are made

Each VS Code release gets its own workspace under `versions/<vscode-version>[-vscodium-<sha7>]/`
with its pins (`config.json`, `sources.lock.json`), ported patches, scripts and builder
`Containerfile`. The release number is the workspace's `release_version`.

1. Check upstream: `bash scripts/update/check-upstreams.sh`
2. Port to the new release: `bash scripts/update/update.sh <previous> <new>`
   (details: [scripts/update/README.md](scripts/update/README.md))
3. Build and review locally: `bash versions/<new>/scripts/release.sh <monitor>`
4. Commit `versions/<new>/` and push. GitHub Actions
   ([build-appimage.yml](.github/workflows/build-appimage.yml)) builds the workspace with the
   highest `release_version` and publishes release `v<release_version>` with the AppImage,
   `.zsync`, `.sha256` and manifest. A push that does not raise `release_version` builds nothing.

Large local state (`sources/`, `work/`, `cache/`, `logs/`, `dist/`) is not committed.

## Build locally

```bash
bash versions/<workspace>/scripts/build.sh
```

Needs Bash, Git, curl, jq, Node 22+, rootless Podman, ripgrep and binutils; compilation runs in
the workspace's container. Output: `versions/<workspace>/dist/VSCodium-local-<release>-x86_64.AppImage`.

## Privacy

VSCodium's telemetry-off defaults, Open VSX gallery and disabled automatic updates are kept, and
bundled Copilot/agent SDKs are removed. Static checks run on every build. This is not a claim of
zero network traffic: extensions, sign-in and links can still reach external services.

History of the first port (VS Code 1.139.1): [docs/](docs/).

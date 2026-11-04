# Local VSCodium branding

The red and black logo uses the original VSCodium vector path, filled with
`#FF0000`, on a black circle centered at (512, 512) with radius 480.
The 1024 x 1024 PNG has transparency outside the circle.

`logo.svg` is the editable source. Render a candidate with
`bash scripts/render-logo.sh /path/to/new-logo.png`, then review it before
replacing `assets/branding/logo.png`. Preserve a backup when changing assets.

Fresh build preparation overlays these assets into the Linux application icon
and workbench SVG in the disposable work copy. Pinned sources remain pristine.
AppImage packaging uses the same PNG and sets `X-AppImage-Version` from the
packaged application's version after checking it against `config.json`.
The desktop entry displays VSCodium with the description "Code editor".

A bundled declarative extension, `local-theme-defaults`, contributes Dark Modern
and the 40 requested red color overrides as configuration defaults. It has no
executable code. User and workspace settings can override these defaults.
Compile and resume entrypoints apply the same assets before running the build.
Artifact checks require the bundled defaults manifest to match the input.

Run `bash scripts/check-next-build-branding.sh` to check the inputs without
compiling or packaging an AppImage. These checks do not verify a future build.
Existing artifacts and installed launchers are unchanged. Gear Lever may keep
cached launcher metadata until the next AppImage is imported or integrated.

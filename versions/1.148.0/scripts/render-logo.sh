#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
output=${1:?Provide a new output PNG path}
[[ ! -e "$output" ]] || { printf 'Refusing to overwrite %s\n' "$output" >&2; exit 1; }
magick -background none "$project/assets/branding/logo.svg" -colorspace sRGB -depth 8 "PNG32:$output"

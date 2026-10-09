#!/bin/sh
# Select a screen region, OCR it, put the text on the clipboard.
#
# NOTE: Void names the binary `tesseract-ocr`, not `tesseract`.
#
# grim writes PNG to stdout, tesseract reads "-" as stdin and writes "-" to
# stdout, so nothing touches disk. slurp exiting non-zero (Escape) has to be
# caught explicitly or grim would be handed an empty geometry and capture the
# whole screen instead of doing nothing.
set -eu

LANG_CODE=${1:-eng}

geom=$(slurp) || exit 0        # cancelled - not an error

text=$(grim -g "$geom" - | tesseract-ocr -l "$LANG_CODE" - - 2>/dev/null) || {
	notify-send -u critical "OCR failed" "tesseract returned an error"
	exit 1
}

# tesseract pads output with blank lines; strip leading/trailing whitespace but
# keep the internal line structure, which is usually meaningful.
text=$(printf '%s' "$text" | sed -e '/./,$!d' -e :a -e '/^\n*$/{$d;N;ba' -e '}')

if [ -z "$text" ]; then
	notify-send -u normal "OCR" "No text found in that region"
	exit 0
fi

printf '%s' "$text" | wl-copy

# Show a preview so it is obvious the capture worked and grabbed the right
# thing. Collapsed to one line; the clipboard keeps the real formatting.
preview=$(printf '%s' "$text" | tr '\n' ' ' | cut -c1-120)
notify-send "OCR - copied to clipboard" "$preview"

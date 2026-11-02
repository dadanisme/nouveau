#!/usr/bin/env bash
# shot.sh <ios|iphone|android> <device> <name> [light|dark] [outdir]
#   ios     : <device> = matrix key (ios27|ios18|duo) or sim UDID. SIM_DISPLAY=primary|primary-1 picks a Duo screen.
#   iphone  : <device> = physical device name/UDID (xcrun devicectl list devices).
#   android : <device> = matrix key (pixel) or adb serial (emulator-5554).
# Sets appearance (if given), waits for the redraw, saves <outdir>/<device>-<name>[-<mode>].png, prints the path.
# outdir defaults to $SHOT_DIR and must be outside the repo (session scratchpad).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/android-env.sh"
plat="$1" dev="$2" name="$3" mode="${4:-}" out="${5:-${SHOT_DIR:?set SHOT_DIR or pass outdir}}"
mkdir -p "$out"
f="$out/$(printf %s "$dev" | tr -c 'A-Za-z0-9_.-' '_')${SIM_DISPLAY:+-$SIM_DISPLAY}-$name${mode:+-$mode}.png"
case "$plat" in
  ios)
    id="$dev"; [[ "$dev" =~ ^[0-9A-F-]{36}$ ]] || id="$("$HERE/matrix.sh" udid "$dev")"
    [ -z "$mode" ] || { xcrun simctl ui "$id" appearance "$mode"; sleep 1.5; }
    xcrun simctl io "$id" screenshot ${SIM_DISPLAY:+--display="$SIM_DISPLAY"} "$f" >/dev/null 2>&1 ;;
  iphone)
    [ -z "$mode" ] || { xcrun devicectl device settings appearance --device "$dev" --mode "$mode" >/dev/null 2>&1; sleep 1.5; }
    xcrun devicectl device capture screenshot --device "$dev" --destination "$f" >/dev/null 2>&1 ;;
  android)
    s="$dev"; [[ "$dev" == emulator-* || "$dev" == *:* ]] || s="$("$HERE/matrix.sh" serial)"
    [ -z "$mode" ] || { adb -s "$s" shell cmd uimode night "$([ "$mode" = dark ] && echo yes || echo no)" >/dev/null; sleep 2; }
    adb -s "$s" exec-out screencap -p > "$f" ;;
  *) echo "platform must be ios|iphone|android" >&2; exit 2 ;;
esac
echo "$f"

#!/usr/bin/env bash
# Verification-matrix helper. UDIDs are looked up by name+runtime at run time (never hardcoded).
#   matrix.sh list                 -> print matrix entries with UDID/state
#   matrix.sh udid <key>           -> print UDID (iOS) or AVD name (android) for a key
#   matrix.sh boot <key>|all       -> boot sim / start emulator (waits until ready)
#   matrix.sh shutdown <key>|all   -> shut down
# Keys: ios27 (iPhone 17, iOS 27.0) | ios18 (iPhone 16, iOS 18.5) | duo (iPhone Duo, iOS 27.1) | pixel (Pixel_9a AVD)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/android-env.sh"

name_of() { case "$1" in
  ios27) echo "iPhone 17|iOS 27.0";; ios18) echo "iPhone 16|iOS 18.5";;
  duo) echo "iPhone Duo|iOS 27.1";; pixel) echo "Pixel_9a|android";;
  *) echo "unknown key: $1" >&2; exit 2;; esac; }

ios_udid() { # $1=device name $2=runtime label e.g. "iOS 27.0"
  xcrun simctl list devices available | awk -v rt="-- $2 --" -v n="$1" '
    /^-- /{inrt=($0==rt); next}
    inrt { line=$0; sub(/^ +/,"",line); if (index(line, n" (")==1) { match(line,/\([0-9A-F-]{36}\)/); print substr(line,RSTART+1,RLENGTH-2); exit } }'
}

resolve() { local e; e="$(name_of "$1")"; local n="${e%%|*}" rt="${e##*|}"
  if [ "$rt" = android ]; then echo "$n"; else ios_udid "$n" "$rt"; fi; }

emu_serial() { # serial of running emulator for AVD $1
  for s in $(adb devices | awk '/^emulator-/{print $1}'); do
    [ "$(adb -s "$s" emu avd name 2>/dev/null | head -1 | tr -d '\r')" = "$1" ] && { echo "$s"; return; }
  done; }

boot() { local k="$1" id; id="$(resolve "$k")"; [ -n "$id" ] || { echo "$k: device not found" >&2; return 1; }
  if [ "$k" = pixel ]; then
    [ -n "$(emu_serial "$id")" ] || android emulator start "$id" | tr "\r" "\n" | tail -1
    echo "$k -> $(emu_serial "$id")"
  else
    xcrun simctl bootstatus "$id" -b >/dev/null; open -a DeviceHub 2>/dev/null || true  # Xcode 27 Device Hub shows booted sims
    echo "$k -> $id"
  fi; }

shut() { local k="$1" id; id="$(resolve "$k")"
  if [ "$k" = pixel ]; then s="$(emu_serial "$id")"; [ -z "$s" ] || adb -s "$s" emu kill
  else xcrun simctl shutdown "$id" 2>/dev/null || true; fi; }

KEYS="ios27 ios18 duo pixel"
MATRIX_KEYS="ios27 ios18 pixel"  # duo deferred (#38): boot it explicitly if needed
case "${1:-list}" in
  list) for k in $KEYS; do e="$(name_of $k)"; id="$(resolve $k)"
          if [ $k = pixel ]; then st="$( [ -n "$(emu_serial "$id")" ] && echo "Booted $(emu_serial "$id")" || echo Shutdown)"
          else st="$(xcrun simctl list devices | grep "$id" | grep -o '(Booted)\|(Shutdown)' || true)"; fi
          printf '%-6s %-28s %-38s %s\n' "$k" "${e/|/ / }" "${id:-MISSING}" "$st"; done ;;
  udid) resolve "$2" ;;
  serial) emu_serial "$(resolve pixel)" ;;
  boot) [ "$2" = all ] && { for k in $MATRIX_KEYS; do boot $k; done; } || boot "$2" ;;
  shutdown) [ "$2" = all ] && { for k in $KEYS; do shut $k; done; } || shut "$2" ;;
  *) sed -n '2,8p' "$0"; exit 2 ;;
esac

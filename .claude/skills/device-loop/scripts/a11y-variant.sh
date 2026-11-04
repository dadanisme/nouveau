#!/usr/bin/env bash
# a11y-variant.sh <udid|matrix key> <variant>   -> set an iOS simulator accessibility variant, print what it set
# Variants (each sets ALL of appearance / content size / contrast, so variants never leak into each other):
#   default | reset   light, large, increase_contrast disabled, Reduce Motion off
#   dark              dark,  large, contrast off
#   ax5               light, accessibility-extra-extra-extra-large (largest Dynamic Type), contrast off
#   ax5-dark          dark,  accessibility-extra-extra-extra-large, contrast off
#   contrast          light, large, increase_contrast enabled
#   contrast-dark     dark,  large, increase_contrast enabled
#   reduce-motion     light, large, contrast off, Reduce Motion on (RELAUNCH the app, see below)
# Syntax (simctl help ui, Xcode 27.1): simctl ui <udid> appearance light|dark
#   simctl ui <udid> content_size <category>|increment|decrement ; simctl ui <udid> increase_contrast enabled|disabled
#   (no argument prints the current value). Simulators only: the physical iPhone has no equivalent here.
# Live vs relaunch (verified on iPhone 17 / iOS 27, dev client, 2026-11-03):
#   appearance, content_size, increase_contrast apply LIVE to the running app (same pid, redrawn in ~1 s).
#   Reduce Motion is a defaults write (com.apple.Accessibility ReduceMotionEnabled): Settings > Accessibility >
#   Motion reads it back and its toggle writes the same key, but no change notification is posted, so a running
#   app may keep the old value: relaunch it (xcrun simctl terminate + launch) before capturing.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
[ $# -eq 2 ] || { sed -n '2,19p' "$0"; exit 2; }
id="$1" v="$2"
[[ "$id" =~ ^[0-9A-F-]{36}$ ]] || id="$("$HERE/matrix.sh" udid "$id")"

mode=light size=large contrast=disabled motion=false
case "$v" in
  default|reset) ;;
  dark) mode=dark ;;
  ax5) size=accessibility-extra-extra-extra-large ;;
  ax5-dark) mode=dark size=accessibility-extra-extra-extra-large ;;
  contrast) contrast=enabled ;;
  contrast-dark) mode=dark contrast=enabled ;;
  reduce-motion) motion=true ;;
  *) echo "unknown variant: $v" >&2; sed -n '3,10p' "$0" >&2; exit 2 ;;
esac

xcrun simctl ui "$id" appearance "$mode"
xcrun simctl ui "$id" content_size "$size"
xcrun simctl ui "$id" increase_contrast "$contrast"
xcrun simctl spawn "$id" defaults write com.apple.Accessibility ReduceMotionEnabled -bool "$motion"
sleep 1.5  # let the app redraw before a screenshot

rm="$(xcrun simctl spawn "$id" defaults read com.apple.Accessibility ReduceMotionEnabled 2>/dev/null || echo '?')"
echo "$v: appearance=$(xcrun simctl ui "$id" appearance) content_size=$(xcrun simctl ui "$id" content_size)" \
  "increase_contrast=$(xcrun simctl ui "$id" increase_contrast) reduce_motion=$rm"
[ "$motion" = false ] || echo "note: relaunch the app for Reduce Motion: xcrun simctl terminate $id <bundle>; xcrun simctl launch $id <bundle>"

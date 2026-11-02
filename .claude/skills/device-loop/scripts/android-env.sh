#!/usr/bin/env bash
# Source this (". android-env.sh") before Gradle / expo run:android / adb / android CLI.
# Pins JDK 17 for Gradle (system default JDK 26 is too new for RN/Gradle) without touching shell profiles.
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

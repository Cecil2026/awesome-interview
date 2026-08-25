#!/usr/bin/env bash
#
# Rebuild the Android APK from the current source in one step.
#
#   1. assemble www/ from docs/ + Markdown content
#   2. sync web assets into the native Android project
#   3. compile a debug APK with Gradle
#
# Output: android/app/build/outputs/apk/debug/awesome-interview.apk
#
# Usage:
#   bash tools/build_apk.sh          # or:  npm run apk
#   bash tools/build_apk.sh --icons  # also regenerate icons/splash from assets/
#
# Requires: Node (Capacitor), JDK 17 on PATH (AGP 8.x), Android SDK.
set -euo pipefail

cd "$(dirname "$0")/.."

# Gradle honors JAVA_HOME over PATH; a stale JDK 8 there breaks AGP 8.x. Pin
# JAVA_HOME to whichever java is first on PATH (expected to be JDK 17).
JAVA_BIN="$(command -v java || true)"
if [ -n "$JAVA_BIN" ]; then
  JHOME="$(dirname "$(dirname "$(readlink -f "$JAVA_BIN" 2>/dev/null || echo "$JAVA_BIN")")")"
  if command -v cygpath >/dev/null 2>&1; then
    JHOME="$(cygpath -w "$JHOME")"
  fi
  export JAVA_HOME="$JHOME"
fi
echo ">> JAVA_HOME=${JAVA_HOME:-<unset>}"

echo ">> Assembling www/ ..."
python tools/build_www.py

if [ "${1:-}" = "--icons" ]; then
  echo ">> Regenerating icons/splash from assets/ ..."
  python tools/make_icon.py
  npx @capacitor/assets generate --android
fi

echo ">> Syncing web assets into android/ ..."
npx cap sync android

echo ">> Compiling APK ..."
( cd android && ./gradlew assembleDebug )

APK="android/app/build/outputs/apk/debug/awesome-interview.apk"
echo ""
if [ -f "$APK" ]; then
  echo ">> APK ready: $(pwd)/$APK"
else
  echo ">> Build finished but $APK not found — check Gradle output above." >&2
  exit 1
fi

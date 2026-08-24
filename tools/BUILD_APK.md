# Building the Android APK / 构建安卓 APK

The site is fully static, so the phone app is a WebView shell (Capacitor) that
bundles the site for **offline** use. No Python runs on the device — the Python
server is dev-only.

本站点是纯静态的,手机 app 是一个把站点打包进去、可**离线**使用的 WebView 壳
(Capacitor)。手机上不跑 Python —— `tools/run_service.py` 只用于本地开发。

## Prerequisites / 前置环境

- **Node.js 18+** (`node -v`)
- **JDK 17** (`java -version`)
- **Android Studio** (installs the Android SDK + platform tools)
- Python 3 (already required by this repo)

## Steps / 步骤

```bash
# 1. Install the Capacitor toolchain (once)
npm install

# 2. Initialize the native project (once). Values come from capacitor.config.json.
npx cap add android

# 3. Assemble www/ and sync it into the Android project.
#    Re-run this every time you change the site content.
npm run sync

# 4. Open in Android Studio, then Build > Build App Bundle(s)/APK(s) > Build APK(s)
npm run open:android
```

The generated debug APK lands in
`android/app/build/outputs/apk/debug/app-debug.apk` — copy it to a phone,
enable "install from unknown sources", and tap to install.

生成的调试版 APK 在 `android/app/build/outputs/apk/debug/app-debug.apk`,
拷到手机、允许「未知来源安装」后点击安装即可。

## Rebuild after editing the site / 改动站点后重新打包

```bash
npm run sync          # rebuilds www/ and syncs
# then re-run the Build APK step in Android Studio
```

## For a release (signed) build / 发布签名版

Debug APKs are only for personal testing. To share widely or publish to Play,
create a signing key and build a signed release in Android Studio
(`Build > Generate Signed Bundle / APK`). See the Capacitor + Android docs.

调试 APK 仅供个人测试。要广泛分发或上架 Play,需要在 Android Studio 里生成
签名密钥并构建签名的 release 版本。

## How it fits together / 原理

- `tools/build_www.py` assembles `www/` by copying `docs/` and every Markdown
  file referenced in `docs/md_files.json`, mirroring the repo-root layout, then
  writes `www/index.html` that redirects to `docs/index.html`.
- Capacitor serves `www/` over `https://localhost/` on device, so the reader's
  absolute-path `fetch('/knowledge/…')` calls work (a plain `file://` WebView
  would block them).
- `www/`, `node_modules/`, and `android/` are git-ignored — all regenerable.

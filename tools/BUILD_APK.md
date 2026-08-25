# Building the Android APK / 构建安卓 APK

The site is fully static, so the phone app is a WebView shell (Capacitor) that
bundles the site for **offline** use. No Python runs on the device — the Python
server is dev-only.

本站点是纯静态的,手机 app 是一个把站点打包进去、可**离线**使用的 WebView 壳
(Capacitor)。手机上不跑 Python —— `tools/run_service.py` 只用于本地开发。

## Download / 下载

Prebuilt APKs are attached to the [GitHub Releases](../../releases) page
(e.g. **v1.0.0** → `awesome-interview.apk`). Download it to your phone, allow
"install from unknown sources", and tap to install.

预构建好的 APK 挂在 [GitHub Releases](../../releases) 页面(例如 **v1.0.0** →
`awesome-interview.apk`)。下载到手机、允许「未知来源安装」后点击安装即可。

## Rebuild in one command / 一条命令重新打包

After changing any site content or native config:

改动任何站点内容或原生配置后:

```bash
npm run apk          # assemble www/ -> sync -> compile -> awesome-interview.apk
npm run apk:icons    # same, but also regenerate icons/splash from assets/ first
```

Output: `android/app/build/outputs/apk/debug/awesome-interview.apk`.
The script pins `JAVA_HOME` to the JDK on your PATH so Gradle uses JDK 17.

输出在 `android/app/build/outputs/apk/debug/awesome-interview.apk`。脚本会把
`JAVA_HOME` 固定到 PATH 上的 JDK,确保 Gradle 用 JDK 17。

## Prerequisites / 前置环境

- **Node.js 18+** (`node -v`)
- **JDK 17** (`java -version`)
- **Android Studio** (installs the Android SDK + platform tools)
- Python 3 (already required by this repo)

## First-time setup / 首次搭建

```bash
# 1. Install the Capacitor toolchain (once)
npm install

# 2. Initialize the native project (once). Values come from capacitor.config.json.
#    (Only needed if the android/ folder is missing — it is checked into git.)
npx cap add android

# 3. Build the APK (assemble www/ -> sync -> compile)
npm run apk
```

Prefer Android Studio? Open the project and use the Build menu instead of step 3:

想用 Android Studio?打开工程,用 Build 菜单代替第 3 步:

```bash
npm run open:android     # then: Build > Build App Bundle(s)/APK(s) > Build APK(s)
```

## For a release (signed) build / 发布签名版

Debug APKs are only for personal testing. To share widely or publish to Play,
create a signing key and build a signed release in Android Studio
(`Build > Generate Signed Bundle / APK`). See the Capacitor + Android docs.

调试 APK 仅供个人测试。要广泛分发或上架 Play,需要在 Android Studio 里生成
签名密钥并构建签名的 release 版本。

## App name, icon, APK filename / 应用名、图标、APK 文件名

- **App name** (label under the icon) is `Awesome Interview`, set in
  `android/app/src/main/res/values/strings.xml` (`app_name`). Capacitor seeds it
  from `appName` in `capacitor.config.json`.
- **Icon & splash** are generated from source images in `assets/` (an "Ai"
  lettermark on a blue→purple gradient). To change them, edit `tools/make_icon.py`
  (colors/letters) or drop in your own `assets/icon.png` (1024×1024), then:
  ```bash
  python tools/make_icon.py            # only if regenerating from the script
  npx @capacitor/assets generate --android
  ```
  This repopulates every density under `android/app/src/main/res/`.
- **APK filename** is `awesome-interview.apk`, set via the `applicationVariants`
  block in `android/app/build.gradle`.
- **Version** is `versionName` / `versionCode` in `android/app/build.gradle`
  (currently `1.0.0` / `1`). Bump both before cutting a new release.

> Command-line Gradle needs **JDK 17** on `JAVA_HOME` (AGP 8.x requirement).
> `npm run apk` handles this automatically. If you call `./gradlew` directly and
> it fails with a "Java 8 / could not resolve gradle:8.2.1" error, your
> `JAVA_HOME` points at an old JDK. Fix for the current shell:
> ```bash
> export JAVA_HOME="C:\\Program Files\\BellSoft\\LibericaJDK-17"
> ```
> Android Studio uses its own bundled JDK 17, so building inside it is unaffected.

## Publishing a release / 发布版本

```bash
npm run apk                                  # build the versioned APK
gh release create v1.0.0 \
  android/app/build/outputs/apk/debug/awesome-interview.apk \
  --title "Awesome Interview v1.0.0" --notes "Offline Android app."
```

Bump `versionName`/`versionCode` in `android/app/build.gradle` and the tag
(`v1.0.1`, …) for each subsequent release.

每次发布前,记得在 `android/app/build.gradle` 里递增 `versionName`/`versionCode`
并使用新的 tag(`v1.0.1` …)。

## How it fits together / 原理

- `tools/build_www.py` assembles `www/` by copying `docs/` and every Markdown
  file referenced in `docs/md_files.json`, mirroring the repo-root layout, then
  writes `www/index.html` that redirects to `docs/index.html`.
- Capacitor serves `www/` over `https://localhost/` on device, so the reader's
  absolute-path `fetch('/knowledge/…')` calls work (a plain `file://` WebView
  would block them).
- `www/` and `node_modules/` are git-ignored (regenerable). `android/` **is**
  tracked so icon and build customizations persist; its own `android/.gitignore`
  excludes build outputs, copied web assets, and local SDK config.

#!/usr/bin/env python3
"""Start a local web service for awesome-interview.

Usage:
    python tools/run_service.py
    python tools/run_service.py --port 8000
    python tools/run_service.py --no-build
"""
from __future__ import annotations

import argparse
import html
import json
import os
import platform
import socket
import socketserver
import subprocess
import sys
import time
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from subprocess import run

REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_SCRIPT = REPO_ROOT / "tools" / "build_index.py"
DOCS_DIR = REPO_ROOT / "docs"
INDEX_JSON = DOCS_DIR / "questions.json"
MD_INDEX = DOCS_DIR / "md_files.json"
SKIP_DIRS = {".git", "node_modules", ".github", "docs"}

MODULES = [
    {
        "title_en": "Markdown reader",
        "title_zh": "Markdown 阅读器",
        "description_en": "Browse the repo's markdown modules in a friendly HTML reader.",
        "description_zh": "在友好的 HTML 阅读器中浏览仓库的 Markdown 模块。",
        "path": "docs/reader.html",
    },
    {
        "title_en": "Random question picker",
        "title_zh": "随机题目选择器",
        "description_en": "Interactive browser page with filters for all indexed questions.",
        "description_zh": "带筛选器的交互式网页，可浏览所有已索引的题目。",
        "path": "docs/index.html",
    },
    {
        "title_en": "Knowledge bank",
        "title_zh": "知识库",
        "description_en": "Topic-organized Q&A in algorithms, frontend, backend, architecture, and DevOps.",
        "description_zh": "按主题组织的算法、前端、后端、架构与 DevOps 问答。",
        "path": "knowledge/",
    },
    {
        "title_en": "Real company interview questions",
        "title_zh": "真实公司面试题",
        "description_en": "Company-specific interview banks for Google, Meta, Amazon, Microsoft, Apple, ByteDance, Alibaba, Tencent.",
        "description_zh": "Google、Meta、Amazon、Microsoft、Apple、字节跳动、阿里、腾讯等公司专属面试题库。",
        "path": "interviews/companies/",
    },
    {
        "title_en": "Behavioral practice",
        "title_zh": "行为面试练习",
        "description_en": "STAR questions and leadership principles for behavioral interviews.",
        "description_zh": "用于行为面试的 STAR 题目与领导力准则。",
        "path": "behavioral/",
    },
    {
        "title_en": "Mock interviews",
        "title_zh": "模拟面试",
        "description_en": "Transcript-style mock-interview exercises for systems and behavioral prep.",
        "description_zh": "以对话脚本形式呈现的系统设计与行为面试模拟练习。",
        "path": "mock-interviews/",
    },
    {
        "title_en": "Roadmaps",
        "title_zh": "学习路线",
        "description_en": "Weekly study plans for backend, frontend, and fullstack interview prep.",
        "description_zh": "面向后端、前端与全栈面试准备的每周学习计划。",
        "path": "roadmap/",
    },
    {
        "title_en": "Practice tools",
        "title_zh": "练习工具",
        "description_en": "Timer, random question picker, streak tracker, and index builder scripts.",
        "description_zh": "计时器、随机抽题、连续打卡跟踪与索引构建脚本。",
        "path": "tools/",
    },
]


PAGE_STRINGS = {
    "en": {
        "page_title": "awesome-interview local service",
        "heading": "awesome-interview local service",
        "intro": "Browse the repo modules in your browser and launch the markdown reader and question picker from one command.",
        "command_label": "Command:",
        "open_label": "Open in browser:",
        "helpful_links": "Helpful links",
        "questions_link_suffix": "— generated question index",
        "readme_link_suffix": "— repo usage and module descriptions",
        "language_aria": "Select language",
        "theme_aria": "Select theme",
        "theme_light": "Light",
        "theme_dark": "Dark",
    },
    "zh": {
        "page_title": "awesome-interview 本地服务",
        "heading": "awesome-interview 本地服务",
        "intro": "在浏览器中浏览仓库模块，一条命令即可启动 Markdown 阅读器和题目选择器。",
        "command_label": "命令：",
        "open_label": "在浏览器中打开：",
        "helpful_links": "常用链接",
        "questions_link_suffix": "— 自动生成的题目索引",
        "readme_link_suffix": "— 仓库使用说明与模块介绍",
        "language_aria": "选择语言",
        "theme_aria": "选择主题",
        "theme_light": "浅色",
        "theme_dark": "深色",
    },
}


class RootHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".md": "text/markdown; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".html": "text/html; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            body = self.render_home_page().encode("utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def render_home_page(self) -> str:
        en = PAGE_STRINGS["en"]
        zh = PAGE_STRINGS["zh"]
        lines = [
            "<!DOCTYPE html>",
            "<html lang=\"en\">",
            "<head>",
            "  <meta charset=\"utf-8\" />",
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
            f"  <title data-i18n=\"page_title\">{html.escape(en['page_title'])}</title>",
            "  <style>",
            "    :root{color-scheme:light dark;--bg:#f7f9fb;--text:#111;--card-bg:#fff;--card-border:#dae1e7;--card-shadow:0 12px 30px rgba(15,23,42,.08);--muted:#475569;--accent:#2563eb;--note-bg:#eef2ff;--note-border:#c7d2fe;--select-bg:#fff;--select-border:#cbd5e1;--select-text:#0f172a}",
            "    :root[data-theme=\"dark\"]{color-scheme:dark;--bg:#0b1220;--text:#e2e8f0;--card-bg:#111a2e;--card-border:#1f2a44;--card-shadow:0 12px 30px rgba(0,0,0,.45);--muted:#94a3b8;--accent:#60a5fa;--note-bg:#172554;--note-border:#1e3a8a;--select-bg:#111a2e;--select-border:#334155;--select-text:#e2e8f0}",
            "    body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;background:var(--bg);color:var(--text)}",
            "    .page{max-width:960px;margin:0 auto;padding:32px}",
            "    h1{margin-top:0} .card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:20px;margin:16px 0;box-shadow:var(--card-shadow)}",
            "    .card a{color:var(--accent);text-decoration:none} .card a:hover{text-decoration:underline}",
            "    .grid{display:grid;gap:16px;margin-top:24px}",
            "    .grid a{display:block;color:inherit;text-decoration:none}",
            "    .meta{font-size:.95rem;color:var(--muted);margin-top:4px}",
            "    .note{margin-top:24px;padding:16px;background:var(--note-bg);border:1px solid var(--note-border);border-radius:10px}",
            "    .topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px}",
            "    .topbar-controls{display:flex;gap:8px;align-items:center}",
            "    .topbar select{padding:6px 10px;border-radius:8px;border:1px solid var(--select-border);background:var(--select-bg);color:var(--select-text);font-size:.9rem}",
            "    a{color:var(--accent)}",
            "  </style>",
            "</head>",
            "<body>",
            "  <div class=\"page\">",
            "    <div class=\"topbar\">",
            f"      <h1 data-i18n=\"heading\">{html.escape(en['heading'])}</h1>",
            "      <div class=\"topbar-controls\">",
            f"        <select id=\"language-select\" aria-label=\"{html.escape(en['language_aria'])}\">",
            "          <option value=\"en\">English</option>",
            "          <option value=\"zh\">简体中文</option>",
            "        </select>",
            f"        <select id=\"theme-select\" aria-label=\"{html.escape(en['theme_aria'])}\">",
            f"          <option value=\"light\">{html.escape(en['theme_light'])}</option>",
            f"          <option value=\"dark\">{html.escape(en['theme_dark'])}</option>",
            "        </select>",
            "      </div>",
            "    </div>",
            f"    <p data-i18n=\"intro\">{html.escape(en['intro'])}</p>",
            "    <div class=\"note\">",
            f"      <strong data-i18n=\"command_label\">{html.escape(en['command_label'])}</strong> <code>python tools/run_service.py</code><br />",
            f"      <strong data-i18n=\"open_label\">{html.escape(en['open_label'])}</strong> <a href=\"docs/reader.html\">docs/reader.html</a>",
            "    </div>",
            "    <div class=\"grid\">",
        ]
        for module in MODULES:
            title_en = html.escape(module["title_en"])
            title_zh = html.escape(module["title_zh"])
            desc_en = html.escape(module["description_en"])
            desc_zh = html.escape(module["description_zh"])
            path = html.escape(module["path"])
            lines.extend([
                f"      <a class=\"card\" href=\"{path}\">",
                f"        <strong data-i18n-en=\"{title_en}\" data-i18n-zh=\"{title_zh}\">{title_en}</strong>",
                f"        <div class=\"meta\" data-i18n-en=\"{desc_en}\" data-i18n-zh=\"{desc_zh}\">{desc_en}</div>",
                "      </a>",
            ])
        lines.extend([
            "    </div>",
            "    <section class=\"note\">",
            f"      <h2 data-i18n=\"helpful_links\">{html.escape(en['helpful_links'])}</h2>",
            "      <ul>",
            f"        <li><a href=\"docs/questions.json\">docs/questions.json</a> <span data-i18n=\"questions_link_suffix\">{html.escape(en['questions_link_suffix'])}</span></li>",
            f"        <li><a href=\"README.md\">README.md</a> <span data-i18n=\"readme_link_suffix\">{html.escape(en['readme_link_suffix'])}</span></li>",
            "      </ul>",
            "    </section>",
            "  </div>",
            "  <script>",
            f"    const I18N = {json.dumps(PAGE_STRINGS, ensure_ascii=False)};",
            "    const LANG_KEY = 'awesome-interview-language';",
            "    const THEME_KEY = 'awesome-interview-theme';",
            "    const VALID_THEMES = new Set(['light', 'dark']);",
            "    const langSelect = document.getElementById('language-select');",
            "    const themeSelect = document.getElementById('theme-select');",
            "    function detectTheme() {",
            "      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';",
            "    }",
            "    function applyTheme(theme) {",
            "      const next = VALID_THEMES.has(theme) ? theme : detectTheme();",
            "      document.documentElement.setAttribute('data-theme', next);",
            "      themeSelect.value = next;",
            "      return next;",
            "    }",
            "    function applyLang(lang) {",
            "      const dict = I18N[lang] || I18N.en;",
            "      document.documentElement.lang = lang;",
            "      document.querySelectorAll('[data-i18n]').forEach((el) => {",
            "        const key = el.getAttribute('data-i18n');",
            "        if (dict[key] != null) el.textContent = dict[key];",
            "      });",
            "      document.querySelectorAll('[data-i18n-en]').forEach((el) => {",
            "        const value = el.getAttribute(lang === 'zh' ? 'data-i18n-zh' : 'data-i18n-en');",
            "        if (value != null) el.textContent = value;",
            "      });",
            "      langSelect.setAttribute('aria-label', dict.language_aria || 'Select language');",
            "      langSelect.value = lang;",
            "      themeSelect.setAttribute('aria-label', dict.theme_aria || 'Select theme');",
            "      const opts = themeSelect.options;",
            "      for (let i = 0; i < opts.length; i++) {",
            "        if (opts[i].value === 'light') opts[i].textContent = dict.theme_light || 'Light';",
            "        if (opts[i].value === 'dark') opts[i].textContent = dict.theme_dark || 'Dark';",
            "      }",
            "    }",
            "    const savedLang = localStorage.getItem(LANG_KEY) || 'en';",
            "    applyLang(I18N[savedLang] ? savedLang : 'en');",
            "    applyTheme(localStorage.getItem(THEME_KEY) || detectTheme());",
            "    langSelect.addEventListener('change', (e) => {",
            "      const lang = I18N[e.target.value] ? e.target.value : 'en';",
            "      localStorage.setItem(LANG_KEY, lang);",
            "      applyLang(lang);",
            "    });",
            "    themeSelect.addEventListener('change', (e) => {",
            "      const next = applyTheme(e.target.value);",
            "      localStorage.setItem(THEME_KEY, next);",
            "    });",
            "  </script>",
            "</body>",
            "</html>",
        ])
        return "\n".join(lines)


def category_for(path: Path) -> str:
    parts = path.relative_to(REPO_ROOT).parts
    if len(parts) <= 1:
        return "overview"
    return parts[0]


def walk_markdown_files() -> list[Path]:
    out = []
    for path in REPO_ROOT.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.relative_to(REPO_ROOT).parts):
            continue
        if path.name.lower() == "readme.md":
            # Include only the root README.md; skip module-level READMEs.
            if len(path.relative_to(REPO_ROOT).parts) != 1:
                continue
        if path.name.lower().endswith(".zh.md"):
            continue
        out.append(path)
    return sorted(out)


def build_md_index() -> None:
    files = []
    for path in walk_markdown_files():
        rel = path.relative_to(REPO_ROOT).as_posix()
        zh_path = path.with_suffix(".zh.md")
        entry = {
            "category": category_for(path),
            "file": rel,
        }
        if zh_path.exists():
            entry["translations"] = {"zh": zh_path.relative_to(REPO_ROOT).as_posix()}
        files.append(entry)
    data = {
        "generated_by": "tools/run_service.py",
        "total": len(files),
        "categories": sorted({f["category"] for f in files}),
        "files": files,
    }
    MD_INDEX.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def ensure_index(no_build: bool) -> None:
    if not no_build:
        if not INDEX_JSON.exists():
            print("Generating docs/questions.json...")
            run([sys.executable, str(BUILD_SCRIPT)], check=True)
        if not MD_INDEX.exists():
            print("Generating docs/md_files.json...")
            build_md_index()


def find_pid_on_port(host: str, port: int) -> int | None:
    """Return the PID listening on host:port, or None if the port is free."""
    if platform.system() == "Windows":
        try:
            output = subprocess.check_output(
                ["netstat", "-ano"], text=True, stderr=subprocess.DEVNULL
            )
        except (subprocess.SubprocessError, FileNotFoundError):
            return None
        suffix = f":{port}"
        for line in output.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[0] == "TCP" and parts[-2] == "LISTENING":
                local = parts[1]
                if local.endswith(suffix) and (host == "0.0.0.0" or local.split(":")[0] in (host, "0.0.0.0", "[::]")):
                    try:
                        return int(parts[-1])
                    except ValueError:
                        continue
        return None
    try:
        output = subprocess.check_output(
            ["lsof", "-tiTCP:" + str(port), "-sTCP:LISTEN"],
            text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if output:
            return int(output.splitlines()[0])
    except (subprocess.SubprocessError, FileNotFoundError, ValueError):
        pass
    return None


def kill_pid(pid: int) -> bool:
    if platform.system() == "Windows":
        result = subprocess.run(
            ["taskkill", "/F", "/PID", str(pid)],
            capture_output=True, text=True,
        )
        return result.returncode == 0
    import signal as _signal
    try:
        os.kill(pid, _signal.SIGKILL)
        return True
    except (ProcessLookupError, PermissionError):
        return False


def ensure_port_free(host: str, port: int) -> None:
    """If the port is already held, kill the holder and wait for release."""
    pid = find_pid_on_port(host, port)
    if pid is None:
        return
    if pid == os.getpid():
        return
    print(f"Port {port} is in use by PID {pid}; killing existing process...")
    if not kill_pid(pid):
        print(f"  failed to kill PID {pid} — bind will likely fail")
        return
    for _ in range(30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind((host, port))
                print(f"  port {port} released")
                return
            except OSError:
                time.sleep(0.1)
    print(f"  port {port} still held after 3s — bind may fail")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start a local awesome-interview web service.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8099, help="Port to use (default: 8099)")
    parser.add_argument("--no-build", action="store_true", help="Do not regenerate docs/questions.json before starting")
    parser.add_argument("--open", action="store_true", help="Open the local service in the default browser")
    parser.add_argument("--no-kill", action="store_true", help="Do not kill an existing process holding the port; fail instead")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_index(args.no_build)
    os.chdir(str(REPO_ROOT))
    if not args.no_kill:
        ensure_port_free(args.host, args.port)
    address = (args.host, args.port)
    with socketserver.ThreadingTCPServer(address, RootHandler) as httpd:
        url = f"http://{args.host}:{args.port}/"
        print(f"Serving awesome-interview at {url}")
        if args.open:
            webbrowser.open(url + "docs/reader.html")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nService stopped.")


if __name__ == "__main__":
    main()

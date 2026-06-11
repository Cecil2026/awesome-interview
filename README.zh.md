# awesome-interview

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Daily question](https://img.shields.io/badge/daily-question-blue.svg)](.github/workflows/daily-question.yml)
[![Pages](https://img.shields.io/badge/random-picker-blueviolet.svg)](docs/index.html)

一个精心整理、带主观取舍的面试准备工作区。算法刷题（Python/TypeScript/Java 三语言实现）、框架深入、系统设计、AI/ML、行为面试 STAR 模板、真实公司题库、按周的学习路线，以及几个让你保持练习习惯的小脚本。所有页面支持 EN ↔ 中文 和 浅色/深色 主题切换。

> 如果今天只有十分钟，跑 `python tools/random_pick.py knowledge/`，看到什么题就答什么。

## 这里有什么

| 板块 | 内容 | 数量 |
|---|---|---|
| [knowledge/](knowledge/) | 按主题组织的问答库（算法 Py+TS+Java、AI/ML、前端、后端、架构、DevOps） | 600 |
| [interviews/](interviews/) | 公开来源的真实公司面试题（Google、Meta、亚马逊、微软、苹果、字节跳动、阿里、腾讯）——每家约 50 算法 + 12 非算法 | 500 |
| [mock-interviews/](mock-interviews/) | 完整对话脚本的模拟面试——系统设计和行为面试 | 5 |
| [roadmap/](roadmap/) | 前端、后端、全栈 8-10 周学习计划 + 一份通用面试周清单 | 4 |
| [behavioral/](behavioral/) | 跨 8 个主题的 50 道 STAR 题目 + Amazon 16 条领导力准则 | 66 |
| [tools/](tools/) | 计时器、随机抽题、连续打卡、索引构建、本地一键安装、翻译脚本（核心仅依赖 Python 标准库 + 一个 PowerShell） | 7 |
| [docs/](docs/) | 静态站点——随机抽题工具、带语言 tab 切换的 Markdown 阅读器、公司对比、以及简历 → 题目生成器 | 1 |

每道问答都用统一的 `### N. Question` 标题格式，方便抽题工具和每日题目工作流统一抓取任意文件。算法题附带 Python、TypeScript、Java 三种实现；阅读器把它们渲染为可切换的代码 tab。

## 快速开始

```bash
git clone https://github.com/<you>/awesome-interview.git
cd awesome-interview

# 随机抽一道题：
python tools/random_pick.py knowledge/

# 启动本地 Web 服务，浏览模块、阅读 Markdown、抽题：
python tools/run_service.py

# 在浏览器里打开友好的 Markdown 阅读器：
http://127.0.0.1:8099/docs/reader.html

# 用 25 分钟编码计时器开练：
python tools/timer.py 25 --coding

# 标记今天完成：
python tools/streak.py done
```

## 本地 Web 服务

`tools/run_service.py` 启动一个小型浏览器服务，让你不离开终端就能阅读、浏览、刷题。

```bash
python tools/run_service.py                # 默认运行在 http://127.0.0.1:8099
python tools/run_service.py --port 9000    # 自定义端口
python tools/run_service.py --open         # 用默认浏览器打开阅读器
python tools/run_service.py --no-build     # 跳过 questions.json / md_files.json 的重新生成
python tools/run_service.py --no-kill      # 端口被占时直接报错，不自动 kill 旧进程
```

默认行为：启动前自动检测同端口是否已有进程（通过 `netstat`/`lsof`），有就先 kill 再绑定——所以重复运行命令直接可用。加 `--no-kill` 关掉这个行为。

提供五个页面：

| URL | 页面 | 内容 |
|---|---|---|
| `/` | 模块首页 | 卡片网格，链接到仓库的每个板块 |
| `/docs/index.html` | 题目选择器 | 按类别 / 难度 / 主题筛选（带主题下拉框）、随机抽题、浏览全部题库并跟踪进度 |
| `/docs/reader.html` | Markdown 阅读器 | 在干净的 HTML 视图中浏览所有 `*.md` 文件，带侧边栏和目录 |
| `/docs/compare.html` | 公司对比 | 并排对比各公司的轮次、考察重点、语言、时长和难度分布 |
| `/docs/resume.html` | 简历 → 题目 | 粘贴一段简历项目经历，生成对应的技术 / 行为面试题（完全离线） |

所有页面共用统一的顶部导航（Picker · Reader · Compare · Resume），可随时在页面间跳转。

首次运行会生成 `docs/questions.json`（通过 `tools/build_index.py`）和 `docs/md_files.json`，让选择器和阅读器有内容可渲染。加 `--no-build` 跳过这一步。

### 语言切换（EN ↔ 中文）与 主题切换（Light / Dark）

所有页面右上角都有 EN / 简体中文 切换和 Light / Dark 主题切换。两个选择都存在 `localStorage`，跨页面和刷新都保留。首次访问的主题默认跟随操作系统偏好（`prefers-color-scheme`）。

### 一键安装为 Windows 后台服务（开机自启）

[`tools/install.ps1`](tools/install.ps1) 在本机 Windows 上注册一个 Scheduled Task，开机自动启动 `run_service.py`、崩了自动重启、加 Windows Firewall 入站规则。

```powershell
# 以管理员身份打开 PowerShell，然后：
cd C:\path\to\awesome-interview

.\tools\install.ps1                   # 默认端口 8099
.\tools\install.ps1 -Port 9000        # 自定义端口
.\tools\install.ps1 -Status           # 看任务/端口/防火墙状态
.\tools\install.ps1 -Restart          # 改了内容/代码后重启
.\tools\install.ps1 -Uninstall        # 停服 + 注销任务 + 删防火墙规则
```

装完后可访问 `http://localhost:8099/` 或 `http://<本机局域网 IP>:8099/`（脚本会自动检测并打印 LAN IP）。

### 翻译 Markdown 内容

阅读器支持"并行文件"约定来呈现翻译版：

- 原文：`interviews/companies/google.md`
- 中文：`interviews/companies/google.zh.md`

切到中文时，阅读器优先加载 `*.zh.md`；不存在则回退到原文并显示"暂无翻译"提示。`.zh.md` 文件不会在侧边栏单独出现，而是作为原文的变体。添加或删除翻译后重启 `run_service.py` 以刷新 `docs/md_files.json`。`interviews/_template.zh.md` 是一个可参考的样例。

如需通过 Claude API 批量生成翻译，使用 [`tools/translate_to_zh.py`](tools/translate_to_zh.py)（需要 `pip install anthropic` 并设置 `ANTHROPIC_API_KEY`）。先用 `--dry-run` 预览将要翻译什么。完整用法见 [tools/README.md](tools/README.md#generating-translations-in-bulk)。

## 这个仓库怎么用

**每日** — 让 [每日题目工作流](.github/workflows/daily-question.yml) 每天早上自动开一个 GitHub issue，在 issue 里答它。

**每周** — 选一条路线（例如 [backend-engineer.md](roadmap/backend-engineer.md)），按周打勾。周末用一段 [mock-interviews/](mock-interviews/) 脚本给自己来一场模拟。

**针对性准备** — 在面某家具体公司？打开 [interviews/companies/](interviews/companies/) 下对应文件。里面说明面试形式、考察重点，每家公司 20+ 道真题。

**冲刺** — 打开 [随机抽题](docs/index.html)（通过 GitHub Pages 从 `docs/` 部署），按难度和主题筛选，直到计时器响。针对某公司？在 [对比视图](docs/compare.html) 里并排看各公司的面试形式。手边有简历？把项目经历粘贴到 [简历 → 题目生成器](docs/resume.html)，生成对应题目。

## 题目格式

每道题都遵循统一结构，方便解析、抽取和索引：

```
### N. <题目标题>

**Difficulty:** Easy | Medium | Hard   （可选）
**Topics:** comma, separated, tags    （可选）

**Question:** ...

**Answer:** 简洁的文字（3-10 行）。

**Key points:**
- 要点
- 要点
```

算法题额外包含 `**Python:**`、`**TypeScript:**` 和 `**Java:**` 三种实现。阅读器会自动把连续的 `**Lang:**` + 代码块识别为可切换的 tab，所选语言记到 `localStorage`、跨题目沿用。公司面试题额外包含 `**Position:**` 和 `**Years:**` 字段。

## 贡献

随时添加或修正任何内容。每个文件里的编号只是参考，不是契约——可以自由重新编号。

1. 添加或修改一条 `### N. Question` 条目。
2. 跑 `python tools/build_index.py` 刷新 `docs/questions.json`。
3. 同时提交两个文件。CI 会在你忘记刷新索引时拦截 PR。

## 许可证

Copyright (C) 2026 Eric Jin。

本项目采用 **GNU Affero 通用公共许可证 v3.0（AGPL-3.0）** — 完整条款见
[LICENSE](LICENSE)。简而言之：你可以使用、研究、修改和再分发，但衍生作品
（包括以网络服务形式运行的版本）必须以相同许可证开源，并向用户提供源码。

贡献以同一许可证接受；合并权限仅保留给维护者
（见 [CONTRIBUTING.md](CONTRIBUTING.md#project-governance)）。

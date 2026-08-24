# 安全策略

## 受支持的版本

本项目是一个个人面试备考工作区（静态站点 + Python 标准库脚本）。仅维护最新的
`main` 分支；不会为旧状态提供安全修复的回移（backport）。

## 报告漏洞

请**不要**为安全问题公开提交 issue。

请改为通过 GitHub 的
[私密漏洞报告](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
私下报告（在仓库页面选择 **Security → Report a vulnerability**）。

报告时，请包含：

- 问题描述及其影响。
- 复现步骤（如可能，附一个最小可行的概念验证）。
- 受影响的文件或组件。

### 你可以期待什么

- 报告被分类处理后会尽快得到确认回复。
- 一次评估；若确认属实，会在 `main` 上修复。
- 只有在修复可用之后，才会进行公开披露（例如发布安全公告）。

## 范围说明

- 本地 Web 服务（`tools/run_service.py`）仅面向**本地 / 受信任局域网使用**。
  将其暴露到公网属于范围之外，且不推荐这样做。
- 站点完全静态，不附带任何第三方运行时依赖；如发现被无意引入的外部脚本或
  网络调用，请报告。

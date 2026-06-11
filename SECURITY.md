# Security Policy

## Supported versions

This project is a personal interview-prep workspace (static site + Python
stdlib scripts). Only the latest `main` branch is maintained; there are no
backported security fixes for older states.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, report privately via GitHub's
[private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
( **Security → Report a vulnerability** on the repository page ).

When reporting, please include:

- A description of the issue and its impact.
- Steps to reproduce (a minimal proof of concept if possible).
- Affected file(s) or component(s).

### What to expect

- An acknowledgement as soon as the report is triaged.
- An assessment and, if confirmed, a fix on `main`.
- Public disclosure (e.g. a security advisory) only after a fix is available.

## Scope notes

- The local web service (`tools/run_service.py`) is intended for **local /
  trusted-LAN use**. Exposing it to the public internet is out of scope and
  not recommended.
- The site is fully static and ships no third-party runtime dependencies;
  report any inadvertently introduced external script or network call.

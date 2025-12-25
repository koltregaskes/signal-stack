# Agent instructions

Scope: entire repository.

- Explain changes in plain UK English and keep jargon minimal. If jargon appears, include a one-line definition.
- Keep edits small and reviewable; avoid large rewrites unless explicitly requested.
- Maintain all required docs: README.md (with How to Get Started), ARCHITECTURE.md, SETUP.md, USAGE.md, TROUBLESHOOTING.md, PLAN.md, CHANGELOG.md, COSTS.md, ACCESSIBILITY.md, AGENTS.md, and llms.txt. Update them when changes affect their topics.
- Treat security seriously: never commit secrets; use environment variables and a `.env.example` when needed.
- Aim for WCAG 2.2 AA accessibility with semantic HTML, visible focus, labelled inputs, and accessible validation messages.
- Prefer minimal dependencies and simple commands that also work on Windows (mention `cd` before project commands).
- When tests or checks exist, run them and record the exact commands and results.

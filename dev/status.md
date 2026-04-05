# Project Status

> **IMPORTANT**: This file is loaded at the start of every Claude Code session.
> Keep it accurate. Update it before ending any session.
> This is the single source of truth for project state.

---

## Business Goal

Personal Claude Code infrastructure for ML engineering projects — reusable skills, hooks, agents, and templates that enforce the hexagonal architecture + TDD workflow across all Python/FastAPI projects.

---

## Current Phase

**Active**: Phase 9 — Growth & Polish (2026-04-06)

v2.0.0 code complete, 29 repos deployed, issue #2 resolved. Focus: npm publish, GitHub star growth, awesome-list submissions.

---

## Current State (2026-04-06)

- **v2.0.0 code complete**, npm publish only by explicit user command
- **541 tests** (424 Jest + 60 benchmark + 57 Python), 0 failed
- **29 repos deployed** at `309efdd`, all up to date
- **Issue #2 resolved** — README.ru.md fully rewritten to v2.0.0 parity, language switcher added
- **4 GitHub stars**, 0 forks, 18 topics

### Versions:
- **v1.5.0** — published on npm
- **v1.6.0** — code complete (delayed release): dynamic budget, windows-developer, hub/task-hub profiles, QA workflow, skill registry
- **v2.0.0** — code complete (delayed release): deps.yaml + CLI, INFRA.yaml + /infra, agent extensions, PITFALLS.md

### Git state:
Main @ `309efdd`, 5 commits ahead of npm v1.5.0:
- `0713282` feat: v1.6.0
- `a77fdb3` feat: v2.0.0
- `de7a035` fix: v2.0.0 review
- `8287f45` fix: update flow deploys agent-extensions + PITFALLS
- `309efdd` fix: deploy.py agent-extensions + PITFALLS

---

## Star Growth Strategy

### Awesome-листы (приоритет 1)

| Repo | Stars | Method | Status |
|---|---|---|---|
| `hesreallyhim/awesome-claude-code` | 36.7k | Issue form (web UI only) | TODO |
| `anthropics/claude-plugins-official` | 16k | PR to external_plugins/ | TODO |
| `VoltAgent/awesome-claude-code-subagents` | 16.3k | PR | TODO |
| `rohitg00/awesome-claude-code-toolkit` | 1.1k | PR | **MERGED** |
| `ccplugins/awesome-claude-code-plugins` | 667 | PR | TODO |
| `rahulvrane/awesome-claude-agents` | 305 | PR | TODO |
| `cassler/awesome-claude-code-setup` | 261 | PR | TODO |

### Контент (приоритет 2)

- [ ] Reddit: r/ClaudeCode — how-to формат, не промо
- [ ] Dev.to статья: "Claude Code beyond CLAUDE.md"
- [ ] Show HN пост (после контента)

### Existing PRs

| Repo | PR | Status |
|---|---|---|
| Prat011/awesome-llm-skills | #56 | open, 16+ days — ping |
| ComposioHQ/awesome-claude-plugins | #66 | open — ping |
| thedaviddias/llms-txt-hub | #787 | open |
| jamesmurdza/awesome-ai-devtools | #326 | open — ping |

---

## Backlog

- [ ] **npm publish v2.0.0** — ONLY by explicit user command: `git tag v2.0.0 && git push origin v2.0.0`
- [ ] Submit to `hesreallyhim/awesome-claude-code` via web UI issue form
- [ ] PR to `anthropics/claude-plugins-official` external_plugins/
- [ ] PRs to 4 more awesome-lists (ccplugins, rahulvrane, cassler, VoltAgent)
- [ ] Ping 3 stale PRs (awesome-llm-skills, awesome-claude-plugins, awesome-ai-devtools)
- [ ] Create profile templates for hub/task-hub (`templates/profiles/hub/`, `templates/profiles/task-hub/`)
- [ ] Reddit post in r/ClaudeCode
- [ ] Dev.to article
- [ ] phs_calorie_app: history rewrite to remove .claude/ from git (commit 359761f)
- [ ] coris-landing-site: custom astro-frontend skill

---

## Known Issues

### VHS не работает на Windows
VHS зависает из-за oh-my-posh в .bashrc. Решение: рендерить через `ssh yc-ctrl`.

### Python infra tests UnicodeDecodeError на Windows
`read_text()` использует cp1251 по умолчанию. Фикс: `encoding="utf-8"` везде.

---

## Architecture Decisions

| Decision | Choice | Date |
|---|---|---|
| Hook architecture | Pure JS modules (no npm deps) for portability | 2026-03-02 |
| Skill compression | Header extraction + first 50 lines | 2026-03-02 |
| Model routing | Explicit via multimodal-router, no auto-escalation | 2026-03-02 |
| Test strategy | Jest for hooks, Python unittest for infra contracts | 2026-03-02 |
| Priority sort in matchSkills | always_load first, then ascending priority | 2026-03-23 |
| Shared YAML parser | lib/yaml-parser.js — no hook→lib imports | 2026-04-06 |
| Agent extensions | Concatenation at deploy time, idempotency guard | 2026-04-06 |

---

## Open PRs (публичные репо)

| Repo | PR | Status | Notes |
|---|---|---|---|
| rohitg00/awesome-claude-code-toolkit | #79 | **MERGED** 2026-03-30 | First accepted |
| filipecalegario/awesome-vibe-coding | #100 | **CLOSED** 2026-03-29 | "Need community signals" |
| Prat011/awesome-llm-skills | #56 | open | Ping needed |
| ComposioHQ/awesome-claude-plugins | #66 | open | Ping needed |
| thedaviddias/llms-txt-hub | #787 | open | Vercel auth pending |
| jamesmurdza/awesome-ai-devtools | #326 | open | Ping needed |

---

*Last updated: 2026-04-06*

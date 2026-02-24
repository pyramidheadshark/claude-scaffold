# Project Status

> **IMPORTANT**: This file is loaded at the start of every Claude Code session.
> Keep it accurate. Update it before ending any session.
> This is the single source of truth for project state.

---

## Business Goal

Personal Claude Code infrastructure for ML engineering projects — reusable skills, hooks, agents, and templates that enforce the hexagonal architecture + TDD workflow across all Python/FastAPI projects.

---

## Current Phase

- [x] Phase 0: Intake & Requirements
- [x] Phase 1: Design Document
- [x] Phase 2: Environment Setup
- [x] Phase 3: Development Loop
- [x] Phase 4: API Layer & Testing
- [ ] Phase 5: CI/CD
- [ ] Phase 6: Deploy

**Active phase**: Phase 5 — CI/CD (add GitHub Actions for the infra repo itself)

---

## Backlog

Tasks in priority order. Check off when done.

- [ ] Add `.github/workflows/` for self-CI (lint JS, run Jest + Python tests)
- [ ] Windows path compatibility in `skill-activation-prompt.js` (`/dev/stdin`)
- [ ] Normalize `python3` → `python` in `package.json` for Windows

**Completed (most recent first):**
- [x] Convert DOCX docs to Markdown, remove binary files — 2026-03-03
- [x] Fix `loadStatusContent` to accept `path` as parameter (rm `require("path")` hardcode) — 2026-03-03
- [x] Create `dev/status.md` and `.gitignore` — 2026-03-03
- [x] Add full test suite (24 Jest + 27 Python infra tests) — v0.5.0 — 2026-03-02
- [x] Add `rag-vector-db` skill, `init-design-doc` command, ADRs — v0.4.0 — 2026-03-02
- [x] Add `nlp-slm-patterns` and `predictive-analytics` skills — v0.3.0 — 2026-03-02
- [x] Add 6 ML domain skills (ml-data-handling, htmx-frontend, langgraph-patterns, etc.) — v0.2.0 — 2026-03-02
- [x] Add 4 initial skills, hooks, agents, commands — v0.1.0 — 2026-03-02

---

## Known Issues and Solutions

### Windows `python3` not found

**Problem**: `npm run test:infra` fails with "`python3` is not recognized" on Windows
**Root cause**: Windows uses `python`, not `python3`
**Solution**: Run `python tests/infra/test_infra.py` directly, or update `package.json` to use `python` for Windows
**Date**: 2026-03-03

### Python infra tests UnicodeDecodeError on Windows

**Problem**: `read_text()` uses system default encoding (cp1251) instead of UTF-8
**Root cause**: UTF-8 files with non-ASCII chars trigger cp1251 decode error
**Solution**: Add `encoding="utf-8"` to all `read_text()` and `open()` calls in `test_infra.py`
**Date**: 2026-03-03

### loadStatusContent returns null on Windows

**Problem**: Jest tests for `loadStatusContent` fail — function returns null instead of file content
**Root cause**: `require("path").join()` on Windows produces backslash paths; mock fs uses forward slashes
**Solution**: Remove `require("path")` hardcode; accept `path` as parameter and pass it from `buildInjections`
**Date**: 2026-03-03

---

## Architecture Decisions

| Decision | Choice | Date |
|---|---|---|
| Hook architecture | Pure JS modules (no npm deps) for portability | 2026-03-02 |
| Skill compression | LLMLingua-2 strategy — header extraction + first 50 lines | 2026-03-02 |
| Model routing | Explicit via `multimodal-router` skill, no auto-escalation | 2026-03-02 |
| Test strategy | Jest for hook logic, Python unittest for infra contracts | 2026-03-02 |

---

## Next Session Plan

1. Add `.github/workflows/` (lint + test CI for the infra repo itself)
2. Fix `skill-activation-prompt.js` Windows path (`/dev/stdin` → cross-platform stdin read)
3. Update `package.json` test:infra to use `python` on Windows

---

## Files to Know

| File | Purpose |
|---|---|
| `.claude/hooks/skill-activation-logic.js` | Core hook logic (testable, no Node deps) |
| `.claude/hooks/skill-activation-prompt.js` | Entry point for `UserPromptSubmit` hook |
| `.claude/skills/skill-rules.json` | Trigger rules for all 13 skills |
| `tests/hook/skill-activation.test.js` | Jest unit tests for hook logic |
| `tests/infra/test_infra.py` | Python infra contract tests |
| `docs/ARCHITECTURE.md` | ADRs and design decisions |
| `docs/CHANGELOG.md` | Version history |

---

*Last updated: 2026-03-03 by Claude Code*

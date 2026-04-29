# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-29
**Branch:** v2-rework

## OVERVIEW
CLI scaffolding tool (`opencode-scaffold`) that bootstraps OpenCode project configs — agents, skills, memory-bank, plugins, pre-commit hooks. TypeScript ESM, Commander CLI, Ink TUI.

## STRUCTURE
```
claude-scaffold/
├── src/             # V2 rewrite — 5 commands + TUI
│   ├── commands/    # init, ast, skills, telemetry
│   ├── tui/         # Ink/React Control Tower dashboard
│   └── templates/   # Embedded configs (pre-commit, opencode-project)
├── tests/e2e/       # Vitest + execa integration tests
├── scripts/         # generate_ast.py (tree-sitter indexer)
└── .opencode/       # Project-level OpenCode config (NOT a template)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a CLI command | `src/commands/` | Export from `src/index.ts`, follow commander pattern |
| Modify init scaffolding | `src/commands/init.ts` | Generates agents, memory-bank, plugins, pre-commit |
| AST indexing | `src/commands/ast.ts` + `scripts/generate_ast.py` | tree-sitter via Python subprocess |
| TUI dashboard | `src/tui/index.tsx` | Ink/React, polls `.opencode-global-state/` |
| Skill sync | `src/commands/skills.ts` | Copies from TechCon Hub based on detected stack |
| Telemetry | `src/commands/telemetry.ts` | Express + SQLite OTLP server |
| Per-project template | `src/templates/opencode-project.jsonc` | Canonical config for deploying to TechCon repos |
| Project config | `.opencode/` | Current session's config, NOT deployed to target repos |

## CONVENTIONS
- ESM-only: `import X from './Y.js'` (explicit `.js` extensions)
- No comments in code unless explicitly asked
- No Co-Authored-By in commits
- tsup build → single ESM bundle with shebang
- Tests: vitest + execa in `tests/e2e/`
- Pre-commit: ruff + mypy + eslint + test gate

## ANTI-PATTERNS (THIS PROJECT)
- NEVER use `require()` or CommonJS — ESM only
- NEVER add `as any`, `@ts-ignore`, `@ts-expect-error`
- NEVER delete failing tests
- NEVER mock data to make tests pass
- NEVER refactor while fixing a bug
- NEVER leave code in broken state after failures

## COMMANDS
```bash
npm run build        # tsup → dist/index.js
npm test             # vitest run tests/e2e/
npm run lint         # eslint src/
npx tsc --noEmit     # typecheck
```

## NOTES
- Global config: `~/.config/opencode/opencode.json` (GLM-5.1 orchestrator, Kimi K2.6 deep-worker, DeepSeek V4 Flash subagents)
- OmO agent overrides: `~/.config/opencode/oh-my-opencode.jsonc` (explore, librarian, oracle, metis, momus → OpenRouter models, auto_update: false)
- DCP compaction: `~/.config/opencode/dcp.jsonc` (75%/50% thresholds for GLM-5.1, 80%/55% for Kimi K2.6, 70%/45% for DeepSeek V4 Flash)
- 17 plugins, 2 global MCP (jupyter, sqlite) + 5 lazy-loaded via skills, LSP Python (pyright)
- opencode-tool-search: BM25 lazy tool loading, 88% token savings
- opencode-lazy-loader: MCP servers in skill frontmatter, auto-stop after 5min idle
- `legacy_v1/` archived on branch `archive/legacy-v1` — do not modify
- V1 features migration map: see `archive/legacy-v1` branch
- BACKLOG: When Z_AI_API_KEY and OPENAI_API_KEY arrive → restore z.ai + openai providers, move OpenRouter to fallback

## CRITICAL PATCH (oh-my-openagent v3.17.6)
- **Bug**: Background agents (explore, librarian, oracle, multimodal-looker) use hardcoded fallback chains that try openai/gpt-5.4-nano → "Model not found"
- **Root cause**: oh-my-openagent's `resolveModelAndFallbackChain()` uses hardcoded `AGENT_MODEL_REQUIREMENTS` fallback chains. The `agents` config in oh-my-opencode.jsonc only affects `fallback-bootstrap-model` hook, which does NOT fire for background tasks launched via opencode's native `task()` tool
- **Fix**: Patched `~/.cache/opencode/packages/oh-my-opencode@latest/node_modules/oh-my-opencode/dist/index.js` — replaced fallback chains for explore/librarian/multimodal-looker → openrouter/deepseek-v4-flash, oracle → openrouter/kimi-k2.6
- **Also**: Cleaned `~/.cache/oh-my-opencode/connected-providers.json` — removed openai/opencode from connected providers
- **Also**: Set `auto_update: false` in oh-my-opencode.jsonc to prevent patch overwrite
- **Caveat**: Patch will be lost if oh-my-openagent is manually updated. Must re-apply after update.

## INFRASTRUCTURE
- WSL2 mirrored networking (`.wslconfig`): localhost:4096 accessible from Windows
- opencode-web: systemd user service `opencode-web.service` (auto-start via linger)
- Tuna tunnel: systemd user service `tuna-tunnel.service` → https://pyramidheadshark.ru.tuna.am (basic-auth: pyramidheadshark/GjgaGfha2676)
- Tuna CLI: `~/.local/bin/tuna` v0.33.0 (installed from releases.tuna.am)
- omo-pulse: Real-time dashboard for monitoring oh-my-opencode sessions (GitHub: EZotoff/omo-pulse), reads from SQLite, NOT yet installed/configured
- opencode tower: Ink/React TUI in `src/tui/index.tsx`, command wired as `opencode tower`, needs testing

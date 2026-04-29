# opencode-scaffold

> CLI tool that bootstraps a powerful agentic environment for [OpenCode](https://opencode.ai).

One command sets up your project with agents, memory-bank, skills, MCP servers, and pre-commit hooks — everything needed for an AI-augmented development workflow.

## What it does

Running `opencode-scaffold init` in a project directory generates:

| Component | Path | Description |
|-----------|------|-------------|
| Agent configs | `.opencode/agents/` | Architect (primary), QA Engineer, Security Sentinel, Performance Analyst |
| Memory bank | `.opencode/memory-bank/` | Persistent context — project brief, progress, active context |
| Entry prompt | `.opencode/OPENCODE.md` | System prompt with orchestration and memory rules |
| Per-project config | `.opencode/config.json` | Model, plugins, permissions |
| Pre-commit hooks | `.pre-commit-config.yaml` | ruff, mypy, eslint, test gate |
| Skills | `.opencode/skills/` | Auto-detected from tech stack (Python → testing patterns, FastAPI → API patterns) |
| Scaffold manifest | `.opencode-scaffold.json` | Tracks init options and version |

## Commands

```
opencode-scaffold init          # Interactive scaffolding (-y for defaults)
opencode-scaffold sync-skills   # Sync skills based on detected tech stack
opencode-scaffold ast           # Generate AST map for LLM RAG indexing
opencode-scaffold telemetry     # Start OTLP → SQLite telemetry server
```

## Quick start

```bash
# Run directly (no install needed)
npx opencode-scaffold init -y

# Or install globally
npm install -g opencode-scaffold
opencode-scaffold init
```

## Generated agents

| Agent | Role | Model | Mode |
|-------|------|-------|------|
| Architect | Primary orchestrator, memory-bank maintainer | `zai-coding-plan/glm-5.1` | primary |
| QA Engineer | E2E testing, defect reports | `zai-coding-plan/glm-4.7` | subagent |
| Security Sentinel | Vulnerability scanning, injection risks | `zai-coding-plan/glm-4.7` | subagent |
| Performance Analyst | Big-O analysis, memory leaks, N+1 queries | `zai-coding-plan/glm-4.7` | subagent |

Models can be changed per-project via `.opencode/config.json`.

## Template

`src/templates/opencode-project.jsonc` contains the canonical OpenCode config with:
- Provider setup (Z.AI Coding Plan, OpenRouter fallback)
- Plugin stack (oh-my-openagent, opencode-dcp, opencode-tool-search, and 12 more)
- MCP servers (web search, web reader, GitHub repo knowledge, SQLite)
- Agent definitions for the sub-agent orchestration layer

## Development

```bash
npm run build      # tsup → dist/index.js
npm test           # vitest run tests/e2e/
npx tsc --noEmit   # typecheck
```

## Project structure

```
src/
├── commands/          # CLI command handlers
│   ├── init.ts        #   Scaffold .opencode/ directories + agents + memory-bank
│   ├── ast.ts         #   Tree-sitter AST indexing via Python subprocess
│   ├── skills.ts      #   Tech stack detection + skill copying
│   └── telemetry.ts   #   Express OTLP receiver → SQLite
├── templates/         # Embedded config templates
│   └── opencode-project.jsonc
└── index.ts           # Commander CLI entry point
```

## Dependencies

This project builds on the work of many excellent open-source libraries:

| Library | Purpose | License |
|---------|---------|---------|
| [commander](https://github.com/tj/commander.js) | CLI framework | MIT |
| [inquirer](https://github.com/SBoudrias/Inquirer.js) | Interactive prompts | MIT |
| [chalk](https://github.com/chalk/chalk) | Terminal colors | MIT |
| [express](https://github.com/expressjs/express) | Telemetry HTTP server | MIT |
| [sqlite3](https://github.com/TryGhost/node-sqlite3) | Telemetry storage | BSD-3-Clause |
| [tsup](https://github.com/egoist/tsup) | Build tool (esbuild wrapper) | MIT |
| [typescript](https://github.com/microsoft/TypeScript) | Type system | Apache-2.0 |
| [vitest](https://github.com/vitest-dev/vitest) | Test framework | MIT |
| [execa](https://github.com/sindresorhus/execa) | Process execution in tests | MIT |

Plugins configured by the template (installed separately in target projects):

| Plugin | Purpose |
|--------|---------|
| [oh-my-openagent](https://github.com/nicepkg/oh-my-opencode) | Sub-agent orchestration, model routing |
| [@tarquinen/opencode-dcp](https://github.com/Tarquinen/opencode-dcp) | Dynamic context pruning |
| [opencode-tool-search](https://github.com/nicepkg/opencode-tool-search) | BM25 lazy tool loading |
| [opencode-skillful](https://github.com/nicepkg/opencode-skillful) | Skill system |
| [opencode-mem](https://github.com/nicepkg/opencode-mem) | Memory management |
| [opencode-vibeguard](https://github.com/nicepkg/opencode-vibeguard) | Output quality guard |

## Publishing to npm

```bash
npm run build
npm version patch        # or minor, major
npm publish --access public
```

The package is configured as an ESM CLI tool with `bin` entry and `files` whitelist. Users can run it via `npx opencode-scaffold init -y` without global install.

## License

MIT

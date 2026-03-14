# /new-project

Initializes a new project from the ml-claude-infra template.

## What This Command Does

1. Creates the full project directory structure
2. Copies and customizes template files (`pyproject.toml`, `Dockerfile`, etc.)
3. Initializes `design-doc.md` and `dev/status.md`
4. Sets up `.claude/` directory with skills and hooks
5. Runs `uv init` and `git init`

## Instructions for Claude Code

Ask the developer for:
- Project name (will be used as directory name and Python package name)
- Brief description (one sentence)
- Infrastructure tier: Docker Compose / K8s-ready / GPU
- Does it need a frontend? (HTMX or none)
- Does it need an agent pipeline? (LangGraph or none)

Then execute in order:

### 1. Create structure

```bash
mkdir -p {project-name}/src/{project_name}/{api/routers,api/pages,core,services,adapters/{llm,storage,db},models}
mkdir -p {project-name}/tests/{unit/{core,services},integration,features/steps}
mkdir -p {project-name}/{dev/active,infra/{packer,terraform},notebooks,.github/workflows,.claude/{skills,hooks,agents,commands}}
touch {project-name}/src/{project_name}/__init__.py
touch {project-name}/tests/__init__.py
touch {project-name}/data/.gitkeep
touch {project-name}/models/.gitkeep
```

### 2. Copy and customize templates

Copy from `ml-claude-infra/templates/`:
- `design-doc.md` → project root (replace `{Project Name}` with actual name)
- `status.md` → `dev/status.md` (initialize Phase 0 as active)
- `Dockerfile` → project root (replace `project_name` placeholder)
- `docker-compose.yml` → project root
- `github/workflows/*.yml` → `.github/workflows/`

### 3. Initialize Python project

```bash
cd {project-name}
uv init --name {project-name} --python 3.12
uv add fastapi "uvicorn[standard]" pydantic pydantic-settings httpx
uv add --dev ruff mypy pytest pytest-asyncio pytest-bdd pytest-cov
```

### 4. Copy .claude infrastructure

Copy `.claude/` from `ml-claude-infra` into the project. This is the full skills/hooks/agents directory.

### 5. Initialize git

```bash
git init
git add .
git commit -m "chore: initialize project from ml-claude-infra template"
```

### 6. Activate design doc phase

Invoke `design-doc-architect` agent to begin intake.

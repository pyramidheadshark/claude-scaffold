#!/usr/bin/env bash

set -euo pipefail

echo "Running Python quality checks before session end..."

if command -v uv &>/dev/null; then
  RUNNER="uv run"
else
  RUNNER=""
fi

RUFF_PASS=true
MYPY_PASS=true

if [ -f "pyproject.toml" ]; then
  echo ">> ruff check..."
  if ! $RUNNER ruff check . --quiet 2>&1; then
    echo "RUFF: issues found. Run 'uv run ruff check . --fix' to auto-fix."
    RUFF_PASS=false
  else
    echo "RUFF: OK"
  fi

  echo ">> mypy check..."
  if [ -d "src" ]; then
    if ! $RUNNER mypy src/ --quiet 2>&1; then
      echo "MYPY: type errors found."
      MYPY_PASS=false
    else
      echo "MYPY: OK"
    fi
  fi
fi

if [ "$RUFF_PASS" = false ] || [ "$MYPY_PASS" = false ]; then
  echo ""
  echo "Quality checks failed. Consider fixing before committing."
  echo "This does not block the session — it is a reminder only."
fi

exit 0

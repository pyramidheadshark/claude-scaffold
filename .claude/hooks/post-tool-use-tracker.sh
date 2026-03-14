#!/usr/bin/env bash

INPUT=$(cat 2>/dev/null || echo "{}")

export PYTHONUTF8=1
TOOL_NAME=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
SESSION_ID=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_id','unknown'))" 2>/dev/null || echo "unknown")
IS_ERROR=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('tool_response',{}).get('is_error',False)).lower())" 2>/dev/null || echo "false")
REPO=$(basename "$PWD")

LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"timestamp\":\"$TIMESTAMP\",\"session_id\":\"$SESSION_ID\",\"repo\":\"$REPO\",\"tool\":\"$TOOL_NAME\",\"is_error\":$IS_ERROR}" >> "$LOG_DIR/tool-usage.jsonl"

exit 0

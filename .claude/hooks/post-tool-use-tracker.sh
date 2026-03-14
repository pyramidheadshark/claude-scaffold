#!/usr/bin/env bash

INPUT=$(cat /dev/stdin 2>/dev/null || echo "{}")

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name','unknown'))" 2>/dev/null || echo "unknown")

LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"timestamp\":\"$TIMESTAMP\",\"tool\":\"$TOOL_NAME\"}" >> "$LOG_DIR/tool-usage.jsonl"

exit 0

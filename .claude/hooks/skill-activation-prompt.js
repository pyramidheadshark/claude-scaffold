#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadSkillRules, buildInjections, buildOutput } = require("./skill-activation-logic");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const prompt = input.prompt || "";
const sessionId = input.session_id || "default";
const cwd = process.cwd();

const rulesPath = path.join(cwd, ".claude/skills/skill-rules.json");
const rules = loadSkillRules(fs, rulesPath);

if (!rules) {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

const changedFiles = (() => {
  try {
    const raw = execSync("git status --porcelain", { cwd, encoding: "utf-8" }).trim();
    if (!raw) return [];
    return raw.split("\n").filter(Boolean).map((l) => l.slice(3).trim());
  } catch {
    return [];
  }
})();

const { injections, matchedSkills } = buildInjections(fs, path, cwd, prompt, changedFiles, rules);

const logsDir = path.join(cwd, ".claude/logs");
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    session_id: sessionId,
    skills: matchedSkills,
    status_injected: injections.some((i) => i.startsWith("## Project Status")),
  });
  fs.appendFileSync(path.join(logsDir, "skill-metrics.jsonl"), entry + "\n", "utf8");
} catch {
}

process.stdout.write(JSON.stringify(buildOutput(injections)));

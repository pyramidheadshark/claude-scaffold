#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadSkillRules, buildInjections, buildOutput } = require("./skill-activation-logic");

const input = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const prompt = input.prompt || "";
const cwd = process.cwd();

const rulesPath = path.join(cwd, ".claude/skills/skill-rules.json");
const rules = loadSkillRules(fs, rulesPath);

if (!rules) {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

const changedFiles = (() => {
  try {
    const result = execSync("git diff --name-only HEAD 2>/dev/null || echo ''", { cwd }).toString();
    return result.split("\n").filter(Boolean);
  } catch {
    return [];
  }
})();

const { injections } = buildInjections(fs, path, cwd, prompt, changedFiles, rules);

process.stdout.write(JSON.stringify(buildOutput(injections)));

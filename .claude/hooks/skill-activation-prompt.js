#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadSkillRules, buildInjections, buildOutput } = require("./skill-activation-logic");

const CACHE_DIR = path.join(process.cwd(), ".claude/cache");

function loadSessionCache(sessionId) {
  const cachePath = path.join(CACHE_DIR, `session-${sessionId}.json`);
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    return {};
  }
}

function saveSessionCache(sessionId, cache) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `session-${sessionId}.json`);
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
}

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

const cache = loadSessionCache(sessionId);
const sessionContext = {
  alreadyLoadedSkills: cache.loaded_skills || [],
  lastStatusHash: cache.last_status_hash || null,
};

const { injections, matchedSkills, statusHash } = buildInjections(fs, path, cwd, prompt, changedFiles, rules, sessionContext);

const PLAN_MODE_KEYWORDS = [
  "план", "планир", "запланир", "спланируем", "спланируй", "давай спланируем",
  "многоступенчат", "поэтапн", "пошагов", "составь план", "разработай план",
  "plan", "planning", "multi-step", "multi-phase", "step-by-step", "let's plan",
];
const promptLower = prompt.toLowerCase();
const isPlanIntent = PLAN_MODE_KEYWORDS.some((kw) => promptLower.includes(kw));
if (isPlanIntent) {
  injections.push(
    "## ⚠ Plan Mode Required\n" +
    "Planning intent detected. Before writing any code:\n" +
    "1. Call EnterPlanMode tool\n" +
    "2. Present the full step-by-step implementation plan\n" +
    "3. Wait for explicit user approval before proceeding"
  );
}

const updatedLoadedSkills = [...new Set([...(cache.loaded_skills || []), ...matchedSkills])];
try {
  saveSessionCache(sessionId, {
    session_id: sessionId,
    loaded_skills: updatedLoadedSkills,
    last_status_hash: statusHash,
    prompt_count: (cache.prompt_count || 0) + 1,
  });
} catch {
}

const logsDir = path.join(cwd, ".claude/logs");
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const promptCount = (cache.prompt_count || 0) + 1;
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    session_id: sessionId,
    repo: path.basename(cwd),
    prompt_count: promptCount,
    skills: matchedSkills,
    skills_cumulative: updatedLoadedSkills,
    changed_files_count: changedFiles.length,
    status_injected: injections.some((i) => i.startsWith("## Project Status")),
  });
  fs.appendFileSync(path.join(logsDir, "skill-metrics.jsonl"), entry + "\n", "utf8");
} catch {
}

process.stdout.write(JSON.stringify(buildOutput(injections)));

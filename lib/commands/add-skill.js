'use strict';

const fs = require('fs');
const path = require('path');
const copy = require('../deploy/copy');

function addSkill(infraDir, targetDir, skillName) {
  const skillSrc = path.join(infraDir, '.claude', 'skills', skillName);
  if (!fs.existsSync(skillSrc)) {
    throw new Error(`Skill not found: ${skillName}`);
  }

  const skillDst = path.join(targetDir, '.claude', 'skills', skillName);
  copy.copyDirRecursive(skillSrc, skillDst);

  const targetRulesPath = path.join(targetDir, '.claude', 'skills', 'skill-rules.json');
  const sourceRulesPath = path.join(infraDir, '.claude', 'skills', 'skill-rules.json');

  if (!fs.existsSync(sourceRulesPath)) {
    throw new Error(`Skill registry not found in infra at ${sourceRulesPath}`);
  }

  let targetRules = { rules: [] };
  if (fs.existsSync(targetRulesPath)) {
    try {
      targetRules = JSON.parse(fs.readFileSync(targetRulesPath, 'utf8'));
    } catch {
      throw new Error(`Could not parse skill-rules.json at ${targetRulesPath} — file may be corrupted`);
    }
  }

  const alreadyPresent = targetRules.rules.some(r => r.skill === skillName);
  if (!alreadyPresent) {
    let sourceRules;
    try {
      sourceRules = JSON.parse(fs.readFileSync(sourceRulesPath, 'utf8'));
    } catch {
      throw new Error(`Could not parse skill-rules.json at ${sourceRulesPath} — file may be corrupted`);
    }
    const sourceRule = sourceRules.rules.find(r => r.skill === skillName);
    if (sourceRule) {
      const newRule = { ...sourceRule, priority: targetRules.rules.length + 1 };
      targetRules.rules.push(newRule);
      fs.writeFileSync(targetRulesPath, JSON.stringify(targetRules, null, 2), 'utf8');
    } else {
      process.stderr.write(`[claude-scaffold] Warning: skill '${skillName}' has no rule in skill-rules.json — hook will not auto-load it.\n`);
    }
  }
}

module.exports = { addSkill };

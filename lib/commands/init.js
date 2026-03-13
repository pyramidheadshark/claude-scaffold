'use strict';

const fs = require('fs');
const path = require('path');
const copy = require('../deploy/copy');
const { registerDeploy } = require('../deploy/registry');

function deployCore(infraDir, targetDir, options) {
  const skills = options.skills || [];
  if (skills.length === 0) {
    throw new Error('No skills specified for deploy');
  }

  fs.mkdirSync(targetDir, { recursive: true });

  copy.copyHooks(infraDir, targetDir);
  copy.copyAgents(infraDir, targetDir);
  copy.copyCommands(infraDir, targetDir);

  for (const skill of skills) {
    const src = path.join(infraDir, '.claude', 'skills', skill);
    if (!fs.existsSync(src)) {
      process.stderr.write(`WARN: skill '${skill}' not found, skipping\n`);
      continue;
    }
    copy.copyDirRecursive(src, path.join(targetDir, '.claude', 'skills', skill));
  }

  copy.generateSkillRules(infraDir, targetDir, skills);
  copy.deploySettings(targetDir);
  copy.createDevStatus(infraDir, targetDir);
  copy.ensureGitignore(targetDir);

  registerDeploy(
    infraDir,
    targetDir,
    {
      skills,
      ciProfile: options.ciProfile || '',
      deployTarget: options.deployTarget || 'none',
    },
    options.registryPath
  );
}

module.exports = { deployCore };

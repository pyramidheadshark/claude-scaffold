'use strict';

const fs = require('fs');
const path = require('path');
const {
  MODEL_IDS,
  MODES,
  VALID_MODES,
  VALID_ROLES,
  resolveProfileForRole,
} = require('../models');
const { loadRegistry, saveRegistry, DEFAULT_REGISTRY_PATH } = require('../deploy/registry');

function normalizePath(p) {
  return path.resolve(p);
}

function readSettings(repoPath) {
  const settingsPath = path.join(repoPath, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return { settingsPath, data: null };
  try {
    return { settingsPath, data: JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
  } catch {
    return { settingsPath, data: null };
  }
}

function writeSettingsModel(repoPath, profileName) {
  const modelId = MODEL_IDS[profileName];
  if (!modelId) {
    throw new Error(`Unknown profile: ${profileName}`);
  }
  const { settingsPath, data } = readSettings(repoPath);
  const settings = data || {};
  const oldModelId = settings.model || null;
  settings.model = modelId;
  settings.env = settings.env || {};
  if (profileName === 'haiku') {
    if (settings.env.CLAUDE_CODE_EFFORT_LEVEL) {
      delete settings.env.CLAUDE_CODE_EFFORT_LEVEL;
    }
  } else if (!settings.env.CLAUDE_CODE_EFFORT_LEVEL) {
    settings.env.CLAUDE_CODE_EFFORT_LEVEL = 'max';
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return { oldModelId, newModelId: modelId };
}

function applyMode(modeName, opts = {}) {
  if (!MODES[modeName]) {
    throw new Error(`Unknown mode: ${modeName}. Valid: ${VALID_MODES.join(', ')}`);
  }
  const registryPath = opts.registryPath || DEFAULT_REGISTRY_PATH;
  const registry = loadRegistry(registryPath);
  const results = [];

  for (const entry of registry.deployed) {
    const role = entry.role || 'default';
    const profile = resolveProfileForRole(modeName, role);
    if (!profile) continue;

    const result = {
      path: entry.path,
      role,
      profile,
      oldModelId: entry.model ? (MODEL_IDS[entry.model] || entry.model) : null,
      newModelId: MODEL_IDS[profile],
      status: 'missing',
    };

    if (fs.existsSync(entry.path)) {
      try {
        const { oldModelId } = writeSettingsModel(entry.path, profile);
        result.oldModelId = oldModelId;
        result.status = 'applied';
      } catch (e) {
        result.status = 'error';
        result.error = e.message;
      }
    }

    entry.model = profile;
    results.push(result);
  }

  registry.active_mode = modeName;
  saveRegistry(registry, registryPath);
  return { mode: modeName, results };
}

function setRole(repoPath, role, opts = {}) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Unknown role: ${role}. Valid: ${VALID_ROLES.join(', ')}`);
  }
  const registryPath = opts.registryPath || DEFAULT_REGISTRY_PATH;
  const registry = loadRegistry(registryPath);
  const resolved = normalizePath(repoPath);

  const entry = registry.deployed.find(e => normalizePath(e.path) === resolved);
  if (!entry) {
    throw new Error(`Repo not found in registry: ${resolved}`);
  }
  const previous = entry.role || 'default';
  entry.role = role;
  saveRegistry(registry, registryPath);
  return { path: entry.path, previous, role };
}

function showStatus(opts = {}) {
  const registryPath = opts.registryPath || DEFAULT_REGISTRY_PATH;
  const registry = loadRegistry(registryPath);
  const entries = [];

  for (const entry of registry.deployed) {
    const registryModel = entry.model || 'sonnet';
    const { data } = readSettings(entry.path);
    const settingsModelId = (data && data.model) || null;
    const expectedModelId = MODEL_IDS[registryModel];
    const match = settingsModelId ? settingsModelId === expectedModelId : false;

    entries.push({
      path: entry.path,
      role: entry.role || 'default',
      registryModel,
      settingsModelId,
      expectedModelId,
      match,
      exists: fs.existsSync(entry.path),
    });
  }

  return { activeMode: registry.active_mode || null, entries };
}

function formatTable(rows) {
  if (rows.length === 0) return '  (no deployed repos)';
  const header = ['Repo', 'Role', 'Profile', 'Model ID', 'Status'];
  const data = rows.map(r => [
    path.basename(r.path),
    r.role || 'default',
    r.profile || r.registryModel || '',
    r.newModelId || r.expectedModelId || '',
    r.status || (r.match === false ? 'drift' : 'ok'),
  ]);
  const cols = header.map((h, i) => Math.max(h.length, ...data.map(d => String(d[i]).length)));
  const fmt = arr => '  ' + arr.map((v, i) => String(v).padEnd(cols[i])).join('  ');
  return [fmt(header), fmt(cols.map(c => '-'.repeat(c))), ...data.map(fmt)].join('\n');
}

function run(args) {
  const [sub, ...rest] = args;
  const command = sub || 'status';

  if (command === 'status') {
    const status = showStatus();
    console.log();
    if (status.activeMode) {
      console.log(`  Active mode: ${status.activeMode}`);
    } else {
      console.log('  Active mode: (not set — run `claude-scaffold mode default|quota-save|lean`)');
    }
    console.log();
    console.log(formatTable(status.entries));
    console.log();
    return;
  }

  if (command === 'set-role') {
    const role = rest[0];
    const repoPath = rest[1];
    if (!role || !repoPath) {
      console.error('Usage: claude-scaffold mode set-role <hub|worker|default> <repo-path>');
      process.exit(1);
    }
    try {
      const out = setRole(repoPath, role);
      console.log(`\n  ${path.basename(out.path)}: role ${out.previous} → ${out.role}\n`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (VALID_MODES.includes(command)) {
    try {
      const out = applyMode(command);
      console.log(`\n  Applied mode: ${out.mode}\n`);
      console.log(formatTable(out.results));
      const errors = out.results.filter(r => r.status === 'error');
      if (errors.length > 0) {
        console.log(`\n  ${errors.length} error(s): check messages above.`);
      }
      console.log();
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown mode subcommand: ${command}`);
  console.error(`Valid: ${[...VALID_MODES, 'status', 'set-role'].join(', ')}`);
  process.exit(1);
}

module.exports = {
  applyMode,
  setRole,
  showStatus,
  writeSettingsModel,
  formatTable,
  run,
};

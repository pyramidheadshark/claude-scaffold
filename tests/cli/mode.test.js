'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { applyMode, setRole, showStatus, writeSettingsModel } = require('../../lib/commands/mode');

let tmpRoot;
let registryPath;

function makeRepo(name, opts = {}) {
  const repoPath = path.join(tmpRoot, name);
  fs.mkdirSync(path.join(repoPath, '.claude'), { recursive: true });
  if (opts.model) {
    const settingsPath = path.join(repoPath, '.claude', 'settings.json');
    const settings = { model: opts.model, env: { CLAUDE_CODE_EFFORT_LEVEL: 'max' } };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }
  return repoPath;
}

function writeRegistry(entries) {
  fs.writeFileSync(registryPath, JSON.stringify({ deployed: entries }, null, 2), 'utf8');
}

function readRegistry() {
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function readRepoSettings(repoPath) {
  const p = path.join(repoPath, '.claude', 'settings.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-test-mode-'));
  registryPath = path.join(tmpRoot, 'deployed-repos.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('mode — writeSettingsModel', () => {
  test('sets model ID in settings.json (haiku)', () => {
    const repo = makeRepo('repo1');
    writeSettingsModel(repo, 'haiku');
    const s = readRepoSettings(repo);
    expect(s.model).toBe('claude-haiku-4-5-20251001');
  });

  test('removes CLAUDE_CODE_EFFORT_LEVEL for haiku', () => {
    const repo = makeRepo('repo1', { model: 'claude-sonnet-4-6' });
    writeSettingsModel(repo, 'haiku');
    const s = readRepoSettings(repo);
    expect(s.env.CLAUDE_CODE_EFFORT_LEVEL).toBeUndefined();
  });

  test('keeps CLAUDE_CODE_EFFORT_LEVEL=max for opus', () => {
    const repo = makeRepo('repo1');
    writeSettingsModel(repo, 'opus');
    const s = readRepoSettings(repo);
    expect(s.model).toBe('claude-opus-4-6');
    expect(s.env.CLAUDE_CODE_EFFORT_LEVEL).toBe('max');
  });

  test('keeps CLAUDE_CODE_EFFORT_LEVEL=max for sonnet', () => {
    const repo = makeRepo('repo1');
    writeSettingsModel(repo, 'sonnet');
    const s = readRepoSettings(repo);
    expect(s.model).toBe('claude-sonnet-4-6');
    expect(s.env.CLAUDE_CODE_EFFORT_LEVEL).toBe('max');
  });

  test('rejects unknown profile', () => {
    const repo = makeRepo('repo1');
    expect(() => writeSettingsModel(repo, 'nonexistent')).toThrow();
  });

  test('creates settings.json if absent', () => {
    const repo = makeRepo('repo1');
    writeSettingsModel(repo, 'sonnet');
    const s = readRepoSettings(repo);
    expect(s).not.toBeNull();
    expect(s.model).toBe('claude-sonnet-4-6');
  });
});

describe('mode — applyMode', () => {
  test('quota-save: hub→opus, worker→haiku, default→haiku', () => {
    const hub = makeRepo('hub-repo');
    const worker = makeRepo('worker-repo');
    const def = makeRepo('default-repo');
    writeRegistry([
      { path: hub, role: 'hub', skills: [], ci_profile: '', deploy_target: 'none' },
      { path: worker, role: 'worker', skills: [], ci_profile: '', deploy_target: 'none' },
      { path: def, role: 'default', skills: [], ci_profile: '', deploy_target: 'none' },
    ]);

    applyMode('quota-save', { registryPath });

    expect(readRepoSettings(hub).model).toBe('claude-opus-4-6');
    expect(readRepoSettings(worker).model).toBe('claude-haiku-4-5-20251001');
    expect(readRepoSettings(def).model).toBe('claude-haiku-4-5-20251001');

    const reg = readRegistry();
    expect(reg.active_mode).toBe('quota-save');
    const hubEntry = reg.deployed.find(e => e.path === hub);
    const workerEntry = reg.deployed.find(e => e.path === worker);
    expect(hubEntry.model).toBe('opus');
    expect(workerEntry.model).toBe('haiku');
  });

  test('default mode: all repos → sonnet regardless of role', () => {
    const hub = makeRepo('hub-repo');
    const worker = makeRepo('worker-repo');
    writeRegistry([
      { path: hub, role: 'hub', skills: [], ci_profile: '', deploy_target: 'none' },
      { path: worker, role: 'worker', skills: [], ci_profile: '', deploy_target: 'none' },
    ]);

    applyMode('default', { registryPath });

    expect(readRepoSettings(hub).model).toBe('claude-sonnet-4-6');
    expect(readRepoSettings(worker).model).toBe('claude-sonnet-4-6');
  });

  test('lean mode: all repos → haiku', () => {
    const hub = makeRepo('hub-repo');
    const worker = makeRepo('worker-repo');
    writeRegistry([
      { path: hub, role: 'hub', skills: [], ci_profile: '', deploy_target: 'none' },
      { path: worker, role: 'worker', skills: [], ci_profile: '', deploy_target: 'none' },
    ]);

    applyMode('lean', { registryPath });

    expect(readRepoSettings(hub).model).toBe('claude-haiku-4-5-20251001');
    expect(readRepoSettings(worker).model).toBe('claude-haiku-4-5-20251001');
  });

  test('unknown mode throws', () => {
    writeRegistry([]);
    expect(() => applyMode('invalid-mode', { registryPath })).toThrow(/Unknown mode/);
  });

  test('missing repo directory marked as missing', () => {
    writeRegistry([
      { path: path.join(tmpRoot, 'ghost-repo'), role: 'worker', skills: [] },
    ]);
    const { results } = applyMode('quota-save', { registryPath });
    expect(results[0].status).toBe('missing');
  });

  test('haiku mode strips CLAUDE_CODE_EFFORT_LEVEL', () => {
    const repo = makeRepo('repo', { model: 'claude-sonnet-4-6' });
    writeRegistry([{ path: repo, role: 'worker', skills: [] }]);
    applyMode('lean', { registryPath });
    const s = readRepoSettings(repo);
    expect(s.env.CLAUDE_CODE_EFFORT_LEVEL).toBeUndefined();
  });
});

describe('mode — setRole', () => {
  test('changes role for registered repo', () => {
    const repo = makeRepo('repo1');
    writeRegistry([{ path: repo, role: 'default', skills: [] }]);

    const out = setRole(repo, 'hub', { registryPath });

    expect(out.previous).toBe('default');
    expect(out.role).toBe('hub');
    const reg = readRegistry();
    expect(reg.deployed[0].role).toBe('hub');
  });

  test('throws if repo not registered', () => {
    writeRegistry([]);
    expect(() => setRole('/nonexistent/path', 'hub', { registryPath })).toThrow(/not found/);
  });

  test('rejects invalid role', () => {
    const repo = makeRepo('repo1');
    writeRegistry([{ path: repo, role: 'default', skills: [] }]);
    expect(() => setRole(repo, 'invalid-role', { registryPath })).toThrow(/Unknown role/);
  });

  test('handles path normalization (trailing slash)', () => {
    const repo = makeRepo('repo1');
    writeRegistry([{ path: repo, role: 'default', skills: [] }]);
    const out = setRole(repo + path.sep, 'worker', { registryPath });
    expect(out.role).toBe('worker');
  });
});

describe('mode — showStatus', () => {
  test('returns entries for all registered repos', () => {
    const r1 = makeRepo('r1');
    const r2 = makeRepo('r2');
    writeRegistry([
      { path: r1, role: 'hub', model: 'sonnet', skills: [] },
      { path: r2, role: 'worker', model: 'haiku', skills: [] },
    ]);

    const { entries } = showStatus({ registryPath });

    expect(entries).toHaveLength(2);
    expect(entries[0].role).toBe('hub');
    expect(entries[0].expectedModelId).toBe('claude-sonnet-4-6');
  });

  test('detects drift when settings.json disagrees with registry', () => {
    const repo = makeRepo('repo1', { model: 'claude-opus-4-6' });
    writeRegistry([
      { path: repo, role: 'worker', model: 'sonnet', skills: [] },
    ]);

    const { entries } = showStatus({ registryPath });

    expect(entries[0].settingsModelId).toBe('claude-opus-4-6');
    expect(entries[0].expectedModelId).toBe('claude-sonnet-4-6');
    expect(entries[0].match).toBe(false);
  });

  test('returns active_mode from registry', () => {
    writeRegistry([]);
    const registry = readRegistry();
    registry.active_mode = 'quota-save';
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');

    const { activeMode } = showStatus({ registryPath });
    expect(activeMode).toBe('quota-save');
  });

  test('marks repo as not exists when directory missing', () => {
    writeRegistry([
      { path: path.join(tmpRoot, 'ghost'), role: 'worker', model: 'sonnet', skills: [] },
    ]);
    const { entries } = showStatus({ registryPath });
    expect(entries[0].exists).toBe(false);
  });
});

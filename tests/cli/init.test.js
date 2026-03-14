'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-test-init-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const INFRA_DIR = path.join(__dirname, '..', '..');
const { deployCore } = require('../../lib/commands/init');

describe('init — deployCore', () => {
  test('creates .claude/hooks/ directory', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'hooks'))).toBe(true);
  });

  test('creates .claude/agents/ directory', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents'))).toBe(true);
  });

  test('creates .claude/commands/ directory', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'commands'))).toBe(true);
  });

  test('creates .claude/skills/ with selected skill', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(
      fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'python-project-standards'))
    ).toBe(true);
  });

  test('does not copy unselected skills', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(
      fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'fastapi-patterns'))
    ).toBe(false);
  });

  test('generates skill-rules.json with only selected skills', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards', 'fastapi-patterns'] });
    const rulesPath = path.join(tmpDir, '.claude', 'skills', 'skill-rules.json');
    expect(fs.existsSync(rulesPath)).toBe(true);
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const skillNames = rules.rules.map(r => r.skill);
    expect(skillNames).toContain('python-project-standards');
    expect(skillNames).toContain('fastapi-patterns');
    expect(skillNames).not.toContain('rag-vector-db');
  });

  test('creates .claude/settings.json with hooks', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.UserPromptSubmit).toBeDefined();
  });

  test('creates dev/status.md from template', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(fs.existsSync(path.join(tmpDir, 'dev', 'status.md'))).toBe(true);
  });

  test('does not overwrite existing dev/status.md', () => {
    const devDir = path.join(tmpDir, 'dev');
    fs.mkdirSync(devDir, { recursive: true });
    const statusPath = path.join(devDir, 'status.md');
    fs.writeFileSync(statusPath, '# Existing status', 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    expect(fs.readFileSync(statusPath, 'utf8')).toBe('# Existing status');
  });

  test('adds .claude/ to new .gitignore', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.claude/');
  });

  test('adds .claude/ to existing .gitignore that lacks it', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n', 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.claude/');
    expect(gitignore).toContain('node_modules/');
  });

  test('does not duplicate .claude/ in gitignore if already present', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.claude/\nnode_modules/\n', 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    const count = (gitignore.match(/\.claude\//g) || []).length;
    expect(count).toBe(1);
  });

  test('writes infra-version file', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const versionFile = path.join(tmpDir, '.claude', 'infra-version');
    expect(fs.existsSync(versionFile)).toBe(true);
    const sha = fs.readFileSync(versionFile, 'utf8').trim();
    expect(sha.length).toBeGreaterThan(0);
  });

  test('preserves existing mcpServers in settings.json', () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({ mcpServers: { myServer: {} } }), 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.mcpServers).toBeDefined();
    expect(settings.mcpServers.myServer).toBeDefined();
  });

  test('settings.json hooks use node commands (not bash)', () => {
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const settings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf8')
    );
    const postToolCmd = settings.hooks.PostToolUse[0].hooks[0].command;
    const stopCmd = settings.hooks.Stop[0].hooks[0].command;
    expect(postToolCmd).toMatch(/^node /);
    expect(postToolCmd).toMatch(/\.js$/);
    expect(stopCmd).toMatch(/^node /);
    expect(stopCmd).toMatch(/\.js$/);
    expect(postToolCmd).not.toMatch(/bash/);
    expect(stopCmd).not.toMatch(/bash/);
  });

  test('lang ru writes project-config.json with lang:ru', () => {
    deployCore(INFRA_DIR, tmpDir, {
      skills: ['python-project-standards'],
      lang: 'ru',
    });
    const configPath = path.join(tmpDir, '.claude', 'project-config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.lang).toBe('ru');
    expect(config.session_count).toBe(0);
  });

  test('lang en (default) does NOT write project-config.json', () => {
    deployCore(INFRA_DIR, tmpDir, {
      skills: ['python-project-standards'],
      lang: 'en',
    });
    const configPath = path.join(tmpDir, '.claude', 'project-config.json');
    expect(fs.existsSync(configPath)).toBe(false);
  });

  test('copies profile CLAUDE.md template for known profile + lang', () => {
    deployCore(INFRA_DIR, tmpDir, {
      skills: ['python-project-standards'],
      profile: 'ml-engineer',
      lang: 'en',
    });
    const claudeMd = path.join(tmpDir, '.claude', 'CLAUDE.md');
    expect(fs.existsSync(claudeMd)).toBe(true);
    const content = fs.readFileSync(claudeMd, 'utf8');
    expect(content).toContain('ML Engineer');
  });

  test('copies RU profile CLAUDE.md when lang is ru', () => {
    deployCore(INFRA_DIR, tmpDir, {
      skills: ['python-project-standards'],
      profile: 'ml-engineer',
      lang: 'ru',
    });
    const claudeMd = path.join(tmpDir, '.claude', 'CLAUDE.md');
    expect(fs.existsSync(claudeMd)).toBe(true);
    const content = fs.readFileSync(claudeMd, 'utf8');
    expect(content).toContain('ML Engineer');
    expect(content).toContain('Профиль');
  });

  test('deployCore preserves user custom hook events in settings.json', () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: { PreToolUse: [{ matcher: '.*', hooks: [{ type: 'command', command: 'my-hook' }] }] },
    }), 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.PreToolUse).toBeDefined();
    expect(settings.hooks.UserPromptSubmit).toBeDefined();
  });

  test('deployCore overwrites scaffold hook events with current definition', () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: { UserPromptSubmit: [{ matcher: '', hooks: [{ type: 'command', command: 'node old-hook.js' }] }] },
    }), 'utf8');
    deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const cmd = settings.hooks.UserPromptSubmit[0].hooks[0].command;
    expect(cmd).toContain('skill-activation-prompt.js');
    expect(cmd).not.toContain('old-hook.js');
  });
});

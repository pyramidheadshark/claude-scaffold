'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const INFRA_DIR = path.join(__dirname, '..', '..');
const { deployCore } = require('../../lib/commands/init');
const { addSkill } = require('../../lib/commands/add-skill');


let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-test-addskill-'));
  deployCore(INFRA_DIR, tmpDir, { skills: ['python-project-standards'] });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('add-skill — addSkill', () => {
  test('copies skill directory to target', () => {
    addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns');
    expect(
      fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'fastapi-patterns'))
    ).toBe(true);
  });

  test('updates skill-rules.json to include new skill', () => {
    addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns');
    const rulesPath = path.join(tmpDir, '.claude', 'skills', 'skill-rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const skillNames = rules.rules.map(r => r.skill);
    expect(skillNames).toContain('fastapi-patterns');
    expect(skillNames).toContain('python-project-standards');
  });

  test('does not duplicate skill in skill-rules.json if already present', () => {
    addSkill(INFRA_DIR, tmpDir, 'python-project-standards');
    const rulesPath = path.join(tmpDir, '.claude', 'skills', 'skill-rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const count = rules.rules.filter(r => r.skill === 'python-project-standards').length;
    expect(count).toBe(1);
  });

  test('throws for unknown skill name', () => {
    expect(() => addSkill(INFRA_DIR, tmpDir, 'nonexistent-skill')).toThrow();
  });

  test('preserves existing skills when adding a new one', () => {
    addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns');
    const rulesPath = path.join(tmpDir, '.claude', 'skills', 'skill-rules.json');
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const skillNames = rules.rules.map(r => r.skill);
    expect(skillNames).toContain('python-project-standards');
  });

  test('add-skill copies SKILL.md and skill-metadata.json', () => {
    addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns');
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'fastapi-patterns');
    expect(fs.existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillDir, 'skill-metadata.json'))).toBe(true);
  });

  test('updates registry skills list when project is registered', () => {
    const registryPath = path.join(tmpDir, 'test-registry.json');
    const registry = {
      deployed: [{
        path: tmpDir, skills: ['python-project-standards'],
        ci_profile: '', deploy_target: 'none', deployed_at: '2026-01-01', infra_sha: 'abc',
      }],
    };
    fs.writeFileSync(registryPath, JSON.stringify(registry), 'utf8');
    addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns', registryPath);
    const updated = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const entry = updated.deployed.find(e => e.path === tmpDir);
    expect(entry.skills).toContain('fastapi-patterns');
    expect(entry.skills).toContain('python-project-standards');
  });

  test('does not fail if project not in registry', () => {
    const registryPath = path.join(tmpDir, 'empty-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify({ deployed: [] }), 'utf8');
    expect(() => addSkill(INFRA_DIR, tmpDir, 'fastapi-patterns', registryPath)).not.toThrow();
  });

  test('add-skill throws descriptive error when source skill-rules.json missing', () => {
    const fakeInfra = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-fake-infra-'));
    const fakeSkill = path.join(fakeInfra, '.claude', 'skills', 'fake-skill');
    fs.mkdirSync(fakeSkill, { recursive: true });
    try {
      expect(() => addSkill(fakeInfra, tmpDir, 'fake-skill')).toThrow('Skill registry not found');
    } finally {
      fs.rmSync(fakeInfra, { recursive: true, force: true });
    }
  });
});

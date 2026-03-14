'use strict';

jest.mock('child_process');
jest.mock('fs');

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const { main } = require('../../.claude/hooks/python-quality-check');

const CWD = '/fake/project';

beforeAll(() => {
  jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
});

afterAll(() => {
  process.stderr.write.mockRestore();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('python-quality-check hook', () => {
  test('skip — no pyproject.toml exits immediately without running any command', () => {
    fs.existsSync.mockReturnValue(false);
    const result = main('{}', CWD);
    expect(result).toEqual({ continue: true });
    expect(spawnSync).not.toHaveBeenCalled();
  });

  test('uv detected — ruff invoked via uv run', () => {
    fs.existsSync.mockImplementation((p) => path.basename(p) !== 'src');
    spawnSync
      .mockReturnValueOnce({ status: 0, stdout: 'uv 0.5.0', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });

    const result = main('{}', CWD);

    expect(result).toEqual({ continue: true });
    const calls = spawnSync.mock.calls;
    const ruffCall = calls.find((c) => c[0] === 'uv' && c[1].includes('ruff'));
    expect(ruffCall).toBeDefined();
    expect(ruffCall[1]).toEqual(['run', 'ruff', 'check', '.', '--quiet']);
  });

  test('no uv — ruff invoked as bare command', () => {
    fs.existsSync.mockImplementation((p) => path.basename(p) !== 'src');
    spawnSync
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });

    main('{}', CWD);

    const calls = spawnSync.mock.calls;
    const ruffCall = calls.find((c) => c[0] === 'ruff');
    expect(ruffCall).toBeDefined();
    expect(ruffCall[1]).toEqual(['check', '.', '--quiet']);
  });

  test('ruff pass — returns continue:true, no failure message', () => {
    fs.existsSync.mockImplementation((p) => path.basename(p) !== 'src');
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });

    const result = main('{}', CWD);

    expect(result).toEqual({ continue: true });
    const stderrCalls = process.stderr.write.mock.calls.map((c) => c[0]).join('');
    expect(stderrCalls).toContain('RUFF: OK');
    expect(stderrCalls).not.toContain('Quality checks failed');
  });

  test('ruff fail — returns continue:true (non-blocking), emits failure message', () => {
    fs.existsSync.mockImplementation((p) => path.basename(p) !== 'src');
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 1, stderr: 'E501 line too long' });

    const result = main('{}', CWD);

    expect(result).toEqual({ continue: true });
    const stderrCalls = process.stderr.write.mock.calls.map((c) => c[0]).join('');
    expect(stderrCalls).toContain('RUFF: issues found');
    expect(stderrCalls).toContain('Quality checks failed');
    expect(stderrCalls).toContain('reminder only');
  });

  test('mypy pass — invoked when src/ exists, returns continue:true', () => {
    fs.existsSync.mockReturnValue(true);
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 });

    const result = main('{}', CWD);

    expect(result).toEqual({ continue: true });
    const calls = spawnSync.mock.calls;
    const mypyCall = calls.find((c) => c[1] && c[1].includes('mypy'));
    expect(mypyCall).toBeDefined();
    const stderrCalls = process.stderr.write.mock.calls.map((c) => c[0]).join('');
    expect(stderrCalls).toContain('MYPY: OK');
  });

  test('mypy fail — returns continue:true (non-blocking), emits failure message', () => {
    fs.existsSync.mockReturnValue(true);
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 1, stderr: 'error: incompatible type' });

    const result = main('{}', CWD);

    expect(result).toEqual({ continue: true });
    const stderrCalls = process.stderr.write.mock.calls.map((c) => c[0]).join('');
    expect(stderrCalls).toContain('MYPY: type errors found');
    expect(stderrCalls).toContain('Quality checks failed');
  });

  test('no src/ — mypy not invoked', () => {
    fs.existsSync.mockImplementation((p) => p.endsWith('pyproject.toml'));
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 });

    main('{}', CWD);

    const calls = spawnSync.mock.calls;
    const mypyCall = calls.find((c) => c[1] && c[1].includes('mypy'));
    expect(mypyCall).toBeUndefined();
  });

  test('uv detected — mypy invoked via uv run when src/ exists', () => {
    fs.existsSync.mockReturnValue(true);
    spawnSync
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 })
      .mockReturnValueOnce({ status: 0 });

    main('{}', CWD);

    const calls = spawnSync.mock.calls;
    const mypyCall = calls.find((c) => c[0] === 'uv' && c[1].includes('mypy'));
    expect(mypyCall).toBeDefined();
    expect(mypyCall[1]).toEqual(['run', 'mypy', 'src/', '--quiet']);
  });
});

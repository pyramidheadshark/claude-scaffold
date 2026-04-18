'use strict';

const path = require('path');
const { AgentPool } = require('../orchestrator/agent-pool');
const XTerm = require('blessed-xterm');

const STATUS_ICONS = {
  running: '{green-fg}●{/green-fg}',
  blocked: '{yellow-fg}▲{/yellow-fg}',
  done:    '{gray-fg}✓{/gray-fg}',
  stopped: '{red-fg}✗{/red-fg}',
};

function createAgentsPanel(screen, blessed, infraDir, setStatus) {
  const pool = new AgentPool();

  const agentList = blessed.list({
    parent: screen,
    top: 1,
    left: 0,
    width: '44%',
    height: screen.height - 2,
    border: { type: 'line' },
    label: ' Agents ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: {
      item: { fg: 'white' },
      selected: { fg: 'black', bg: 'white', bold: true },
      border: { fg: 'green' },
      label: { fg: 'green' },
    },
    hidden: true,
  });

  const terminal = new XTerm({
    top: 1,
    left: '44%',
    width: '56%',
    height: screen.height - 2,
    border: { type: 'line' },
    label: ' Output ',
    tags: true,
    shell: null,
    scrollback: 3000,
    style: {
      border: { fg: 'green' },
      focus: { border: { fg: 'yellow' } },
    },
  });
  screen.append(terminal);
  terminal.hide();
  terminal._scrollingStart = () => {};

  let items = [];
  let promptOpen = false;
  let displayedAgentId = null;
  let interacting = false;

  terminal.injectInput = (data) => {
    const sel = items[agentList.selected];
    if (sel) pool.write(sel.id, data);
  };

  terminal.on('resize', () => {
    if (displayedAgentId !== null) {
      const w = terminal.width - terminal.iwidth;
      const h = terminal.height - terminal.iheight;
      try { pool.resize(displayedAgentId, w, h); } catch { }
    }
  });

  function loadAgent(id) {
    if (displayedAgentId === id) return;
    displayedAgentId = id;
    const agent = pool.get(id);
    terminal.term.reset();
    if (!agent) {
      terminal.setLabel(' Output ');
      screen.render();
      return;
    }
    const data = agent.displayBuffer || agent.output.slice(-30000);
    if (data) terminal.write(data);
    terminal.setLabel(` #${id}: ${agent.name} [${agent.status}] `);
    try {
      const w = terminal.width - terminal.iwidth;
      const h = terminal.height - terminal.iheight;
      pool.resize(id, w, h);
    } catch { }
    screen.render();
  }

  function refresh() {
    const savedIdx = agentList.selected >= 0 ? agentList.selected : 0;
    items = pool.list();
    const ptyOk = pool.isPtyAvailable();
    const rows = items.length > 0
      ? items.map(a => {
          const icon = STATUS_ICONS[a.status] || '{gray-fg}?{/gray-fg}';
          return ` ${icon} #${a.id}  ${a.name.slice(0, 24).padEnd(24)}  ${a.status}`;
        })
      : [ptyOk
          ? ' {gray-fg}No active agents — press [s] to spawn{/gray-fg}'
          : ' {red-fg}node-pty unavailable — run: pnpm approve-builds{/red-fg}'];

    agentList.setItems(rows);
    if (items.length > 0) {
      agentList.select(Math.min(savedIdx, items.length - 1));
      const sel = items[agentList.selected];
      if (sel && sel.id !== displayedAgentId) loadAgent(sel.id);
    } else {
      displayedAgentId = null;
      terminal.term.reset();
      terminal.setLabel(' Output ');
    }
    agentList.setLabel(` Agents (${items.length}/${pool.maxAgents()}) `);
    screen.render();
  }

  pool.on('data', (id, data) => {
    if (id === displayedAgentId) terminal.write(data);
  });
  pool.on('spawned', () => refresh());
  pool.on('exit', (id) => {
    refresh();
    if (id === displayedAgentId) {
      const agent = pool.get(id);
      if (agent) terminal.setLabel(` #${id}: ${agent.name} [${agent.status}] `);
    }
  });
  pool.on('blocked', (id) => {
    refresh();
    setStatus(`{yellow-fg}▲{/yellow-fg} Agent #${id} BLOCKED — press {bold}Enter{/bold} to interact`);
  });

  agentList.on('select item', () => {
    const agent = items[agentList.selected];
    if (agent) loadAgent(agent.id);
  });

  function exitInteract() {
    if (!interacting) return;
    interacting = false;
    screen.grabKeys = false;
    screen.program.removeListener('keypress', interactKeypressHandler);
    agentList.focus();
    setStatus('  {bold}↑↓{/bold} select   {bold}Enter{/bold} interact   {bold}s{/bold} spawn   {bold}k{/bold} kill   {bold}d{/bold} remove done   {bold}Tab{/bold} switch panel');
    screen.render();
  }

  function interactKeypressHandler(ch, key) {
    if (!key) return;
    if (key.full === 'C-q' || (key.ctrl && key.name === 'q')) exitInteract();
  }

  agentList.key('enter', () => {
    if (promptOpen) return;
    const agent = items[agentList.selected];
    if (!agent) { setStatus('No agent selected'); return; }
    if (agent.status !== 'running' && agent.status !== 'blocked') {
      setStatus(`Agent #${agent.id} is ${agent.status} — not interactive`);
      return;
    }
    interacting = true;
    screen.grabKeys = true;
    screen.program.on('keypress', interactKeypressHandler);
    terminal.focus();
    setStatus(`{yellow-fg}Interacting:{/yellow-fg} agent #${agent.id} — {bold}Ctrl+Q{/bold} to return to list`);
    screen.render();
  });

  agentList.key('s', () => {
    if (promptOpen) return;
    if (!pool.isPtyAvailable()) {
      setStatus('{red-fg}node-pty not available — run: pnpm approve-builds{/red-fg}');
      return;
    }
    if (pool.activeCount() >= pool.maxAgents()) {
      setStatus(`{red-fg}Agent pool full — ${pool.activeCount()} active (max ${pool.maxAgents()}){/red-fg}`);
      return;
    }
    promptOpen = true;
    const prompt = blessed.prompt({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: 7,
      border: { type: 'line' },
      label: ' Spawn agent — enter absolute path to repo ',
      tags: true,
      style: { border: { fg: 'yellow' }, label: { fg: 'yellow' } },
    });
    prompt.input('Repo path:', '', (err, value) => {
      promptOpen = false;
      prompt.destroy();
      screen.render();
      if (err || !value || !value.trim()) return;
      try {
        const id = pool.spawn(value.trim(), 'interactive');
        setStatus(`{green-fg}✓{/green-fg} Agent #${id} spawned → ${value.trim()}`);
        refresh();
      } catch (e) {
        setStatus(`{red-fg}✗{/red-fg} Spawn failed: ${e.message}`);
      }
    });
    screen.render();
  });

  agentList.key('k', () => {
    if (promptOpen) return;
    const agent = items[agentList.selected];
    if (!agent) { setStatus('No agent selected'); return; }
    if (agent.status === 'done' || agent.status === 'stopped') {
      setStatus(`Use {bold}[d]{/bold} to remove finished agents`);
      return;
    }
    pool.kill(agent.id);
    setStatus(`{gray-fg}Agent #${agent.id} killed{/gray-fg}`);
    refresh();
  });

  agentList.key('d', () => {
    if (promptOpen) return;
    const agent = items[agentList.selected];
    if (!agent) { setStatus('No agent selected'); return; }
    if (!pool.remove(agent.id)) {
      setStatus(`Cannot remove running/blocked agent — kill it first with {bold}[k]{/bold}`);
      return;
    }
    setStatus(`{gray-fg}Agent #${agent.id} removed{/gray-fg}`);
    refresh();
  });

  refresh();

  return {
    pool,
    show() {
      agentList.show();
      terminal.show();
      agentList.focus();
      refresh();
      setStatus('  {bold}↑↓{/bold} select   {bold}Enter{/bold} interact   {bold}s{/bold} spawn   {bold}k{/bold} kill   {bold}d{/bold} remove done   {bold}Tab{/bold} switch panel');
      screen.render();
    },
    hide() {
      if (interacting) exitInteract();
      agentList.hide();
      terminal.hide();
    },
  };
}

module.exports = { createAgentsPanel };

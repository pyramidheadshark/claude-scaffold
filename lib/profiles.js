'use strict';

const PROFILES = {
  'ml-engineer': {
    skills: [
      'python-project-standards',
      'ml-data-handling',
      'predictive-analytics',
      'experiment-tracking',
      'rag-vector-db',
      'langgraph-patterns',
      'test-first-patterns',
    ],
    description: 'ML engineer: Chip Huyen patterns, hexagonal arch, ML workflow',
  },
  'ai-developer': {
    skills: [
      'python-project-standards',
      'fastapi-patterns',
      'claude-api-patterns',
      'prompt-engineering',
      'langgraph-patterns',
      'github-actions',
      'test-first-patterns',
    ],
    description: 'AI developer: Claude API, prompt engineering, agent patterns',
  },
  'fastapi-developer': {
    skills: [
      'python-project-standards',
      'fastapi-patterns',
      'htmx-frontend',
      'test-first-patterns',
      'github-actions',
    ],
    description: 'FastAPI developer: REST API, TDD, CI/CD',
  },
  fullstack: {
    skills: [
      'python-project-standards',
      'fastapi-patterns',
      'htmx-frontend',
      'test-first-patterns',
      'github-actions',
    ],
    description: 'Full stack: FastAPI + HTMX frontend, server-rendered',
  },
};

module.exports = PROFILES;

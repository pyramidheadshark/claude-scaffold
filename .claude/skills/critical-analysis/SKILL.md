## Skill: Critical Analysis (v1.0)

Multi-role critique system for ML experiments and architecture decisions.
Based on: Solo Performance Prompting (NAACL 2024), CrewAI role taxonomy,
Bermingham 13-agent DA-as-gate, De Bono Six Thinking Hats (Black Hat gating).

---

### When to Load (Auto-Default Behavior)

**Before any of the following — run Quick Mode without waiting for user request:**
- Architecture or design decision (new integration, refactor, layer change)
- ML experiment launch (clustering, training run, hyperparameter search)
- Infrastructure change (Terraform, Docker, secrets, permissions)
- Parameter choice without prior ablation

Quick Mode takes ~3 seconds of reasoning. If all 6 roles return "clear" — proceed.
If any role flags CRITICAL — surface it to the user before proceeding.

This is NOT optional. Critique runs before code, not after.

---

### 6-Role Taxonomy

| Role | Source | Key Question |
|------|--------|--------------|
| **[Security]** Security Sentinel | CrewAI Code Security Auditor | Injection, auth, secrets, attack surface — what can be exploited? |
| **[Perf]** Performance Analyst | CrewAI Performance Optimizer | O(n²), wasted iterations, memory — where is 80% of cost wasted? |
| **[DA]** Devil's Advocate | Bermingham 13-agent + Black Hat | What is the strongest argument AGAINST this? What breaks in 90 days? |
| **[Crutch]** Crutch Identifier | Project history: defectoscopy + hub | Is this a reusable pattern or a workaround being institutionalized? |
| **[Strategy]** Strategic Horizon | DX/tech debt, 6-month view | How does this look in 6 months? What's the tech debt cost? |
| **[ML]** ML Experiment Auditor | arxiv 2603.15916, project history | Are we at a plateau? Is this experiment worth running at all? |

---

### Quick Mode Protocol (SPP — Solo Performance Prompting)

Run all 6 roles simultaneously in your reasoning. Output before proceeding:

```
QUICK CRITIQUE:
[Security]:  <1-2 critical findings, or "clear">
[Perf]:      <1-2 critical findings, or "clear">
[DA]:        <top objection, or "no blockers">
[Crutch]:    <pattern or crutch? or "pattern — reusable">
[Strategy]:  <6-month risk, or "viable">
[ML]:        <plateau/pivot signal, or "N/A — not an experiment">

VERDICT: PROCEED / BLOCKED by [Role] — [reason]
```

If BLOCKED: surface the finding to the user. Do not write code around a CRITICAL finding.

---

### ML Experiment Audit Protocol

Before any experiment launch, answer all 4 checks:

**PLATEAU CHECK**
Has the primary metric improved > 2% in the last 3 experiments?
- NO → STOP. "Ceiling reached at [metric]. Continuing is waste. Pivot to: [2 alternatives]."
- YES → continue, but document delta

**HYPOTHESIS QUALITY**
- Is the hypothesis falsifiable? What result would disprove it?
- Is there a baseline? (If NO → refuse to launch tuning. Run baseline first.)
- Is the success threshold defined? ("any improvement" is not a threshold)

**OBSERVABILITY SLA**
- ETA > 30 min? Set CronCreate check at ETA / 2.
- What does "hung" look like? (CPU < 5% for 15 min, no log output for 30 min)
- Where are intermediate artifacts saved? (checkpoint, metrics JSON, sample predictions)
- Kill-switch: how to terminate gracefully?

**MACRO PRIORITY**
- Is this module a bottleneck? (Show profiling data or reasoning.)
- Will 2-5% improvement here move the overall system metric?
- What else could be running in parallel while this runs?

**Mandatory pre-flight template (write before running any experiment > 30 min):**
```
Hypothesis: [specific claim]
Baseline:   [prior result to beat, or "NONE — run baseline first"]
Success:    [metric >= X, or cost <= Y]
Pilot:      [subset size + estimated time for 5-min validation run]
SLA:        [check interval, kill condition, artifact save path]
```

---

### Crutch vs. Pattern Rubric

**Crutch indicators (flag for [Crutch] role):**
- Hardcoded value without named constant or config
- "temporary" comment in code older than 1 sprint
- Logic duplicated in 2+ places without abstraction
- TODO/FIXME with no owner or date
- "We'll fix this later" said aloud
- Architecture built for current single user, not contract

**Pattern indicators (safe to proceed):**
- Reused across 3+ contexts with same interface
- Decision documented with explicit rationale (ADR or inline comment with "why")
- Testable contract exists (interface + tests)
- Another team could use it without asking you questions

---

### Deep Mode (trigger: `[CRITIQUE]` in user prompt)

Launch 6 subagents via Agent tool in parallel — one per role.
Each subagent receives: context, the proposed decision, and its role's system prompt
(see `resources/role-prompts.md` for full prompts).

Synthesize via D3:
1. **Debate**: all 6 findings, unfiltered
2. **Deliberate**: classify each as CRITICAL / HIGH / LOW
3. **Decide**: present recommendation + explicit acknowledgment of each CRITICAL finding

---

### Patterns from Project History (Grounded in Real Failures)

**From defectoscopy (ML pipeline):**
- K=3000 run for 6h with no timer, no pilot, no baseline → "Why K=3000?" had no answer
- Hexagonal architecture scaffold built before any real code existed → 2h refactor waste
- Clustering metric improved, but clustering was NOT the pipeline bottleneck

**From techcon_hub (infrastructure):**
- GitHub PAT tokens pasted directly into chat (3 incidents) — immediate revocation needed
- `terraform apply -auto-approve` with changed `image_id` → destroyed all Portainer stacks
- Secrets stored only in GitHub Actions → developers cannot run locally

The [DA] and [Security] roles would have caught all of the above before execution.

---

### Resource Index

Load these only when explicitly needed (not auto-injected):
- `resources/role-prompts.md` — Full SPP prompts for Deep Mode subagents
- `resources/ml-audit-protocol.md` — Detailed plateau detection + pivot signal logic
- `resources/failure-patterns.md` — Full annotated failure pattern catalog (defectoscopy + hub)

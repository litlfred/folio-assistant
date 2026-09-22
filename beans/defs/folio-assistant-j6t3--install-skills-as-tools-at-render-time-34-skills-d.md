---
# folio-assistant-j6t3
title: 'INSTALL SKILLS AS TOOLS AT RENDER TIME: 34 skills declare user_invocable, 4 are reachable — options for Claude Code, Antigravity and any MCP host'
status: todo
type: task
priority: normal
created_at: 2026-09-21T21:42:35Z
updated_at: 2026-09-21T23:15:22Z
parent: folio-assistant-vuip
---

## What — the owner's ask, verbatim

2026-09-21:

> bean: develop otpions onhow could we "install" i guess at render time new
> skills to antigravity, caludecode as tools to improve discussion clairty
> between huamn and agent in dicsussion
>
> (e.g. so /coordinate work and /prepare-merge,  different model -> diffent
> tools)

## The gap, MEASURED rather than argued

| | count |
|---|---|
| skills declaring `user_invocable: true` | **34** |
| of those with a `.claude/commands/` entry | **4** |

So **30 skills say a human may invoke them by name, and no host can.**
`coordinate` is one of them — and this bean exists because the owner typed
`/coordinate` in this session and it did not run, while
`cat-harness/skills/folio-core/coordinate.md` sat in the repo declaring itself
invocable.

`.claude/commands/` is a HAND-MAINTAINED LIST of four against thirty-four
declarations. That is this repository's own "derived, never listed" rule
broken in the one place a person touches it: a list pretending to be a rule.

**"different model -> different tools" is the second half.** A skill's
reachability is currently an accident of which files a host happens to read.
Claude Code reads `.claude/commands/` and `.claude/skills/`; Antigravity,
Cursor and Copilot read none of them. The same repository, the same
declaration, a different agent — and the discipline silently is not there.

## Why THIS matters for discussion clarity specifically

The owner's framing is not "make skills reachable" in the abstract. It is that
the skills whose absence costs the most are the INTERACTION ones, and the cost
lands on a person who types with difficulty:

- `interaction-modality` — context → options → recommendation → question, and
  §4.1's "can the reader answer without opening anything?"
- `opening-brief` — brief before you touch anything
- `turn-reporting` — the write-time pass over what you actually wrote
- `coordinate` — which this session needed and could not invoke

A rule the agent must REMEMBER is a rule that fails silently. A tool the host
RENDERS is one the person can reach for. `AskUserQuestion` rendering selectable
options is worth more to this owner than any amount of prose about asking well.

## Options — to develop, not yet chosen

**A. Generate the slash commands.** Emit `.claude/commands/<name>.md` for every
skill declaring `user_invocable: true`, at init/render time.
*For:* smallest change; `init-folio` already writes `CLAUDE.md`, `GEMINI.md`,
`.mcp.json`, `settings.json` and the session-start hook, so the seam exists.
Kills the 4-of-34 list immediately.
*Against:* Claude Code only. Does nothing for Antigravity.

**B. Serve them as MCP tools.** The harness already runs an MCP server
(`--http` / `--stdio`) with `skill_list`, `skill_fetch`, `work_plan_prime`. Add
an invocation tool so every `user_invocable` skill is callable.
*For:* ONE implementation, host-agnostic — Claude Code, Antigravity and Cursor
are all MCP hosts; `.mcp.json` is already written for new folios.
*Against:* a tool is OFFERED, not enforced; and a human cannot type `/name` at
an MCP tool, so it serves the agent rather than the person.

**C. Host-native skill directories.** `.claude/skills/` plus each other host's
equivalent.
*For:* native discovery; Claude Code already auto-loads these.
*Against:* N hosts = N emitters and N formats to track, which is the drift
`AGENTS.md` exists to avoid — its whole premise is one agent-generic file with
thin tool-specific stubs.

**D. Hook enforcement.** Already partly built and already ruled on:
`interaction-modality` records a `PreToolUse` hook on `AskUserQuestion` that
PRINTS the six parts, plus `schemas/decision-request.ts` whose `renderDecision`
emits prose and selection from one object.
*For:* the only layer that can actually prevent the failure rather than
suggest against it.
*Against:* **the owner already chose "reminder now, gate later"** (2026-09-20),
because the schema was written by one author against four of his own mistakes
— a biased sample of one — and a gate that wrongly refused would cost the
person the one channel they use to correct an agent.

**E. Publish an installable bundle.** `docs/reference/skill-instructions/`
already publishes 226 instruction bodies; add a manifest a host can install
from, so a downstream reader's agent gets them without cloning.
*For:* serves instances that consume this platform rather than develop it.
*Against:* "install into a host" still needs per-host glue — this is a
distribution answer, not a reachability one.

## The shape a recommendation would take

**B as the spine and A as sugar, both EMITTED FROM THE SAME DECLARATION.** The
reason is not effort: it is that two hand-maintained surfaces drift, and the
present 4-of-34 is what that drift looks like after a few months. If the slash
command and the MCP tool are both generated from `user_invocable`, a skill
cannot be reachable in one host and missing in the other.

Not chosen here. The owner asked for OPTIONS, and D in particular carries a
ruling that should not be quietly reopened by an implementation.

## Done when

- [ ] Each option has a cost in files-touched and hosts-covered, measured
- [ ] The 4-of-34 number is RE-MEASURED rather than quoted from this bean
- [ ] Whatever ships is derived from `user_invocable`, so the list cannot
      drift from the declarations again
- [ ] The owner's "reminder now, gate later" ruling is either honoured or
      explicitly revisited with them — never stepped over by a tool that
      happens to enforce

## Which of the 30 are good candidates — owner asked, 2026-09-21

The test applied: **would a PERSON type this, or is it something an agent
runs?** A slash command is a human affordance; wiring an agent's internal
watcher to one adds a menu entry nobody wants.

### Tier 1 — a person types these, and two are proven

| skill | why |
|---|---|
| `coordinate` | **the owner typed `/coordinate` this session and it did not run.** Proven by failure |
| `integration-watch` | its own description says *"Dispatcher for the `/integration-watch` slash command"* — it documents a command that does not exist |
| `integration-backlog` | same: *"Dispatcher for the `/integration-backlog <axes>` slash command"* |
| `pending-show` | *"Show the current session's pending work … Read-only."* Exactly what a person asks for mid-session |
| `diff` | per-block changes with viewer links and undo impact — person-facing by construction |
| `getting-started` | *"Triage what a person means when they ask to create a folio, and route them"* — it exists to answer a human's first message |

### Tier 2 — a person initiates these, less often

| skill | why |
|---|---|
| `interaction-modality` | the one a person reaches for to RESET how the agent is talking to them. For an owner who types with difficulty this may belong in tier 1 |
| `session-intent` | session-start / session-end recording against the ledger |
| `delivery-summary` | post-delivery summary with restart command and viewer links |
| `build-pdf`, `build-docs` | a person asks for a build; an agent builds because it was asked |
| `repo-conversion` | *"Lay folio-assistant over a repository that already exists"* — always human-initiated |
| `dispatch-agent` | `swarm-management` already requires a swarm be **asked for every time**, so the human is the right invoker |

### Tier 3 — leave them; a human would not type them

The six `*-integration-watcher` skills (canonical, devils-advocate, proof,
compute, one-voice, detangler), plus `integration-audit`, `q-usage-watcher`,
`lean-formal-graph`, `lean-cache-restore`, `lean-substantive-pass`,
`latex-build-cache`, `semantic-review-scoping`, `exposition-swarm-drain`,
`symbiotic-interaction`, `continual-progress`. These are disciplines and
watchers an agent applies; a menu of them is noise.

**Two are arguable and belong to the owner, not to me:**
`definition-clarity-audit` and `proposition-consolidation-audit`. A
mathematician working `litlfred/qou` plausibly types both at their own paper.
They are tier 3 here and tier 1 in a paper folio — which is itself an argument
that **tiering is per content type**, not global.

### The drift runs BOTH ways, which changes the fix

- 30 skills declare `user_invocable: true` with no command;
- `prepare-merge` is a command with **no declaration behind it** — its skill
  does not set `user_invocable` at all;
- `integration-watch` and `integration-backlog` document a slash command that
  was never created.

So a generator that only emits commands FROM declarations fixes one direction
and leaves the other: `prepare-merge` would still be a hand-written file that
no declaration knows about. **Whatever ships has to reconcile both lists and
report the mismatch**, which is this repository's third-state rule — a command
with no skill and a skill with no command are different findings, and neither
is "clean".



---

## Owner, 2026-09-21: *"keep tools and skills separate!"*

Binding on this bean specifically, because this bean is the one that could
break it. `j6t3` is about EXPOSING a skill through a slash command / tool
surface so `/coordinate` and `/prepare-merge` work across Claude Code and
Antigravity. That is a rendering of a skill at an interface — it is **not** the
skill becoming a Tool node.

The two stay distinct objects in the graph:

| | declared in | what it is |
|---|---|---|
| **Skill** | the `kg` graph (`skills/`) | the instruction body an actor reads |
| **Tool** | the `tools` graph (`cat-harness/tools/`) | a `defineTool` node, authored as `.ts` so a malformed one fails at tsc |

So whatever `j6t3` builds emits an INVOCATION for a skill; it never mints a
Tool node from one, and it never writes into `tools/`. If a skill needs a real
tool to do its job, that tool is authored in `tools/` on its own terms and the
skill names it — which is the existing relation, not a new one.

Recorded here as well as on `yunp` because the instruction was given while
`yunp` was in hand, and an instruction found only on the bean that happened to
be open is an instruction the next agent does not find.

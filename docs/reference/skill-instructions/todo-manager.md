---
layout: default
title: Session Task Manager (`beans`)
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/todo-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/todo-manager.md) — do not edit here.

{% raw %}
# Session Task Manager (`beans`)

> **Disambiguation:**
> - `beans` (`todo-manager`, this file) = the agent's **session work-plan**.
>   Managed entirely via the `beans` CLI issue tracker (data stored in `.beans/`).
> - `sidecars` (`*.qa.json` and `*.witness.json` files) = **content state tracking**.
>   Beans and sidecars are NOT synonymous! Do NOT convert bulk QA queue items into
>   beans. They are completely separate workflow systems.
> - `todo-review` = triage of **content feedback** stored under
>   `feedback/<paper>/` and surfaced via the MCP `/todos`
>   dashboard. That is paper-content scope, not session scope.

Instead of an in-memory list or markdown checklists, we manage session work and cross-agent coordination using the `beans` CLI issue tracker.

## Installing beans (fresh sandbox / cloud container)

`beans` is the [`hmans/beans`](https://github.com/hmans/beans) Go binary — a
flat-file issue tracker storing issues as markdown under `.beans/`. Cloud
sandboxes do **not** ship it, so reinstall on demand (Go ships in the sandbox):

```bash
scripts/install-beans.sh          # idempotent; installs into a PATH dir
# equivalently, the one-liner it runs:
GOBIN="$HOME/.local/bin" go install github.com/hmans/beans@latest
```

Note: the npm package named `beans` is an unrelated abandoned tool — do **not**
`npm install beans`. Verify with `beans list && beans check`.

## Core Directives for Sessions

1. **Every session is a Bean:** At the start of your session, you MUST create a parent bean (`--type milestone` or `--epic`) that represents the session and its goals.
   `beans create "Session: <Branch/Goal>" --type milestone`
2. **Every todo is a Child Bean:** All tasks, probes, and action items planned for the session MUST be created as child beans (`--type task`) and linked to the session bean.
   `beans create "<Task Title>" --type task`
   `beans update <child-id> --parent <session-id>`
3. **No manual `.md` checklists:** Never use `session-beans.md` or raw Markdown `- [ ]` checklists to track global tasks. Always use the `beans` CLI to prevent namespace pollution and maintain the official project tracking.
4. **Check before you create:** `beans create` is **not** idempotent. Run the existence check below before every `beans create` — no exceptions, including the session milestone.
5. **Brief before you work:** claiming a bean records *which* item is taken; the opening brief records what it is taken **for**. Write it before the first tool call, in the chat. See §"Opening brief" below.

## Opening brief

**Claiming a bean records the work. Briefing it is what makes the work
resumable.** Both are required, and the brief comes first — before the first
tool call, in the chat, not in the commit.

AGENTS.md §"Opening a bean or a topic" states the rule and when it applies.
This is the shape.

### The four parts

**1. The problem, stated for someone who was not here.** Expand every
identifier on first use. Not "fixing `qou-93hu`" but "bean `qou-93hu` — the
`CriticalExponent` conjecture carrier, whose only field is `(3 * 4 : ℕ) = 12`, a
closed numeral identity with no exponent variable in it, so the class constrains
nothing."

**2. What you know, and how you know it.** Every number with its provenance:

| provenance | how to say it |
|---|---|
| measured this session | "measured just now: 22 of 22 seeded, 0 missed" |
| carried from a prior session | "recorded 2026-08-24 as 43 drifted; not re-measured" |
| asserted by a bean or a doc | "bean `qou-q7lf` says X — **unverified**" |

That third row is the one that bites. A sibling's bean is not a primary source,
and neither is a source file's `## Status` note; both go stale, and a specific,
recent, confidently-worded bean is exactly the kind that gets believed.

**3. The route and the gate.** How you plan to do it, what you will verify
against, and **what would falsify the approach**. A plan with no failure mode is
not a plan; it is an intention. If the gate is a script, name it and its
expected output.

**4. What you are NOT doing.** The adjacent defect you are leaving, the scope
you decline to widen into, the thing you will flag rather than fix. Stating it
up front is what stops it becoming either silent scope creep or a silent
omission — and it puts the scope call where it can still be argued with, which
is before the diff.

### Worked example

> **Starting `qou-93hu`** — the `CriticalExponent` §3b-cond hypothesis class in
> `lean/QOU/AlgebraicSubstrate/ConditionalClasses.lean`.
>
> **The problem.** Its single field is `alpha_three_eq_four : (3 * 4 : ℕ) = 12`
> — a closed numeral identity with the values already substituted in, so no
> exponent variable occurs in it and `rfl` proves it whatever the physics. Four
> sibling carriers in the same file are vacuous too, but they are at least the
> right *shape* (parameter-quantified inequalities); this one has no quantifier
> and no free variable at all.
>
> **What I know.** Measured this session: bound as `[C]` in 5 files; the probe
> baseline records it `proved-vacuous`; the class's own docstring already claims
> "α = 4/3", so the target value is not something I need to invent. Not
> measured: whether any downstream proof depends on the field's *current* type.
>
> **Route.** Make α a class parameter — `class CriticalExponent (α : ℝ) : Prop
> where alpha_eq : α = 4/3`. A `Prop` class cannot carry data, so α must be a
> parameter, not a field. Gate: lean-direct exit 0 on all three affected
> modules, plus a content probe proving `¬ CriticalExponent 2` — because
> inhabitability at 4/3 alone would not show the class constrains anything.
> **Falsifier:** if `¬ CriticalExponent 2` will not go through, the encoding is
> not doing what I claim and I stop.
>
> **Not doing.** The other four carriers need analytic setup their docstrings
> only gesture at — the author's mathematics, not a cleanup. Also leaving the
> separate `CriticalExponent` in `core-levi-form.lean`, a different carrier in a
> different namespace.

~200 words, and it would have let a reader stop the work, redirect it, or pick
it up cold.

### The failure this prevents

An agent that has spent an hour inside a problem writes in the private
vocabulary it built along the way, and a reader — the author, or the next agent
— has to reconstruct that vocabulary before evaluating anything. The brief is
written at the one moment when the agent still knows which parts are
non-obvious, because it has just finished finding them out.

**Cheapest correct move when you do not want to spend the words: do not start
the topic.** A task you cannot brief is one you have not understood well enough
to begin.

## Check before you create — `beans create` is not idempotent (STRICT)

`beans create` mints a **fresh random ID on every call** and dedupes on
nothing. Re-running a work-plan step is therefore *not* a no-op — it creates a
second bean. **Before every `beans create`, check whether the bean exists:**

```bash
T="Prove Foo.bar"
beans list --json --search "title:\"$T\"" | python3 -c '
import json, sys
t = sys.argv[1]
m = [b for b in json.load(sys.stdin) if b["title"] == t]
print(f"{len(m)} exact match(es)")
[print(" ", b["id"], b["status"]) for b in m]' "$T"
```

- **≥ 1 match** → do **not** create. Claim the existing bean instead:
  `beans update <id> --status in-progress --body-append "Claimed by <branch>"`
- **0 matches** → `beans create "$T" --type task`

`--search` is a fuzzy Bleve query, so the exact-title comparison inside the
pipe is load-bearing — do not drop it and trust `--search` alone.

**Why this is STRICT.** In the `qou` folio on 2026-08-04, one agent context
re-ran its 15-bean session work-plan ~980 times back-to-back (median 19 s per
cycle, ~16 h wall). Because `create` is unconditional, that produced **14,688
duplicate beans** — 92 % of every open bean in that repo. The damage was not
just clutter:

- the session-start sweep and the idle-backlog policy were reading mostly noise;
- ~980 copies of an already-proved item sat at `todo`;
- the duplicates **collided with the IDs of 15 real beans**, making
  `beans update <id>` ambiguous for those;
- they corrupted a later agent's own corpus-grep — 4,928 `.beans` files matched
  one search term across just 36 titles, inflating 14 real source files into an
  apparent 54 and nearly landing a false correction in a PR body.

The runaway loop is not something a doc can prevent; an unguarded `create` is.
This rule is platform-level so every folio inherits it.

## Working with Beans

**1. Finding Tasks**
Use `beans list` to find beans you should work on. Look for `todo` or `in-progress` beans that match your current scope/branch.

**2. Setting Dependencies**
You can map out sequence blockers using:
`beans update <id> --blocked-by <blocker-id>`
`beans update <id> --blocking <blocked-id>`

**3. Updating Status & Adding Comments**
- When starting work: `beans update <id> --status in-progress`
- When completed: `beans update <id> --status completed`
- To add notes or discussion: `beans update <id> --body-append "Your note"`

## Status Display Format

When the user asks "status" or "show beans", run `beans list` and display the hierarchy:

```
## Session Beans
- [epic-123] Session: <branch-name> (in-progress)
  - [task-124] Task A (completed)
  - [task-125] Task B (in-progress)
  - [task-126] Task C (todo)
```
{% endraw %}

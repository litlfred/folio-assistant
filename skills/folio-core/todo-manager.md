---
name: todo-manager
roles: [reader, collaborator, owner]
description: >
  Maintain and display work-in-progress task lists using the `beans` CLI
  issue tracker. Track implementation progress, open tasks, missing
  artifacts, and blocked items across a session.
allowed-tools: Read Grep Glob TodoWrite AskUserQuestion
---

# Session Task Manager (`beans`)

> **Disambiguation:**
> - `beans` (`todo-manager`, this file) = the agent's **session work-plan**.
>   Managed entirely via the `beans` CLI issue tracker (data stored in `beans/`).
> - `sidecars` (`*.qa.json` and `*.witness.json` files) = **content state tracking**.
>   Beans and sidecars are NOT synonymous! Do NOT convert bulk QA queue items into
>   beans. They are completely separate workflow systems.
> - `todo-review` = triage of **content feedback** stored under
>   `feedback/<paper>/` and surfaced via the MCP `/todos`
>   dashboard. That is paper-content scope, not session scope.

Instead of an in-memory list or markdown checklists, we manage session work and cross-agent coordination using the `beans` CLI issue tracker.

## Installing beans (fresh sandbox / cloud container)

`beans` is the [`hmans/beans`](https://github.com/hmans/beans) Go binary — a
flat-file issue tracker storing issues as markdown under `beans/`. Cloud
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

## Say which bean you are on — every turn

Claiming a bean records the work; **reporting** it is what lets a human steer
and a sibling session avoid you. Both are required.

### Opening a turn

**When you begin work on a bean**, open that turn by naming it and what you are
attempting — before the first tool call, not after the work lands:

> **Starting `fwr7`** — retargeting the seven edges the forward-ref arc left
> alone, because the edge is wrong rather than the block's position.

### Closing a turn

**End every turn** with the beans you touched and what is next.

> **Beans**
> - **worked** [`fwr8`](beans/folio-assistant-fwr8--re-baseline-the-forward-ref-arc.md) — Re-baseline the forward-ref arc endpoints. Re-ran both with the fixed parser: the arc is 274 → 195, not 274 → 192. This corrects my own earlier claim that the start figure was understated — only the post-mid-arc figures are short, and only by 3.
> - **next** [`fwr7`](beans/folio-assistant-fwr7--retarget-seven-mis-aimed-uses-edges.md) — Retarget seven `uses[]` edges that point at the wrong block. Two of the seven are now confirmed detangler findings rather than reader reports, which raises their priority above the remaining five.

### The rules that make a report worth reading

**1. Every bean reference carries TWO sentences and a link — what it is, then
what you would do.**
`fa/nvbr` is an opaque four-character string. A reader cannot tell whether it
is urgent, adjacent, or already obsolete without opening the store — and asking
someone to go look things up is the cost this report exists to remove. Link to
the bean file so one click gets the full body.

A gloss says what the bean IS; the second sentence says what you would DO, which
is what somebody deciding whether to let you do it needs. **Titles alone are a
menu with no prices** — a reader can see that `rlp5` is two scripts disagreeing
about a flag and still not know whether your answer is a one-line fix or a
question back to them.

> ✗ **next** [`rlp5`](…) — `pdf-ocr` and `pdf-structure` disagree about what `-o` means.
>
> ✓ **next** [`rlp5`](…) — they disagree about what `-o` means, so a command that works with one silently writes elsewhere with the other. I would measure which spelling each script's callers assume, make the minority match, and keep an alias only if an outside caller needs it.

First person and a proposal — *"I would …"* — because rule 5 already says expect
to be overruled; the passive hides whose call it is. Applies to **worked** too
(what you did, and whether it is finished) and to anything you are declining, or
a reader assumes it is queued. Two sentences settle a bean somebody can say yes
to; when **next** hands over a real decision between costed routes, §"The `next`
line is a question" below is the binding form.

**2. Asking for review means linking the artefact — deep, not the root.** If a
turn ends with "please look at this", it must carry the **PR link** and a
**direct link to every page that changed**, not the staging root.

> ✗ `https://…/STAGING/claude-my-branch/`
>
> ✓ **Staging:**
> - [Swarm management](https://…/STAGING/claude-my-branch/swarm-management.html) — new page
> - [process-state](https://…/STAGING/claude-my-branch/reference/skill-instructions/process-state.html) — new skill
> - [Architecture](https://…/STAGING/claude-my-branch/architecture.html) — nav entry added

Handing over the root makes the reader navigate a site to find what you
changed. You already know which pages those are — you wrote them — so the
lookup is yours to do, not theirs. Say what each link *is*, too: a bare URL
does not tell a reader whether it is new, changed, or just context.

`AGENTS.md` records the underlying rule (PR #178, 2026-09-16): a human cannot
assess a rendered artefact from a description, and withholding it makes
assessment harder rather than safer. **A root-only link is a partial
withholding** — the artefact is technically reachable and practically hidden.

**Where to get the links.** The staging workflow deploys to
`…/STAGING/<branch-slug>/`, and Jekyll rewrites `baseurl` so paths mirror
`docs/`. A page at `docs/architecture/foo.md` is at
`…/STAGING/<slug>/architecture/foo.html`; a skill at
`skills/<pkg>/bar.md` is at
`…/STAGING/<slug>/reference/skill-instructions/bar.html`. Derive one per
changed file rather than guessing which the reader wants.

**3. Say what to review, not just that it is green.** "Green on all three
workflows" says the PR is not broken. It does not say what the change **does**,
what to **look at**, or what **judgement** is wanted. A reader should be able to
act on the report without opening the diff, and then open the diff knowing what
they are looking for.

**4. Length follows content.** There is no word budget. A one-line fix gets a
line; a design change that needs a decision gets a paragraph. Err long — the
cost of a sentence the reader skims is far below the cost of a round-trip
asking what you meant, especially for an author who types with difficulty.

**5. "Next" is your judgement, not a fact.** Beans carry no priority order
beyond what an agent asserts — so say *why* it is next, and expect to be
overruled.

**6. Prefix across repos** (`qou/fwr7`, `fa/fsl7`) when a turn spans both.

**7. Report unclaimed work as unclaimed.** If you did durable work without a
bean, say so and open one; that omission is the failure this exists to catch.

### The worked failure

Measured here, 2026-09-18. A real end-of-turn report, verbatim:

> **worked** `fa/fsch` — Green on all three workflows. Also corrected the PR
> body, which had drifted from the code after your detangle instruction.
> **next** `fa/nvbr`, `fa/rnfl` — both gated on #251.

It breaks the first three rules at once. `fa/nvbr` and `fa/rnfl` appear with no
gloss and no link, so the reader cannot tell what either is. The turn asked for
review and gave no staging link, so the reader had to ask for it. And "green on
all three workflows" describes CI rather than the change: it never says the PR
introduces a root declaration schema, never says the conventions doc is the
thing worth reading, and never says which decision was wanted. The author's
reply was *"staging link???"*, then a request for more context — two
round-trips that a longer report would have spent nothing to avoid.

The old version of this rule capped entries at "up to 50 words", which read as a
budget to spend rather than a floor to clear and rewarded exactly that
terseness. Rule 4 replaces it.

### The "next" line is a question, so it carries its context (STRICT)

Rules 1 and 5 above say the next item needs a gloss and a reason. This is the
stronger form for the case where **next** also hands over a *decision*:
[`interaction-modality.md` §4.1](interaction-modality.md)
governs it — context → options → recommendation → question — and the test is
whether the author can answer **without opening anything**.

A bean id plus a term you coined is the specific failure. Measured here on
2026-09-18:

> **next** `x4mt` — Cross-agent skill install + `fa-` prefix (#247). Unstarted,
> and I'd want your call on prefix-at-rest vs prefix-at-install before writing
> anything.

`x4mt` is opaque, `fa-` is undefined, and "prefix-at-rest vs prefix-at-install"
names two options that exist only inside issue #247 — so the author had to open
it to find out what was being asked. It could have read:

> **next** `x4mt` — Install this platform's skills into whichever agent is
> running, each name prefixed `fa-` so it cannot collide with the host's own
> commands. One call needed: add the prefix **when a skill is installed**
> (nothing in this repo moves — recommended), or **rename the files here**,
> which also drags the manifests, the BPMN skill refs and two generators.

Barely longer, and answerable in one character.

**A deferred decision is stated in full, or not stated at all.** If it genuinely
will not fit, say the decision exists and that you will put it properly when you
reach it — never post a teaser whose only resolution is a document.

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
- they corrupted a later agent's own corpus-grep — 4,928 `beans` files matched
  one search term across just 36 titles, inflating 14 real source files into an
  apparent 54 and nearly landing a false correction in a PR body.

The runaway loop is not something a doc can prevent; an unguarded `create` is.
This rule is platform-level so every folio inherits it.

## When the `beans` CLI is not there — you are still not read-only

`scripts/beans-fallback.ts` writes the same store in the same layout: same
files, same front matter, same id shape, read from `.beans.yml`. The CLI reads
everything it writes once installed. There is no import step and no second
store.

```sh
bun run beans:fallback list --status todo
bun run beans:fallback show <id>
bun run beans:fallback claim <id>
bun run beans:fallback create "<title>" --status in-progress
bun run beans:fallback note <id> "<what you found>"
```

A read-only fallback is not a fallback for an agent — it lets you see the plan
and touch nothing, and a session that can see its plan but not claim it does its
work unclaimed. That is not hypothetical: it is what happened on 2026-09-18
across two merged PRs.

Its `create` **refuses an exact duplicate title** and names the bean to claim
instead. The CLI's `create` does not, and that is the mechanism behind the
14,688 duplicates in `qou`. `--force` exists for a genuinely intended duplicate
and has to be typed.

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

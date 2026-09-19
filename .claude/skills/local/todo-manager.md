# Todo Manager — beans work-plan & cross-agent coordination

The session work-plan and cross-agent coordination tracker for this repo is
[`beans`](https://github.com/hmans/beans): a small Go flat-file issue tracker
that stores issues as markdown under `beans/`. It is installed on demand by
[`scripts/install-beans.sh`](../../../scripts/install-beans.sh) (fresh cloud
sandboxes do not ship it).

`beans` supersedes ad-hoc `TodoWrite` lists and `todos/*.json` sidecars as the
**durable** work-plan: because it is committed to the repo, a plan survives
container reclamation and is visible to sibling agent sessions.

## What beans are (and are not)

- **Beans are the work-plan.** Goals, probes, and the tasks an agent claims and
  drives to completion live as beans. They are durable and cross-session.
- **Beans are not sidecars.** Bulk machine-generated queues — QA audits, witness
  queues, watcher drain queues — stay as bulk JSON under `todos/` / `beans/*.json`
  and are read by their own `.ts` tooling. **Never** `beans create` a QA/witness
  queue entry. The discipline is: `beans ≠ sidecars`.

## Core commands

```sh
scripts/install-beans.sh      # install the CLI if missing (--force to reinstall)
beans list                    # show the current work-plan
beans check                   # health-check the beans/ store
beans create "<title>"        # open a new work-plan item
beans show <id>               # read an item
beans <id> --status in-progress   # claim an item (durable, visible to siblings)
```

## Using beans for todos (session + cross-session)

Beans **is** the todo mechanism for agent work. Do not stand up a separate todo
store — no API route, dashboard, or `todos/*.json` work-plan. One mechanism,
agent-generic, durable.

**Session todos (your work-plan for this session).** Track anything you want to
persist as beans, not in your agent's ephemeral in-memory todo tool (e.g.
Claude's `TodoWrite`, or equivalents). The in-memory list is fine for
throwaway intra-turn scratch, but it evaporates when the container is reclaimed.
Open a bean per task, mark it `in-progress` as you start, close it when done —
because `beans/` is committed, the plan survives a resume in a fresh container.

**Cross-session / cross-agent coordinated todos.** The same committed `beans/`
store is the shared work-plan across sibling sessions and across different agent
CLIs. Claim before you work (set `in-progress` + note your branch) so two
sessions don't pick the same item — but **a claim is branch-local until your PR
exists**, so it is not a lock: a sibling reading `origin/main` still sees
`todo`. Before claiming, `git fetch origin main` and check the open PR list for
the bean id. Two sessions claimed `plj1` 61 seconds apart on 2026-09-19 and
opened two PRs for it; see `folio-core/bean-coordination.md`
§"A claim is branch-local".
Never resolve a sibling's bean, and never delete ANY bean — scrap with reasons instead. See
`bean-coordination.md` for the full claim/handoff lifecycle.

**What beans is *not* for:**
- Bulk machine-generated queues (QA `*.qa.json`, witness `*.witness.json`,
  watcher drain queues) — `beans ≠ sidecars`; keep those as bulk JSON.
- Content-review feedback on *published documents* — that is a separate domain
  workflow (the `todo-review` skill over `feedback/<paper>/*.ts`), not the agent
  work-plan. Don't conflate the two.

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

**EVERY MENTION, not every report.** This rule is filed under "what makes a
report worth reading" and the scope is wider than that heading: a bean id in an
ordinary sentence is exactly as opaque as one in a list, and a reader hunting for
its meaning cannot see which section of your message it came from. So it binds a
one-line status, a mid-paragraph aside, a commit message, a PR body, an issue
comment — anywhere the id appears at all. If naming the bean is not worth two
sentences, do not name it: say "nothing outstanding" or describe the work without
the id.

Measured here, 2026-09-19. A turn ended *"Next unstarted is `5o3a`, or either
standing decision."* — bare id, no summary, no link — in the same session that
shipped the two-sentence rule and listed four other beans correctly under a
**Beans** heading. The rule was obeyed where it was filed and broken one line
below it, which is what a scope written as a section heading buys you. The
author's reply was *"what is 5o3a?"*, which is the round-trip the whole rule
exists to remove.

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
[`interaction-modality.md` §4.1](../../../skills/folio-core/interaction-modality.md)
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

## Coordination discipline

1. **Claim before you work.** Mark the bean `in-progress` so sibling sessions
   working the same goal do not duplicate the effort — and know what that buys
   you. The claim lives on YOUR branch, so it is invisible on `origin/main`
   until your PR exists; it announces the item is taken, it does not reserve
   it. So also `git fetch origin main` and check the open PR list for the bean
   id before you start. Measured: two sessions claimed `plj1` 61 seconds apart
   and shipped two PRs for it.
   **Brief it in the same turn you claim it** (§"Opening brief" above). The
   claim tells a sibling the item is taken; the brief tells them, and the
   author, what it is being taken *for*.
2. **One source of truth per concern.** Do not fork a bean into a parallel
   `todos/*.json` queue; link to the queue from the bean instead.
3. **Move wiring and script together.** When relocating a hook-backed script,
   move its hook reference in the same change — a script without its wiring (or a
   hook reference without its script) is the migration failure mode that left
   dangling references behind (see `docs/folio-assistant-migration.md` §2).
4. **Close on landing.** When the work lands, close the tracking bean and update
   any cross-repo ownership note.

## Relationship to other surfaces

- `scripts/session-start-coord-sweep.sh` — CLI-independent session-start surface:
  fetches `origin/main`, summarizes sibling branch activity. Works even when the
  `beans` CLI is absent.
- `scripts/install-beans.sh` — provisions the `beans` CLI.
- See `docs/folio-assistant-migration.md` for the full migration plan and the
  open requirements for the qou-side / settings.json agent.

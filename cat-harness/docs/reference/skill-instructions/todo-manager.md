---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Session Task Manager (`beans`)'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/todo-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/todo-manager.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/todo-manager.md){: .fa-edit-source }

{% raw %}
> **This is the skill `skill_fetch` serves.** A stub of the same name
> lives at `.claude/skills/local` and is published as
> [todo-manager (local stub)](local-todo-manager.html); it only points here.
> Edit this page's source, never the stub.

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

> **This skill was split on 2026-09-19 (bean `tdmg`).** It had reached 396 lines
> against `skill-not-a-document`'s 400-line threshold while carrying three
> separable disciplines. What stayed here is the **bean mechanics**: installing
> the CLI, the STRICT check before `beans create`, the fallback when the CLI is
> absent, the status vocabulary, and the coordination rules below. What moved:
>
> - [`opening-brief.md`](opening-brief.md) — what you say **before** starting a
>   bean or a topic.
> - [`turn-reporting.md`](turn-reporting.md) — what you say **during and after**
>   each turn, including the STRICT "next"-line rule.
>
> No rule changed in the split. If you are looking for a report format, it is in
> one of those two.

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

## What the session-start sweep emits, and why in that order

A session-start hook runs the sweep where a hook runs at all. **It installs the
CLI when it is genuinely missing** — bounded and quiet, falling through to the
degraded reader rather than failing the hook — and prepends the install
directory when the binary is already there, so a second session does not
reinstall. If the sweep still reports the CLI missing, it could not be installed
there.

**That the installer runs, rather than being recommended, is the lesson of the
2026-09-18 incident above.** An imperative somebody has to act on is weaker than
the act itself; a parenthetical "run the installer for full priming" was read
and not acted on.

The order is not arbitrary:

1. **Interaction preferences — first**, because they change the *form* of every
   question that follows. A question asked before them may have to be asked
   again.
2. Work-plan priming and the open list.
3. **The roadmap.** A flat list of a hundred ids in creation order is **data,
   not a plan**; the milestone/epic structure is what lets an end-of-turn report
   say what is *next* and why.
4. **The commands the person can run themselves**, the interactive browser
   first. An agent cannot drive a TUI on somebody's behalf, so the only useful
   thing to do with one is print it where they will see it — with a
   copy-pasteable line whose path and branch are **computed, never written in**.
5. Default-branch delta, sibling branch activity, CI health.

**Heavy triage of new commits belongs in a background subagent, not the
foreground.** The sweep's job is to tell you what changed, not to spend your
first minutes reading it.

## Core Directives for Sessions

1. **Every session is a Bean:** At the start of your session, you MUST create a parent bean (`--type milestone` or `--epic`) that represents the session and its goals.
   `beans create "Session: <Branch/Goal>" --type milestone`
2. **Every todo is a Child Bean:** All tasks, probes, and action items planned for the session MUST be created as child beans (`--type task`) and linked to the session bean.
   `beans create "<Task Title>" --type task`
   `beans update <child-id> --parent <session-id>`
3. **No manual `.md` checklists:** Never use `session-beans.md` or raw Markdown `- [ ]` checklists to track global tasks. Always use the `beans` CLI to prevent namespace pollution and maintain the official project tracking.
4. **Check before you create:** `beans create` is **not** idempotent. Run the existence check below before every `beans create` — no exceptions, including the session milestone.
5. **Brief before you work:** claiming a bean records *which* item is taken; the opening brief records what it is taken **for**. Write it before the first tool call, in the chat. See §"Opening brief" below.

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
  — and note that the claim is **branch-local**: a sibling reading
  `origin/main` sees `todo` until your PR exists, so it announces rather than
  reserves. Also `git fetch origin main` and check the open PR list for the
  bean id. Two sessions claimed one bean 61 s apart on 2026-09-19 and shipped
  two PRs. [`bean-coordination.md` §"A claim is branch-local"](bean-coordination.md).
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

## Check before you UPDATE — `--body-file` REPLACES the body (STRICT)

`beans create` is not idempotent; `beans update` is not additive. They are
different failures and both cost a durable artefact, so they sit together.

**A bean's body is an append-only record of who found what, when.** Every note
in it is dated and signed, and later notes cite earlier ones — the closing note
on `gjli` opens *"the 2026-09-19 note above did"*. Replace the body and you
have not edited a field; you have deleted findings that other beans, commits
and issues point at.

`beans update` offers four ways to write one, and **only one of them appends**:

| flag | what it does |
|---|---|
| `--body-append <text>` \| `--body-append -` | **appends.** `-` reads stdin |
| `--body-file <path>` | **REPLACES the whole body** with the file |
| `--body <text>` \| `--body -` | **REPLACES** |
| `--body-replace-old/-new` | replaces one substring; leaves the rest |

Measured 2026-09-22 on a scratch store: a bean carrying two notes, given
`--body-file` with a third, kept the third alone. **Exit 0, no warning, no
diff, no prompt.** Nothing in the output distinguishes it from an append.

**For a long, multi-paragraph note, use `--body-append -`:**

```bash
beans update <id> --status completed --body-append - <<'NOTE'
_2026-09-22T06:51:22Z_ — what you found, and how you know it.
NOTE
```

That is the form the long-note case actually needs, and naming only
`--body-append "Your note"` is why this skill did not prevent the loss it is
now recording: an agent with four paragraphs to write reaches past an inline
string argument for the flag that takes a **file**, and `--body-file` is
sitting right there, one letter's difference from `--body-append`, doing
something else entirely. (`beans create` **rejects** `--body-file -` with a
heredoc — bean `5wrg` found that separately. So the two subcommands disagree
about the same flag name, which is one more reason not to reach for it.)

The timestamp prefix is an **authored convention, not a CLI feature** — no flag
adds it. Write it yourself or the note joins the previous paragraph undated.

**Recovery, if it has already happened.** The store is committed, which is the
whole reason this is survivable: `git show HEAD:<bean-file>` returns the body
as of the last commit, and the lost notes can be reassembled with the new front
matter. Recover from **git**, not from your own scrollback — a transcript is a
copy you made, and the repository is the artefact. Then say plainly what was
lost and restored; a silent repair leaves the next reader unable to tell a
reconstruction from an original.

## WHICH parent — the criterion nobody wrote down

**A bean's parent is the epic whose SUBJECT it is, not the epic you happen to
be working in.** That sentence was missing from this skill until 2026-09-20,
and its absence is measurable: in one session six new beans were all filed
under `yj32`, the epic that session was working in, while their subjects
belonged to four different epics. The owner spotted it — *"beans misfiled...
wrong skills guidance? tools guidance?"* — and the answer was yes, this file.

**Nothing catches a wrong parent.** `check-bean-parents` tests exactly two
things: that an open bean HAS a `parent`, and that the parent NAMES A BEAN
THAT EXISTS. A bean filed under the wrong epic satisfies both, so it is
textually clean, the guard is green, and it is only findable by a person
reading the roadmap. **The check cannot distinguish a right parent from a
wrong one, so the criterion has to live here or nowhere.**

### How to choose

1. **`beans list` and read the EPICS first** — there are many, each with a
   thematic scope in its title. Do this BEFORE `beans create`, at the same time
   as §"Check before you create"; both are questions about where a bean
   belongs, and both are cheaper before the file exists.
2. **Ask what the bean is ABOUT, not what you were doing when you wrote it.**
   A visualiser whose blocker is an unrecorded ingest relation is an ingest
   bean. A sticky's art is a rendering bean. The topic that makes the work hard
   is usually the right epic.
3. **When two epics both fit, pick the one whose OTHER children you would want
   read alongside it**, and say in the body why the other was not chosen — a
   parent is a claim about where somebody should go looking.

### This conflicts with "every session is a Bean", and the conflict is real

Core Directive 1 above says to create a session milestone and parent children
to it. That is filing by SESSION; the repository is organised by SUBJECT, in
thematic epics that outlive any session. **Where they disagree, file by
subject** — a session bean is a useful record of what one sitting did, and it
is not where the next person looks for the work. If you keep a session
milestone, it is a sibling record, not the parent of topical work.

## A GOAL is a `milestone` bean, and an epic joins one by parenting to it

**Measured 2026-09-20, bean `wqht`.** The owner had stated three goals in chat.
The store held **13 in-progress epics and 0 milestones**, with the `milestone`
type configured and unused. No epic carried a goal's words, so classifying 140
open items against those goals was a judgement made from scratch — and it would
have been made from scratch again at the next review, differently.

Nothing in this skill or in `session-intent` said where a goal LIVES. Both
describe a "goal-scoped" queue, and a queue scoped to an object that does not
exist cannot be a query; it can only be a re-derivation. The owner chose,
2026-09-20:

> **A goal is a `milestone` bean, in the owner's own words, and the epics
> serving it are parented to it.**

```sh
beans create "<the goal, verbatim>" --type milestone   # after the existence check above
beans update <epic-id> --parent <milestone-id>
```

Three properties make this the cheap answer rather than a new mechanism:

- **The type already exists** and `check-bean-parents` already permits an epic
  under a milestone, so nothing had to be built.
- **`beans roadmap` groups by `parent:`**, so the goals become the roadmap's
  top level the moment the epics are parented — which is what a roadmap was
  always for.
- **"Prioritise against the goals" becomes a query**: walk down from the
  milestone. An item under no goal is then *visible* as such, which is itself
  the finding a review wants.

**Verbatim, and this is not a style note.** A goal is the owner's sentence, and
a tidied paraphrase is a different claim that nobody agreed to — the same rule
[`confirmation-waiver`](confirmation-waiver.md) applies to a waiver's `quote`,
and for the same reason: the reader auditing the classification has only that
string to check it against. **If you do not have the owner's words, you do not
have the goal** — record the paraphrase as a paraphrase, say so, and ask.

**This does not conflict with filing by subject** (§"WHICH parent"). A
milestone sits ABOVE the epics; a bean is still parented to the epic whose
subject it is, and the epic is parented to the goal it serves. Two levels, one
criterion at each.

---

## After you create — parent it, and re-run the guard before you push

`check-bean-parents` fails on an **open bean with no `parent`**, because such a
bean lands in the roadmap's Miscellaneous section where nobody looks for it. The
guard works. The way it gets past you is procedural, and it happened **twice in
one session** on 2026-09-20:

1. **A multi-flag `beans update` can apply only some of its flags.**
   `beans update <id> -s in-progress --parent <epic>` set the status, silently
   left the parent unset, and **reported success**. As two calls it worked. So
   after setting several properties at once, **read the front matter back** —
   `grep -n "^status:\|^parent:\|^priority:" beans/defs/<file>.md` — rather than
   trusting the "Updated …" line.

2. **A bean created after your last test run is an unguarded bean.** The second
   occurrence was not the CLI at all: the bean was minted, its body written and
   its priority set *after* `bun test` had passed, and the push went out on that
   stale green. CI caught it, which cost a cycle for a one-line fix.

**So: `beans create` and the `--parent` that follows it are one action, and
touching the bean store invalidates your last test run.** Re-run at least
`bun test cat-harness/scripts/tests/check-bean-parents.test.ts` — 105 ms —
before pushing.

The general shape is worth more than the bean case: **a green suite is green for
the tree you ran it against.** Anything added afterwards, including an artefact
that is "just a note", is untested. This is the cheap end of the same discipline
`continual-progress` states about verifying rendered work rather than describing
it.

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

## Check before you WORK — a checkbox is a claim, not a measurement (STRICT)

`beans create` is not idempotent, and §"Check before you create" above is the
guard. This is its twin at the other end: **a bean's stated state is a claim
somebody wrote down once, and the code has moved since.**

> **Re-measure a bean's open items against the code before you act on them.**

The cost is not wasted effort. It is *acting on a stale claim*, and twice in
one session (2026-09-20) that came within a single edit of re-introducing a
defect a test had been written to catch.

### Measured, one session, four beans

| bean | what the file said | what was true |
|---|---|---|
| `sa8y` | four items open | one open; two done, one a **deliberate** decision |
| `vo9d` | five items open | one open; four done by siblings |
| `30hn` | 16 of 33 undeclared | 14 of 41 — and the mover was **this session** |
| `koth` / `b11x` | two beans | one defect, filed **3m53s apart** |

### The two failures this prevents, and they are different

**1. Doing work that exists.** The cheap one. `vo9d`'s four items were done by
`11d43ce4fb` and `ca5ec3e373`, neither of which ticked a box.

**2. Undoing a decision that was recorded elsewhere.** The expensive one.
`sa8y`'s *"the three unbound lanes get roles"* reads like a gap. The roles
exist; what is missing is `lanes`, and its absence is deliberate —
`bootstrap/scenarios/roles.json` carries a `_lanes_comment` explaining that
binding them mints three dangling links in the root's graph, with bean `pve3`
owning the question. **Doing the obvious thing would have re-created the exact
shape of the wrong fix `sa8y` exists to record.**

The decision was never in the bean. It was in the file the bean is about.

### What "re-measure" means, concretely

- **Run the thing.** `sa8y`'s headline finding was fixed hours earlier;
  `kg:audit` says so in one command.
- **Read the body, not just the boxes.** `vo9d` describes a Tool node its own
  checkbox still shows unticked.
- **Date it.** `git log -S` on the symbol or the file against the bean's
  `created_at` separates *fixed since* from *wrong when written* — and `vo9d`
  was the second: it listed `check-l1-complete.ts` as having no callers when
  `ingest-document.ts` had imported from it 32 minutes earlier.
- **Read the file the bean is about**, for a comment saying why it is the way
  it is. That is where a deliberate absence lives.

### And a bean you re-measure, you record

Leave what you found in the bean, with the commits and the times — a stale
checkbox you silently worked around is one the next agent meets unchanged.
Tick what is done and name who did it; withdraw a done-when you no longer
believe, with reasons, rather than leaving it unmet. Where the bean and the
code disagree, **the code is what is true and the bean is what is wrong** —
the same rule [`AGENTS.md`'s banner](../../../AGENTS.md) states for a skill
against that file.

This is the work-plan half. The cross-session half — why two sessions can file
one defect four minutes apart — is
[`bean-coordination`](bean-coordination.md) §"A claim is branch-local".

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
- To add notes or discussion: `beans update <id> --body-append "Your note"`,
  or `--body-append -` with a heredoc when it runs to paragraphs. **Never
  `--body-file`** — it replaces the whole body, silently, exit 0:
  §"Check before you UPDATE".

## Archiving — two dispositions, and they answer different questions

`beans archive` moves every `completed` or `scrapped` bean out of the working
set. It **moves**, never deletes: an archived bean is still resolvable by id,
which is what makes it a disposal an agent may perform at all
([`deletion-requires-confirmation`](deletion-requires-confirmation.md)).

**There are two ways it can be driven, they are not alternatives, and a
process author needs to know which one they are reaching for.** Owner,
2026-09-20: *"outline both options and why used for. that is part of the
skills to explain in context of larger process."*

| | **a per-activity op** | **a periodic sweep** |
|---|---|---|
| what it is | a step inside one process — a fourth `<folio:bean op>` beside `claim`, `note`, `resolve` | a scheduled run over the whole store |
| the question it answers | *is **this item's** work over?* | *is **the store** still readable?* |
| what decides | the process reaching a step that means completion | a uniform, process-independent criterion — `completed` or `scrapped` |
| what the archive then records | **why** — "archived because the release shipped" | **when** — "archived in the sweep of that date" |
| what it cannot do | reach a bean no process resolved | know that *this* release is what terminated *this* item |

### Why neither replaces the other

**The op cannot cover the store.** A bean resolved by a process with no
archive step, by hand, or by a sibling session, is never reached. Coverage
depends on every path having been drawn, and paths are added faster than they
are wired.

**The sweep cannot carry authority.** It knows only status. It cannot say
that a requirement was archived *because the stakeholder signed off*, which
is the fact an audit of the CRDM close would want — and `crdm-close.bpmn` is
precisely where that authority exists.

So the honest shape is: **the sweep is the floor, the op is the exception.**
The sweep guarantees the store stays readable whatever anyone forgot; an op
is worth adding only where a process's completion is *itself* the reason, and
recording that reason is worth the extra edge on the diagram.

### Where this sits against `resolve` — two layers, not two spellings

`resolve` is the **process** saying *"I am done with this item."* Archiving
is the **store** saying *"this is no longer in the working set."* They are
different layers and they are allowed to be far apart in time — which is why
`resolve` must never imply an archive.

That gap is exactly what produced the backlog. Measured 2026-09-20: every
process that touches the work plan reaches `resolve` and stops —
`draft-to-publication` (claim → note → resolve), `crdm-close` (resolve),
`code-change-review` (claim → resolve). `resolve` sets `completed`, and
`completed` is what `beans archive` moves. Each of them manufactured the
condition; none discharged it; **219 beans** accumulated until the owner
asked for the sweep by hand.

**Neither disposition is built yet**, and the first question is which —
bean `folio-assistant-m8gz`, analysis in
`cat-harness/docs/proposals/bean-archiving-in-bpmn.md`. Until then archiving is the
owner's word and `beans archive`, run deliberately. Note the CLI prints
`.beans/archive/` but honours `path:` from `.beans.yml`; here that means
`beans/defs/archive/`.

## Status Display Format

When the user asks "status" or "show beans", run `beans list` and display the hierarchy:

```
## Session Beans
- [epic-123] Session: <branch-name> (in-progress)
  - [task-124] Task A (completed)
  - [task-125] Task B (in-progress)
  - [task-126] Task C (todo)
```

## Coordination discipline

These four were carried only by `.claude/skills/local/todo-manager.md` until
2026-09-19 — a copy that `skill_fetch` does not serve — so an agent asking for
this skill by name never received them. Ported here as part of bean `tdmg`.

1. **Claim before you work.** Mark the bean `in-progress` so sibling sessions
   working the same goal do not duplicate the effort — and know what that buys
   you. The claim lives on YOUR branch, so it is invisible on `origin/main`
   until your PR exists; it announces the item is taken, it does not reserve it.
   So also `git fetch origin main` and check the open PR list for the bean id
   before you start. Two sessions claimed one bean 61 seconds apart on
   2026-09-19 and shipped two PRs for it. Full rule:
   [`bean-coordination.md` §"A claim is branch-local"](bean-coordination.md).
   **Brief it in the same turn you claim it** —
   [`opening-brief.md`](opening-brief.md). The claim tells a sibling the item is
   taken; the brief tells them, and the author, what it is being taken *for*.
2. **One source of truth per concern.** Do not fork a bean into a parallel
   `todos/*.json` queue; link to the queue from the bean instead.
3. **Move wiring and script together.** When relocating a hook-backed script,
   move its hook reference in the same change — a script without its wiring, or
   a hook reference without its script, is the migration failure mode that left
   dangling references behind (`docs/folio-assistant-migration.md` §2).
4. **Close on landing.** When the work lands, close the tracking bean and update
   any cross-repo ownership note.

## Relationship to other surfaces

- [`bean-coordination.md`](bean-coordination.md) — the cross-session claim and
  handoff lifecycle, and why a claim is not a lock.
- [`bean-blocking.md`](bean-blocking.md) — a real block carries what it waits
  on, since when, an expiry and a handoff.
- `scripts/session-start-coord-sweep.sh` — the CLI-independent session-start
  surface: fetches `origin/main` and summarises sibling branch activity. Works
  even when the `beans` CLI is absent.
- `scripts/install-beans.sh` — provisions the CLI.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a document](../../processes/authoring-a-document.html) | 2 · Seed the work plan |
| [Authoring a paper](../../processes/authoring-a-paper.html) | 2 · Seed the work plan |
| [Agent bean lifecycle](../../processes/bean-lifecycle.html) | Check before you create (exact-title search); Create the bean (agent CLI, not an engine op); Work, keeping the body current (this is 'edit'); Complete (no unchecked todos left); Scrap with reasons NEVER delete |
| [Code change and review](../../processes/code-change-review.html) | Record what was done, and close |
| [Content Change and Review](../../processes/content-change-review.html) | Open the branch-watch bean; Note the main-branch watch |
| [Content lifecycle](../../processes/content-lifecycle.html) | Seed the work plan; File feedback as beans |
| [CRDM Phase 5 — beans and sign-off](../../processes/crdm-signoff.html) | Phase 5: Create beans |
| [Document ingestion — uploads/ to the L1 source knowledge graph](../../processes/document-ingestion.html) | Record the gap as a bean |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Open or claim the release bean; Open beans for the change requests; Close the release beans |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Claim or open the bean; Log findings on the bean; Resolve or re-open the bean |
| [Evidence for a recommendation](../../processes/evidence-retrieval.html) | Open a bean for the unverified citation; Record the evidence gap |
| [Getting started](../../processes/getting-started.html) | Seed the work plan |
| [Incremental IG build](../../processes/ig-incremental-build.html) | Log the environment error on the bean; Log findings on the bean; File QC findings as beans |
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Seed the work plan |
| [L3 FHIR IG pipeline](../../processes/l3-fhir-pipeline.html) | File QC findings as beans |


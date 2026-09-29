---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: '/continual-progress'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/continual-progress.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/continual-progress.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/continual-progress.md){: .fa-edit-source }

{% raw %}
# /continual-progress — trackable, always-PR'd, continually-committed work

Sibling agents and the author can only coordinate with work they can
*see*. This skill makes every in-flight task **trackable in real time**:
the PR is open from the first commit, progress lands as a stream of
small pushed commits, and the PR body carries a live status checklist.
It is the visibility complement to [`/coordinate`](coordinate.md) (which
triages *across* PRs); this one governs how *your own* PR stays legible
while you work.

## The four invariants

1. **Always have an open PR (from commit #1).** Branch, make the first
   (even stub) commit, push, open the PR — *before* further work. The PR
   is the durable, visible artifact; the chat session is ephemeral. Never
   accumulate work on a local branch with no PR. **Never ask permission to
   open one** — branch, commit, push and PR are all pre-authorised.

2. **Commit + push small, coherent increments — continuously.** Each
   logically distinct change is its own commit (a single fix, a single
   module, a single unit of work). Push after each commit (or every 2–3 if
   moving fast). A watcher should be able to `git log` your branch and
   see a legible, bisectable trail — not one giant drop. Target: no more
   than ~20–30 min of work between pushes on a long task.

3. **Keep a live status checklist in the PR body.** Maintain a
   `- [ ] / - [x]` checklist of the task's sub-parts in the PR
   description (or a pinned top comment), updated as each increment
   lands. A sibling or the author should be able to read the PR body and
   know exactly what is **done / in-flight / remaining** — without
   reading the diff or asking in chat.

4. **Post brief intent — on your PR and overlapping siblings.** One short
   intent line on PR-open ("doing X on `<files>`; will touch `<scope>`");
   a one-line comment on any sibling whose scope overlaps ("starting
   `<theme>` on `<files>`; flag conflicts"). Don't *stream* comments —
   update the checklist (invariant 3) for routine progress; comment only
   for genuine coordination (overlap, a blocker, a handoff-relevant
   finding). Defer to [`/coordinate`](coordinate.md) for the full
   cross-PR triage protocol.

## The fifth invariant, and the one agents get wrong

5. **Do not hold a green change proposal back waiting for someone to look at
   it.** This is the rule that gets inverted in the name of care, and inverting
   it is not caution — it is a blocked reviewer.

An agent that has just built something it cannot fully verify — a rendered page,
a diagram, a UI — reaches for the responsible-sounding move: leave it open,
attach a preview, ask the human to confirm first. That feels safer. It is worse,
for a reason worth internalising:

> **A human cannot assess a rendered artefact from a description of it, and a
> preview pasted into chat is a strictly worse proxy than the deployed thing.**

Holding the merge does not transfer the verification to them — it *withholds the
only form in which they could do it*, and asks them to adjudicate from a
screenshot.

Measured, 2026-09-16. A documentation change with five generated diagrams was
green, unreviewed and unmerged, held back with three SVGs attached in chat and a
note that the layout was machine-accepted but not confirmed legible. The
author's reply was *"jsut merge so i can help assess"*. The hold made assessment
harder, not safer, and cost a round-trip to someone who types with difficulty.

### Link the PAGE, never the site root

**When you ask somebody to look at a rendered artefact, link the artefact.**
Not the site it is on, not the preview's front door — the exact URL of the
thing you changed.

Owner, 2026-09-21, after a session that had pointed three times at
`…/STAGING/<branch>/` while asking about the navbar on the IRIS replica:

> *"next time give appropraite link
> https://litlfred.github.io/folio-assistant/STAGING/claude-determined-euler-gqhkk0/who-iris/"*

The root is not a shortcut, it is a handoff of the last step. It makes the
reader reconstruct a route the agent already knew, and it does it to the person
this repository's interaction profile exists for — one who types with
difficulty. Every extra click is a cost the agent chose not to pay and passed
on.

It also hides a real failure mode. An agent that links the root has not checked
that its page is reachable at all: `/who-iris/` 404ed for an hour in that same
session, under a root that loaded perfectly.

So:

- **One link per thing to look at.** Two changed pages is two links, each
  labelled with what to look for on it — not one root and a sentence of
  navigation.
- **Deep-link past the index.** If the change is on
  `/docs/who-iris/kg-to-portal.html`, that is the URL, not `/docs/who-iris/`.
- **Compose it from the preview's own base**, which the staging comment
  states. Never from memory: a branch slug is exactly the kind of string that
  is almost right.
- **The root is the right link for precisely one thing** — a change to the
  landing page itself.

This is the same rule as the invariant above, one step further on. A human
cannot assess a rendered artefact from a description of it; they also cannot
assess it from a link to somewhere near it.

### What to do with the thing you could not verify

**Say it in the body, and merge anyway.** `## Not verified` is a real section
and an honest one; an unmerged proposal is not a substitute for it.
Reversibility is what makes this safe — a docs or content change is one revert
away, and the cost of reverting is far below the cost of a human blocked on a
decision they have no artefact for.

### A pipe discards the exit code — so a piped run cannot verify anything

**`cmd | tail` makes `$?` the status of `tail`.** Every claim that a command
PASSED must come from a run without a pipe, or from `${PIPESTATUS[0]}`.

This is mechanical rather than a matter of care, and it is written down because
care did not prevent it. Twice in one session, 2026-09-20:

- `gen-site-jsonld --check` on a genuinely stale tree. `… | tail -8; echo $?`
  printed **0**. Caught within the minute — and the commit message that fixed
  it said "worth checking rather than assuming".
- `site:links` from the repository root, two hours later. Read the message,
  never checked `$?`, and **opened a bean** asserting a defect that does not
  exist: the script exits 2 and always has. Scrapped as `ipth`.

The second is the expensive shape. A command whose output *sounds* like a
failure, run through a pipe, reads as a silent pass — and a silent pass is
precisely what this repository treats as worse than a loud failure. The first
cost a minute; the second cost a bean, a wrong diagnosis, and very nearly a
"fix" to working code.

**So: when the question is "did this pass", run it bare.** When you want both
the output and the verdict, run it twice or capture the status first. Reading a
verdict off prose you piped is the same error as quoting a count from prose.

### A template is not a page — verify the BUILD, not the source of it

The invariant above says a **human** cannot assess a rendered artefact from a
description of it. This is its twin, and it is the one an agent breaks:

> **An agent cannot assess a rendered artefact from the template that generates
> it.** A correct template and a correct page are different claims, and only the
> second is what a reader loads.

Measured, 2026-09-20, and it is worth the detail because every safeguard fired
green. `docs/_includes/landing.html` builds a sticky's `<article>` opening tag
across many lines. One Liquid `{% endif -%}` right-stripped the newline before
the next attribute, so the tag emitted as

```
…--fa-text-scale:0.74;"aria-labelledby="fa-sticky-cat-harness-summary"
```

Two attributes with no separator is an unparseable tag. `index.md` is
**markdown**, so Kramdown stopped recognising the block as HTML and escaped all
of it. The published landing page — the live site and every staging preview —
carried `&lt;article class="fa-sticky …"` as **visible words**, with
`&lt;/article&gt;` to match: 3 escaped, 0 real. Every `.fa-landing-sticky--fixed`
rule was dead, which was the whole feature.

What passed over it: 3517 unit tests, `eslint`, `tsc`, twelve gates, the e2e
suite **and** the accessibility suite. Not one of them was wrong. Every one reads
a **source**, and the source was valid HTML — the defect exists only in the
output of the markdown converter. The agent had rendered and screenshotted the
template through a scratch harness and called the round verified.

So the rule is mechanical, not a matter of diligence:

- **When the artefact is a built page, the evidence is the built page.** Build
  the site and read the output. Reading the template proves the template.
- **A screenshot of a scratch render is not a screenshot of the build.** If the
  real build cannot run locally (here the `just-the-docs` remote theme 403s
  through the agent proxy), stub the *theme* and build anyway — a pass-through
  `_layouts/default.html` is enough to see what Kramdown did. Stub the part that
  cannot run; never substitute the part under test.
- **State which one you looked at.** "Rendered and checked" is ambiguous between
  the two, and the ambiguity is where this hid.

The general form of the gap now has a check — `check:escaped-markup`, run in
`docs-site.yml` against the assembled `_site/`, because that is the only place
the answer exists. But a check written after the fact does not retire the rule:
the next defect of this shape will be in whatever the build does that no source
gate can see.

### The exceptions, and none of them is "I am unsure"

- **Never merge red.** A failing or unrun required check is a real blocker.
- **Never merge over an unresolved review thread** you have not answered.
- **Where the repository requires explicit merge permission, that wins**, and
  nothing here relaxes it by a word. Some folios require an explicit "merge it"
  from the author for *every* merge to the default branch. There the rule reads:
  get it green, get it mergeable, **say once that it is ready**, then stop — do
  not re-ask on a timer, and **do not let "not merged yet" become a reason to
  stop pushing.**

### Two green PRs can merge into a red main, and the answer is to fix forward

A PR is tested against the main it last merged, not the main it lands on.
Two PRs that are each green can still combine into a failure that neither
branch contained. On 2026-09-24 that happened: #1245 added a generated
report, and main had just gained a workflow instance the report did not
cover. Main went red at #1245's merge, and no `regen` on either branch could
have seen it (bean `391j`).

**The owner's policy is to fix forward, not to add a merge queue or an
"up to date" requirement** (2026-09-24). So:

- **Watch main's CI after every merge you make**, not only your PR's.
  "My PR was green" does not mean main is green.
- **A red main whose failure your diff did not cause is still yours to fix
  when you find it.** Establish the cause from the failing run and each
  parent's history first, then regenerate or repair in a small PR of its own,
  and merge it as soon as it is green. #1249 and #1257 each did this within
  minutes.
- **Do not blame the last merge because it is the last merge.** Check whether
  the parent was already red. In `391j` it was, and the first diagnosis ("a
  blind spot in `regen`") was wrong for exactly that reason.

## Why — the failure modes this prevents

- **Stepped-on work.** A branch that hoards uncommitted work collides
  with siblings the moment it lands. Continual push surfaces intent from
  minute 1 so siblings triage *around* it.
- **Lost work on session reclaim.** Cloud sessions are ephemeral; an
  uncommitted change vanishes when the container is reclaimed. Push it.
- **Opaque progress.** "What's the status?" should be answerable from the
  PR body, not a chat scrollback. The checklist is the source of truth.
- **Un-takeoverable tasks.** If you go idle/blocked, a sibling can pick up
  a continually-committed, checklist-annotated PR; they cannot pick up an
  opaque local branch.

## Checklist (run this as you work)

- [ ] PR open? If not: branch → stub commit → push → open it **now**.
- [ ] Anything uncommitted older than ~20–30 min? Commit + push it.
- [ ] Does the PR-body status checklist reflect the current state?
- [ ] Any sibling whose files I just started touching un-notified? One
      intent line (not a stream).
- [ ] Blocked or going idle? Update the checklist + a one-line
      "blocked on X / handoff-ready" note so a sibling can continue.

## Relationship to other skills

- [`/coordinate`](coordinate.md) — cross-PR triage (scope map, sibling
  intent, cherry-picks, ledger). `continual-progress` keeps *your* PR
  legible so `/coordinate` (yours or a sibling's) has something to triage.
- **A folio's own `AGENTS.md`** may carry these rules for that repository, and
  a stricter merge gate — `litlfred/qou` §"Branch + PR workflow" is the worked
  case. This skill is the platform-side statement; where a folio is stricter,
  the folio wins.
- [`/todo-manager`](todo-manager.md) — the session work-plan; the
  PR-body status checklist (invariant 3) is its externally-visible
  projection, so a watcher needs no access to the session's bean queue.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Actor and role administration](../../processes/actor-role-administration.html) | Branch, gates, PR and review (calls a sub-process) |
| [Code change and review](../../processes/code-change-review.html) | Make the change; Commit, push, open the PR |
| [KG to public portal](../../processes/kg-to-portal.html) | Human eyes on the rendered artefact |


---
layout: default
title: 'Flushable containers'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/flushable-containers.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/flushable-containers.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/flushable-containers.md){: .fa-edit-source }

{% raw %}
# Flushable containers

**A flushable container is a named store whose whole point is that it keeps
things.** A trash you can recover from, a review preview somebody has not looked
at yet, a console log you read back after a failure. The accumulation is the
feature, which is why none of them can be solved by simply not writing.

Three exist or are being built, and they are the reason this skill is general
rather than three copies of one rule:

| container | what it holds | "flush" means |
|---|---|---|
| `fsh-guts` | deprecated pages, scripts, proposals — *"the trashcan that is kept"* | a **real, irreversible** delete. It is the last stop |
| staging previews | one built site per open branch, under `STAGING/<slug>/` on the publish branch | removal from the publish branch — **recoverable** by re-running Feature Staging |
| console log | what a run printed | truncation |

## Three actions, and they are not three wrappers on one

Each answers a different question, and a container that offers only one of them
is missing capability rather than keeping things simple.

1. **Flush all** — *"I do not need any of this."* One decision, whole container.
   The cheapest to build and the easiest to regret, so it is the one that most
   needs the confirmation rule below.
2. **Trim to limit** — *"keep what fits."* Mechanical, and it needs two things
   the container must declare: a **total order** and **which end is
   expendable**. See below — that end is not always the same.
3. **Select to prune** — *"I need to look first."* The only action that can
   spare an item a rule would have taken, which is exactly why it cannot be
   dropped as redundant. A rule that is right 95 % of the time still needs a
   way to be overruled on the other 5 %, and `select` is that way.

## The expendable end is declared, not assumed

**Trim-to-limit on previews and trim-to-limit on a console log discard opposite
ends, and this is the specialisation most likely to be got wrong.**

- A **preview** is most useful when newest. The oldest is the one nobody is
  reviewing any more, so trimming drops the oldest.
- A **console log** is often most useful at its *oldest* retained line, because
  the first error is the cause and everything after it is consequence. Dropping
  the oldest to make room is how a log keeps 10,000 lines of cascade and throws
  away the one line that explained it.

So a container declares which end trim takes. A shared `trim` that assumes
"drop oldest" is correct for two of the three cases here and silently wrong for
the third, and wrong in the direction that destroys the evidence.

## The badge has three states, and the third is not "fine"

Over-full is a **declared** state and gets a badge — **including the trash.** A
container you can recover from is the one whose size a reader stops thinking
about, so `fsh-guts` is the one that most needs the badge rather than the one
that needs it least: nothing else in the interface says it has grown, and the
whole premise of keeping deleted things is that nobody is watching them.

So does under. And so does **could not determine** — a container whose size could not be read is not under
its limit, it is unmeasured, and rendering that as under is the defect this
repository has paid for repeatedly (`check-ci-health`, `readme-sections`, the
staging size check: *"'Could not read gh-pages' is never '0 MB of previews'"*).

A badge that shows a number it could not obtain is worse than no badge, because
a reader acts on it.

## Never flush without explicit confirmation

This inherits
[`deletion-requires-confirmation.md`](deletion-requires-confirmation.md) whole:
an agent never removes a durable artefact on its own initiative, it reports what
would go — **with sizes and ages** — and waits to be told.

Two container-specific sharpenings:

- **`fsh-guts` is the strictest case in the system**, because it is where
  deletes already went. `AGENTS.md` makes "delete" mean "relocate to
  `fsh-guts`", which is what makes deletion reversible everywhere else —
  flushing `fsh-guts` is therefore the *only* truly irreversible delete, and the one
  confirmation that cannot be inferred from context.
- **Recoverability changes the bar, and it is the container's job to say so.** A
  staging preview is regenerable by re-running Feature Staging, so confirming
  its removal is a smaller decision than confirming a `fsh-guts` flush. A
  container that does not declare its recoverability forces every flush to be
  treated as the worst case, which is how a useful action becomes one nobody
  dares run.

## Liveness gates the prune, and "cannot tell" spares the item

An item can look dead and be live. Measured 2026-09-19 (bean `w2g5`): the
staging orphan check called a preview abandoned because its branch had no open
PR, when the branch had been committed to **two minutes earlier** by a session
that reuses one branch across a run of PRs. "No open PR" was read as a synonym
for "abandoned" and it is not.

So a container declares its liveness signals, a prune candidate must fail
**every** one, and a signal that could not be evaluated **spares** the item
rather than condemning it. For previews those signals are `open-pr`,
`unmerged-branch` and `recent-commit` (30 minutes — the shortness is the point).

## A limit below the floor is not a limit, it is a permanent alarm

**Measured 2026-09-19, and this is the finding that motivated the skill.**
`STAGING_WARN_BYTES` is 100 MB, on the owner's instruction and a tenth of
GitHub's 1 GB Pages budget. A single preview is **~38 MB**, so the limit holds
**2.6 previews**. On that day the publish branch carried **9** previews totalling
**346 MB**, of which — by the liveness rule above — exactly **2** were prunable,
freeing 76.7 MB and leaving **269 MB**, still 2.7× the limit.

Seven live previews × 38 MB is a **266 MB floor** that no amount of pruning can
go under while those sessions are working. A limit beneath its own floor cannot
be satisfied, so it fires constantly — and a signal that always fires is the
`xom7` defect, where a workflow failed 30 times and the failure became invisible
*because* it was constant.

**So the lever is the wrong one.** Pruning harder cannot fix a 266 MB floor; a
38 MB preview can. A per-container limit needs a basis that states its floor —
concurrent users × item size — and when the floor exceeds the limit, the finding
is about **item size or the limit**, never about pruning more aggressively.

**And when you look at item size, look for duplication before you look at
content.** In this case 27.5 MB of each 37.5 MB preview was HTML, and **zero**
HTML blobs were shared between two previews — because each is built with an
absolute `baseurl` of `/…/STAGING/<slug>`, so the slug appears on 75 lines of
every page and git's content-hash deduplication has nothing to hold on to. Nine
previews stored nine copies of a site identical apart from its own address. The
9× was in the addressing, not the docs, and no pruning policy could have found
it — which is the general point: **a container that is over its limit is a
question about the container, and "prune more" is the one answer that never
asks it.**

**But "make the references relative" is not the fix, and the owner caught this.**
A reference is either an **address** or a **name**, and only addresses may be
relativized. A stylesheet href is an address; a JSON-LD `@id` or a JSON Schema
`$ref` is a name, and a relative one resolves against the *retrieval* URL — so
the graph's identities become a function of how the file was fetched, and an
out-of-band validator has no base at all. Deduplication is worth having; it is
not worth buying with identity. The 5205 identity references in that corpus were
left byte-for-byte alone, which is why the projection landed at ~77 MB rather
than one copy: **the exports are a real floor, not a duplication artefact.**

That is the rule's second application in one investigation. The first "prune
more" was hiding a 9× duplication; a second one would hide a genuine floor —
and a genuine floor is answered by a limit whose **basis states it**, never by a
policy. Worked out in bean `xxku`.

## Adding a container

Declare, do not infer:

- **what it holds**, and whether the contents are recoverable and how;
- its **limit**, with a basis that names the floor;
- the **order** and **which end trim takes**;
- its **liveness signals**, and that an unevaluable signal spares;
- which of the three actions it offers, and what each does specifically.

## Not built yet

The **viewer** — a counter, an over-full badge and a select dialog — is bean
`7vhe`, deliberately separate: it is UI with different constraints, and `gjli`
makes accessibility a standing rule, which a select dialog is the control most
often shipped without. The **staging** mechanism is its own work (`w2g5`): a
preflight plus a dispatchable cleanup path, because the label-based remedy was
unreachable for exactly the previews the check can find. This skill is the
concept those two implement, not a third implementation of it.
{% endraw %}

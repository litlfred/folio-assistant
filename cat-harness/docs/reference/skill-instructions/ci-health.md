---
layout: default
title: 'CI health'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/ci-health.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/ci-health.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/ci-health.md){: .fa-edit-source }

{% raw %}
# CI health — a red workflow looks exactly like a green one from in here

**A workflow's outcome is invisible from the working tree.** Nothing in a
checkout says whether the last run passed, so a workflow can fire on every push
and fail every time while the repository reads as healthy.

Measured here: one publishing workflow fired on every push to the default branch
and **failed all 30 times over two months**. The trigger was fine; the outcome
was unobserved, the published site sat stale, and nothing in the repository said
so.

## Read the report, and read it by these three rules

`check:ci-health` reports each workflow's state on the **default branch** —
consecutive failures, days since the last green, and whether it has run at all
recently. The session-start sweep prints it, so it lands where you already look.

1. **"Could not check" is never rendered as green.** A watchdog that has gone
   blind must not read as good news.
2. **A red that has not re-run in a week is *possibly stale*, not an active
   fire.** The distinction is what stops a dead workflow consuming attention a
   live one needs.
3. **A red whose workflow file changed *after* the failing run is
   `superseded`.** The version that failed is gone, so the verdict is stale.
   `superseded` is never rendered as green and never counted as a live failure:
   a later edit is evidence the failing version is gone, **not** evidence the
   new one works.

That third rule is not hypothetical. Two workflows here failed to *parse* on one
day — which is why the platform ran them on `push` despite both being
dispatch-only, and why their runs are named by path rather than by their
declared name. They were fixed the next day, and they only run on dispatch, so
nothing will ever run them on the default branch again. Without the rule they
are red forever.

**Do not "fix" a dispatch-only workflow by dispatching it.** Some fail by design
in the repository you are standing in — a folio-shaped job preflighting on a
manifest the platform does not carry, or a computation step needing a directory
only a folio has. A red you caused by running something that was never meant to
run here is worse than the stale verdict you were trying to clear.

## The report answers about the default branch — and Pages is not on it

**A Pages build outcome is not repository state.** It is a fact GitHub holds
*about* the repository, and it changes the repository's status without changing
a single byte of it. That is the owner's framing, 2026-09-20, and it settles
how the tool must behave: **look external, cache nothing.** A committed answer
would be right when it was written and silently wrong from then on, which is
the original defect rebuilt in a new place.

The default-branch query cannot see it, for three reasons at once, and all
three have to be answered together:

| property | why the default-branch query misses it |
|---|---|
| runs on the **publish** branch | `?branch=<default>` excludes them outright |
| raised by `github-pages[bot]`, event `dynamic` | there is no file in `.github/workflows/` to be a row about |
| its workflow has **no file** | it is addressable only by a per-repository id |

Measured here on one day: the default-branch page held **zero** deployments
while the publish branch held **51 cancelled and 49 succeeded**, of which
**25** were self-inflicted. None of it was visible from anywhere.

### Two more, for the question the three above do not cover

Deliberately **not** numbered 4 and 5: the three rules are the three rules, for
reading the default-branch report, and they are quoted by that count in several
places. These are a separate pair for a separate question — which is itself the
rule about never letting a count in prose go stale.

- **`cancelled` is a THIRD state.** A cancelled deployment neither shipped nor
  broke: the previous preview stays up, so the site is *stale* rather than
  down, and nobody is owed a fix. Folded into success the report says the
  preview shipped; folded into failure it sends somebody after a build that was
  merely superseded. Both readings are wrong in a way the reader cannot detect
  — which is rule 1 again, wearing different clothes.
- **Say WHOSE contention it is.** One workflow pushing twice and cancelling its
  own build is a fixed defect; several sessions racing for the publish ref is a
  different, open one. A merged cancellation count cannot show whether the
  first fix held — so the self-inflicted ones are named **by slug**, and a slug
  still appearing is a branch running the workflow from before the fix.

### Report the counts; grade only a floor

There is no calibrated threshold for "too many cancellations", so the report
states the numbers and **does not grade the share** — no percentage, no verdict
word. That is the same refusal that stopped a PDF heuristic inventing a size
threshold with nothing to calibrate against.

One statement *is* graded, because it is a **floor** rather than a threshold:
deployments happened and **not one succeeded**. That needs no calibration, the
way "the build directory is empty" needs none.

## A report is only read by someone in the room

This is the part that gets designed wrong. The session-start print covers every
day somebody is working — and **the failure being guarded against is a quiet
stretch with nobody looking, which is exactly the stretch in which no session
starts either.** A report alone cannot cover its own worst case.

So the watchdog has a second half: the same check runs on a schedule and
maintains **one** tracking issue, which is

- **opened** when the default branch has a live failure,
- **edited in place** while it persists — an edit does not notify, so a long
  outage stays one unread item rather than a stream,
- **closed automatically** when the branch is clean.

**It deliberately does not send another email.** The platform already sent 30
and the premise of the whole exercise is that nobody reads them. Live badges at
the top of the README are the same state at the front door.

Two properties of that scheduled run are load-bearing rather than incidental:

- **It needs full history.** The `superseded` rule asks when a workflow file
  last changed, and a shallow clone cannot answer — which would resurrect
  exactly the false fires the rule exists to retire.
- **On "could not check" it leaves the issue untouched and fails its own job**,
  rather than closing it. A watchdog reporting that it cannot see must not read
  as good news, and its own red is reported by the next scheduled run.

## The opposite defect

This covers a workflow that fires constantly and fails every time. The
complementary failure — a workflow that never fires at all — is not visible to
this check, because a workflow with no runs and a workflow with no failures look
identical in the run history. Both are "could not check", and the first rule
applies.
{% endraw %}

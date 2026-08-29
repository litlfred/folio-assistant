# ci-health-watcher — memory

Entry types: **STABLE** · **TRAP** · **BASELINE** (re-measure, never quote —
and here *everything* measured is a live signal that goes stale by design).
Seeded 2026-08-29 from `AGENTS.md`. Confirm entries as you use them.

---

## STABLE — the check and its three rules

`bun run check:ci-health` reports each workflow's state on the **default
branch**: consecutive failures, days since the last green, whether it has run
recently at all. The session-start sweep prints it, so it lands where you
already look.

1. **"Could not check" is never rendered as green.**
2. A red that has not re-run in a week is flagged **possibly stale**, not an
   active fire.
3. A red whose **workflow file changed after the failing run** is reported
   `superseded` — a later edit is evidence the failing version is gone, not
   evidence the new one works. Never green, never a live failure.

## STABLE — why the watchdog exists

`docs-site.yml` fired on every push to `main` and **failed all 30 times over
two months**. The trigger was fine; the *outcome* was invisible, so the
published site sat stale and nothing in the repo said so. Bean `xom7`.

**A report is only read by someone in the room.** The session-start sweep
covers every day somebody is working; the failure being guarded against is a
quiet stretch with nobody looking — which is exactly the stretch in which no
session starts either. So `.github/workflows/ci-health.yml` runs the same
check **weekly** and maintains **one** tracking issue labelled `ci-health`:
opened when the default branch has a live failure, **edited in place** while
it persists (an edit does not notify, so a long outage stays one unread
item), and closed automatically when `main` is clean. Bean `ynu8`.

It deliberately does **not** send another email. GitHub sent 30, and the
premise of `xom7` is that nobody reads them. The three live badges at the top
of `README.md` are the same state at the front door.

## TRAP — two workflows fail BY DESIGN here; do not "fix" them by dispatching

`witness-refresh.yml` and `qa-sweep.yml` failed to **parse** on 2026-08-07 —
which is why GitHub ran them on `push` despite both being
`workflow_dispatch`-only, and why their runs are named by path rather than by
`name:`. They were fixed the next day. They only run on dispatch and the
report only reads the default branch, so nothing will ever run them here
again. Bean `lq7e`.

Both would fail if you *did* dispatch them, because the platform carries no
folio: `qa-sweep` preflights on `content/package.json` and `witness-refresh`
needs `folio-assistant/computations/`.

Without rule 3 these two would be red forever. That is what rule 3 is for.

## STABLE — two load-bearing properties of `ci-health.yml`

Not incidental; do not simplify either away.

- **`fetch-depth: 0`.** The `superseded` rule asks `git log` when a workflow
  file last changed, and a shallow clone cannot answer — which would
  resurrect the false fires the rule exists to retire.
- **On "could not check" (exit 2) it leaves the tracking issue UNTOUCHED and
  fails the job**, rather than closing it. A watchdog going blind must not
  read as good news. A red `ci-health.yml` is itself reported by next week's
  run.

## STABLE — the complement

`ynu8` complements bean `5rfy`, which fixed workflows that never *fire*. This
is the opposite defect: one that fires constantly and fails every time. When
triaging, decide which of the two you are looking at first — the remedies are
unrelated.

## BASELINE — re-measure, always

Nothing about workflow state should ever be quoted from this file. Run
`bun run check:ci-health` and report what it returns today.

| what | command |
|---|---|
| per-workflow state on default branch | `bun run check:ci-health` |
| workflow trigger policy | `bun run check:workflow-policy` |
| the tracking issue | issues labelled `ci-health` |

---

## Session log

One line per check: what was red, which of the three rules applied, whether
it was a fire. Keep under ~200 lines — prune the log, never the TRAPs.

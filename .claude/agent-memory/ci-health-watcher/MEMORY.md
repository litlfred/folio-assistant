# ci-health-watcher — memory

**Edit `skills/memory/*.md`, not this file.** The region below is assembled by
`bun run agent-memory` and anything written into it by hand is overwritten;
everything outside it — the session log — is yours and is never touched.
Entry types: **STABLE** · **TRAP** · **BASELINE** (re-measure, never quote).

---

<!-- folio:memory:begin -->

## STABLE — re-measure, always

Nothing about workflow state should ever be quoted from this file. Run
`bun run check:ci-health` and report what it returns today.

| what | command |
|---|---|
| per-workflow state on default branch | `bun run check:ci-health` |
| workflow trigger policy | `bun run check:workflow-policy` |
| the tracking issue | issues labelled `ci-health` |

> Relabelled from BASELINE to STABLE, 2026-09-19. `AGENTS.md` defines a
> BASELINE as *"a measured number, stored with the command that produced it
> and the date"* — and this entry stores no number. It is a table of commands
> to RUN, which is the opposite thing: a stable fact about how to measure,
> not a measurement. `MemoryNodeSchema` refused it as a baseline, correctly.

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

## STABLE — the complement

`ynu8` complements bean `5rfy`, which fixed workflows that never *fire*. This
is the opposite defect: one that fires constantly and fails every time. When
triaging, decide which of the two you are looking at first — the remedies are
unrelated.

## STABLE — two load-bearing properties of `ci-health.yml`

Not incidental; do not simplify either away.

- **`fetch-depth: 0`.** The `superseded` rule asks `git log` when a workflow
  file last changed, and a shallow clone cannot answer — which would
  resurrect the false fires the rule exists to retire.
- **On "could not check" (exit 2) it leaves the tracking issue UNTOUCHED and
  fails the job**, rather than closing it. A watchdog going blind must not
  read as good news. A red `ci-health.yml` is itself reported by next week's
  run.

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

## TRAP — derive the gate list from the WORKFLOW, not from package.json

Three CI checks are invoked **by path**, not by npm-script name, so a sweep over
`bun run <script-name>` structurally cannot see them:
`gen-docs-pages.ts`, `gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`.
`gen-docs-pages` has no `package.json` alias at all.

> Measured `bun run scripts/gen-docs-pages.ts --check` on 2026-09-19 (bean
> `nup0`): 18 named gates, `tsc`, `eslint`, `bun test` and 60 Playwright tests
> all green, and `TypeScript — tests, lint, types (hard)` still red on 20 stale
> `test/results/witnesses/**/*.kg.json` projections.

Get the list from the workflow:
`grep -oE "bun run (scripts/[a-z-]+\.ts[^ ]*|[a-z:.-]+)" .github/workflows/code-quality-gates.yml | sort -u`

**Editing a script that WRITES a witness restales every published projection of
it.** `kg-audit.ts` records its own `scriptHash` in 220 `kg-qa` sidecars *and*
20 `test/results/witnesses/**/*.kg.json`. Regenerate both. Verify by parsing each side and
blanking the hash keys — these are single-line JSON, so `grep -v scriptHash`
filters nothing.

**`MEMORY.md` is generated** from `skills/memory/` by `bun run agent-memory`; a
TRAP written into it directly is deleted by the next run. Keep the total under
200 lines — past that the harness does not inject the entry at all.

## TRAP — never encode an unverified constraint — a rule that refuses a working setup is worse than no rule

Owner, 2026-09-19: **"dont encode rules against a working setup."**

A constraint in a schema, validator or gate is a **refusal**, and the two
ways it can be wrong are not symmetric. A *missing* constraint lets a bad
setup through, and it fails visibly at the point of use with the real error.
A *wrong* constraint refuses a good setup at the gate, with a confident
message asserting the thing is impossible — and nobody investigates a settled
question. Same asymmetry as rendering "could not check" as green.

So an **asserted but unverified** constraint is left OUT of the gate and
written down as an open question. Not encoded "provisionally".

**The test is the evidence, not the confidence.** Encode an entailment of the
mechanism (Pages has no per-file media-type config; air-gapped compute cannot
reach hosted inference) or something measured here with the command shown.
Do not encode "someone said so", or what was true of one account, one plan or
one version.

Worked case: `docs/proposals/deployment-topologies.md` §3 leaves
`private repo` × `github-pages` out of its incompatibility table — issue #363
states it as flatly unavailable, but GitHub has offered Pages on private
repos on paid plans and the account's entitlement was never checked.

Belongs in `platform-boundary-guard` too; not tagged there because that file
is at its 200-line injection budget and a 14th entry evicts three TRAPs.
Bean `folio-assistant-4kiw`.

## TRAP — never assert on a QA VERDICT from the published corpus

`test/results/witnesses/**` is live state. A test that reads a VERDICT out of it breaks
when somebody fixes or adjudicates the finding — which is the system working.

> Measured on 2026-09-19 (bean `tywj`): `tests/qa-panel.e2e.ts` pinned the first
> row to `voice-status-leak`/`fail`/`critical`, the fold count to `47` and the
> checker hash to `5af6856733f3`. An adjudication in `c8fbad385` turned that
> criterion `pass`; four assertions went red for reasons unrelated to the panel.

**Read the document live; flip the ONE criterion you test, BY ID, where it
sits.** The settled answer (#319) keeps only the script witness, so the hash the
spec asserts is still the corpus's own.

**Do not freeze a captured copy.** I tried it and withdrew it: freezing the
criterion freezes its witness, so the hash literal outlives the checker — the
same defect one field down. Reading the value out of a frozen document makes the
assertion self-consistent, not correct.

**Never hoist the failure to `criteria[0]`.** The generator already sorts
worst-first, so a panel that sorted nothing would pass.

`severity`, `evidence` and `changed` exist only in states the corpus is not in,
so no live sidecar vouches for them. Beans `tywj`, `qjyi`, `iumj`.

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

<!-- folio:memory:end -->

---

## Session log

One line per check: what was red, which of the three rules applied, whether
it was a fire. Keep under ~200 lines — prune the log, never the TRAPs.

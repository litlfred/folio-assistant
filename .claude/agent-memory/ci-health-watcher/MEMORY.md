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

More: `detail/re-measure-ci-health.md`

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

## TRAP — CI checks the MERGE of head into base, so a gate main added after your last merge is absent locally and `bun test -t` reports 0 fail

A `pull_request` check runs against the **merge of head into base**. A test
`main` gained *after* your last merge is in CI's tree and not in yours.

PR #403, 2026-09-19: CI ran **191** test files, the tree had **190**. The
hard gate failed on three successive heads on one test from a file that had
landed on `main` an hour earlier, while `bun test` said 0 fail — and
`bun test -t "<its name>"` printed `0 pass, 0 fail`, which reads like a
pass. **`-t` matching nothing is indistinguishable from `-t` matching and
passing**: the third-state rule, arriving through the test runner.

Before trusting a local pass: `git rev-list --count HEAD..origin/main` is 0,
and your **file count** equals CI's. `prepare-merge` step 3 is not enough —
the base moved again between that step and the push.

**Read the job log on the FIRST failure notice.** Three arrived before I
opened one, because a green local suite made the CI result look like the
anomaly. The log named the test in one line.

## TRAP — derive the gate list from the WORKFLOW, not from package.json

Three CI checks are invoked **by path**, not by npm-script name, so a sweep
over `bun run <script-name>` structurally cannot see them: `gen-docs-pages.ts`,
`gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`. Get the list from the
workflow itself, not from `package.json`.

**Editing a script that WRITES a witness restales every published projection of
it** — regenerate both sides and verify by parsing, not by grep.

More: `detail/derive-the-gate-list-from-the-workflow.md`

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

`test/results/witnesses/**` is live state. A test that reads a VERDICT out of it
breaks when somebody fixes or adjudicates the finding — which is the system
working, not a regression.

**Read the document live and flip the ONE criterion you test, BY ID, where it
sits.** Do not freeze a captured copy: freezing the criterion freezes its
witness, so the hash literal outlives the checker. And never hoist the failure
to `criteria[0]` — the generator already sorts worst-first, so a panel that
sorted nothing would pass.

More: `detail/never-assert-on-a-qa-verdict-from-the-published-corpus.md`

## TRAP — a 404 or a failed fetch is not evidence — read the publish ref

**First check for a deployment or 404 question is the publish ref, not a
fetch.** `git fetch origin gh-pages && git ls-tree -r --name-only FETCH_HEAD |
grep <thing>`; staging previews are `STAGING/<branch-slug>/`, the slug being
the branch with `/` replaced by `-`.

**A published URL is looked up, never composed.**
`docs/<stub>/proposals/x.md` publishes to `/proposals/x.html` — the stub
segment is a source-tree convention Jekyll does not carry into the site, so a
composed URL 404s on a page that is there. Measured 2026-09-19 on
`bootstrap.md`.

**A failed fetch from an agent container is a proxy result.** Outbound HTTPS
is proxied and `github.io` is blocked: `curl` returns `000` with `CONNECT
tunnel failed, response 403` whether or not the page exists. "Could not
determine" is honest, and still the wrong answer when the ref could determine
it.

**CI state is `get_check_runs`, not `get_status`** — the latter reports
`{"state":"pending","total_count":0}` on a PR whose checks are green, because
this repo posts check runs and no legacy statuses. Compare its `head_sha`
against the PR's current head: `check_suite.completed` routinely names a
superseded sha, and the staging workflow's own commits are not PR heads.

Skill: `skills/folio-core/github-state-inspection.md`.

NOT tagged to `platform-boundary-guard`, which wants the compose-not-resolve
half: measured 2026-09-19 it was already at **201 of its 200 lines**, so a
14th entry pushes one of its own TRAPs past the harness cut. The skill is the
source of truth; memory only summarises.

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

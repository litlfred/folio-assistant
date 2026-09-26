---
# folio-assistant-5mg5
title: 'RENDER LOG: the publish branch keeps its own history of what was published and removed'
status: completed
type: task
parent: folio-assistant-5a3l
created_at: 2026-09-20T07:19:52Z
updated_at: 2026-09-20T07:19:52Z
---


## The question it exists to answer

> **What happened to `STAGING/<slug>`, and why?**

Nothing could. A preview appears, a bot comments a URL, and some time later the
link 404s. Cleaned up because its PR closed, removed by a confirmed dispatch,
or **deleted by an unrelated merge to `main`** were indistinguishable — and the
third really happened, on every deploy, for months: bean `plj1`, three
`docs(gh-pages)` commits, 1/3/1 previews on their parents and zero after.

The defect was silent precisely because **the publish branch kept no record of
its own changes.**

Owner, 2026-09-20: *"that should be a specialied Logger skill for the gh-pages
rendering context … log all staging rendering (when added, when deleted) to a
logging directory/file on gh-pages. skill + tool."*

## What was built — PR #473

| | |
|---|---|
| schema | `cat-harness/schemas/render-log.ts` — `folio-render-log/v1` |
| tool | `cat-harness/scripts/render-log.ts` |
| skill | `cat-harness/skills/folio-core/render-logging.md` |
| process | `cat-harness/processes/staging-render-log.bpmn` |
| the carry | `CARRIED_PREFIXES` in `cat-harness/scripts/restore-staging.ts` |
| the wiring | `.github/workflows/feature-staging.yml`, three jobs |

## The four decisions, and what would falsify each

1. **A specialisation of `folio-log/v1`, not a rival.** Same `id`/`at`/
   `summary`/`detail`/`references`/`capture` spellings. Falsified if a second
   vocabulary appears for one concept — it did not; the store, the subject and
   the published/unpublished decision are the only three differences.
2. **Append-only as a SHAPE.** No `--remove`, no `--edit`, no id to overwrite,
   so no caller can be written wrongly. Falsified by any verb that can lose an
   entry.
3. **The store is OUTSIDE `STAGING/`.** Verified rather than assumed: git
   permits a ref whose slug collides with a directory under `STAGING/`, so a
   guard would have had to be remembered; a location cannot be forgotten.
4. **A path is checked by VALUE, never trusted by provenance** — bean `fuzm`.
   The slug sanitiser can emit `..`; it is safe only because git rejects such a
   ref, and `cleanup-dispatch` takes a slug as a **dispatch input**, where that
   invariant does not hold.

## What `retained` is for

A removal **considered and refused**, with its reason. It is the one that makes
the log worth reading: a preview still standing because a liveness signal fired
leaves no trace otherwise, and the next person asking *"why is this still up"*
has nothing to consult. Bean `w2g5` — a branch reused across five successive
pull requests — is how that gap looks from the far side.

## Done when

- [x] schema, tool, skill, BPMN diagram, 26 tests
- [x] `restore-staging.ts` carries `_render-log/` **unconditionally**, before
      the preview check, with a determined-absence report and exit 2 on a carry
      it cannot determine
- [x] `feature-staging.yml` wired: `stage` → `rendered`, `cleanup` →
      `removed` / `retained`, `cleanup-dispatch` → `removed`
- [x] a removal and its record are ONE commit, in both removal paths
- [x] `workflow-yaml.test.ts` asserts the wiring by job, so a future edit
      cannot silently drop a call
- [x] **a real deploy observed writing an entry** — run 35497542549,
      2026-09-20T07:43:17Z, `_render-log/2026-09-20.jsonl` on `gh-pages`:
      `rendered STAGING/claude-sleepy-babbage-ls90iz`, read back with
      `render-log.ts --read` (exit 0, 1 entry, 0 skipped). The wiring is not
      inferred from tests; it ran.
- [x] **append-only observed in production**, which is the property the whole
      design turns on. A second deploy (run 35498171281, 07:57:32Z) left BOTH
      entries standing — two separate workflow runs pushing to the same branch,
      the first not overwritten. `--read` exit 0, 2 entries, 0 skipped.
- [x] **the loss mechanism observed on this very log** — `gh-pages`
      `96926833b5`, a `docs(gh-pages)` full replace at 08:16:37Z, shows
      `D _render-log/2026-09-20.jsonl`: present at its parent, gone at the
      commit, all three entries with it. `docs-site.yml` runs
      `restore-staging.ts` FROM `main`, which does not carry `_render-log`
      until this merges. The protection is real and not in force yet.
- [x] **the verifier's blind spot, found by that incident** — that deploy's
      `--verify` PASSED while the log went, because it only compared
      `STAGING/`. `verifyStaging` now takes the carried prefixes and reports a
      lost one as NOT recoverable by re-running. 5 tests, including a control
      pinning the old blind spot so the fix cannot be quietly reverted.
- [x] merged — PR #473, merge commit `0720657c79`, 2026-09-20T09:52Z
- [ ] the agent-memory entry, once there is room — bean `lnpe`. A six-line
      node evicted a TRAP from BOTH `ci-health-watcher` and
      `platform-boundary-guard`, so it was dropped rather than bought by
      archiving somebody else's entry. Nothing is lost: the discipline is in
      the skill, which is where AGENTS.md says it belongs.

## Related

| | |
|---|---|
| why the publish branch loses things | `plj1` |
| a closed PR is not an abandoned branch | `w2g5` |
| the slug path hazard | `fuzm` |
| the retired-record store, next tenant of `CARRIED_PREFIXES` | `6pfo` |

_2026-09-20T09:55Z_ — MERGED as #473 (`0720657c79`). Six commits, three merges
of `main` (55 commits) along the way; every conflict was a generated file and
every one was regenerated rather than hand-merged.

**One claim left unverified at merge, deliberately named rather than assumed:**
the carry itself. `restore-staging.ts` now carries `_render-log/` across a full
replace, but that code only takes effect once it is ON `main` — which it now
is. The next `docs(gh-pages)` full replace is the first run that exercises it.
Until one is observed keeping the log, the carry is tested and not yet
witnessed. Checked at the next check-in.

`removed`, `retained` and `restored` are still unexercised in production for
the same reason they were at the PR: they need a PR close, a refused close,
and a full replace respectively. The tests cover each against a real git
remote; today proved that is not the same thing.

_2026-09-20T10:10Z_ — **WITNESSED. Every claim left open at merge is now
observed in production, within twenty minutes of the merge.**

**1. The carry survives a full replace.** `gh-pages` commit `c2f1d25f20`,
`docs(gh-pages): site from 42ba7a83` — the same commit TYPE that deleted this
log at 08:16 this morning. `_render-log` is present at its parent AND at the
commit, and `git show --name-status c2f1d25f20 -- _render-log` is EMPTY: the
full replace did not touch it. That is `CARRIED_PREFIXES` working from `main`,
which is the only place it could work from.

**2. `removed` fired, twice, on real PR closes** — this bean's own PR and a
sibling's:

```
2026-09-20T09:52:35Z  removed  STAGING/claude-sleepy-babbage-ls90iz
2026-09-20T09:58:40Z  removed  STAGING/claude-brave-hypatia-r820sf
```

**3. And the reason fix is vindicated by those two entries.** Both read:

> `PR #473 closed; removal confirmed by: merged`

Both removals were **merges**, not labels. The first draft hardcoded *"closed
and carried the staging:cleanup label"* — which would have written a FALSE
reason into the permanent record of both, and a wrong reason is worse than
none because it reads as evidence. Bean `1feu` landed mid-branch and the merge
caught it; the entries above are what that catch bought.

**4. Concurrent writers append.** Seven entries from four branches
(`sleepy-babbage`, `brave-hypatia`, `festive-galileo`, `fervent-mccarthy`),
several within seconds of each other, none overwriting another. `--read`
exit 0, 0 skipped.

Still unexercised: `retained` (needs a close WITHOUT the label, and both
closes so far were merges) and `restored` (needs a full replace that finds the
log MISSING from `_site`, which the unconditional carry is designed to make
rare). Named rather than smoothed over.

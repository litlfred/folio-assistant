---
# note on folio-assistant-3fva from claude/quirky-davinci-ixuymr-phase3
$schema: folio-bean-note/v1
bean: folio-assistant-3fva
branch: "claude/quirky-davinci-ixuymr-phase3"
created: "2026-10-02"
---
## handover: QA-reports arc (3fva) 2026-10-02

## Handover report: QA-reports arc lead (arc 3fva)

- **Session:** https://claude.ai/code/session_01LKpuPotV3Ve5Za75DQ3AQR
- **Written:** 2026-10-02 ~20:50 UTC. The owner asked for "Prepare for Handover" (skill from PR #1912), to be sent to the Merge Manager.
- **Role and mandate:** lead for arc `3fva`: derived QA leaves `main` for the orphan `qa-reports` branch, and the test-plan/test-report process. Owner rulings:
  - **MERGE POLICY (verbatim):** "Do NOT merge to main yourself. When your PR is green on every CI job, mark it 'Ready for review', add the label `ready-to-merge`, and comment 'ready: <head sha>'."
  - **Main:** "Only nothing into main".
  - **#1764 drift:** "Leave to Steward" (2026-10-02).
  - **Sweep scope (3hk4):** "Full sweep" (2026-10-02).
  - **Proposal rulings:** D1 (a) orphan branch; D2 (a) attestations stay on main; D4 "right away" (5hox once readers are migrated and `main/<sha>` verifies).

### Where I'm going (current arc)
Derived QA verdicts move off `main` onto `qa-reports`, keyed by commit; judgements stay in `test/attestations/`. "Done" means:
- #1764 and #1801 are merged;
- `main/<sha>` is published, and `qa:verify-moved` reports it IDENTICAL;
- the held 5hox deletion has landed;
- every gate is green on `main` with no QA files committed.

### Done so far
- **#1764** (arc; head `8df0a71bd`): mechanism (16ei), judge modes (bo44), test schemas (ygzh), live defects (de9k, r7v6), subdirectory descriptions (yhjr). It was green and `ready:` posted at several heads. Its last green head with `ready:` is `d36fce044`; the steward has merged `main` in since.
- **#1801** (phase 3, stacked on #1764; head `06ec92cba`):
  - attestation splits: 2gst, 8wj1;
  - readers: oq1j, id4s, 0dav, c8uq, tfqf, cxcn, 8iqt;
  - regen coverage: i1q7, 0utt;
  - skills and processes: d6bw;
  - test process: 3o5b;
  - 5hox preparation: inventory `cat-harness/docs/proposals/5hox-removal-inventory.md`, `qa:verify-moved`, storage declarations;
  - 3hk4: `qa:refresh` and `qa:publish --completeness`;
  - oqe3: last stale-compare gates now judge;
  - 4l4d: badge placeholders and JSON assets;
  - f3bh: subgraph-readmes skips stored directories.

### Next in queue
1. **Get #1801 green at `06ec92cba` or later.** The push fixes `stage` and `check:artefact-verification`. Still open: **qa-publish → `check:qa-corpus` reports 370 findings.** The committed witness copy (`cat-harness/test/results/witnesses/`) lags the docs pages:
   - the directory is stored, so regen no longer refreshes it;
   - main added pages;
   - 4l4d's index changed shape.

   Fix: run `bun run docs:pages` to rewrite the committed witnesses, check with `bun run check:qa-corpus -- --dir .`, then commit. A full `bun run gates` before pushing was cut off by a 2-hour time limit and has not completed.
2. **Bean `zlq9`: support both branch names.** Rule: `cat-qa-reports` if it exists, else `qa-reports` if it exists, else `cat-qa-reports`; writers use the same rule. This is for the steward's rename (#1913, bean `32f6`). Sites:
   - `qa-store.ts` `DEFAULT_QA_BRANCH` and every read and write;
   - `qa-site-assets.ts`, `qa-verify-moved.ts`;
   - `storage.branch` in 10 instance declarations;
   - `cat-harness.ts`;
   - workflows: qa-publish, qa-reports-prune, docs-site, `folio-staging.yml`.

   Then tell the steward "dual-name pushed and green", and do not push to #1764 or #1801 for 30 minutes so it can rename.
3. Once #1801 is green, it carries `ready:` (it is stacked; it retargets to `main` after #1764 merges).
4. After #1764 merges: wait for `main/<sha>` on `qa-reports`, then run `bun run qa:verify-moved --key main/<sha>`. If IDENTICAL, re-measure the inventory (now 10 instances, not 12: smart-dak and smart-l1 were removed upstream) and show the owner the numbers. Only then push the 5hox deletion.

### In flight
| item | kind | state | next action | owner |
|---|---|---|---|---|
| #1764 `claude/quirky-davinci-ixuymr` @ `8df0a71bd` | PR → main | `ready-to-merge`; main brought in by the steward | steward merges | merge steward |
| #1801 `claude/quirky-davinci-ixuymr-phase3` @ `06ec92cba` | PR (stacked on #1764) | CI pending; qa-publish's `check:qa-corpus` expected red (370) | Next in queue, step 1 | this arc |
| `zlq9` | bean | todo | Next in queue, step 2 | this arc |
| `5hox` | bean | prep merged; deletion held, NOT pushed | Next in queue, step 4 | this arc, owner go |
| `zaui` (certification attestation family), `4iey` (per-plan DMN) | beans | todo | none needed yet | this arc |

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|
| 5hox: 8 gates red with the files absent | a `main/<sha>` entry on qa-reports, which exists only after #1764 merges | 2026-10-02 | re-check when #1764 merges |
| the `qa-reports` → `cat-qa-reports` rename | zlq9 pushed and green | 2026-10-02 19:14 | steward holds the rename until told |

### Decisions pending (owner)
- None open. Before the 5hox deletion is pushed, the owner sees the re-measured inventory (count, bytes, oldest age).

### Unpushed or at-risk state
- **`420ab8180`**, the 5hox deletion. It exists only on local branches `qa-5hox` and `qa-5hox-deletion`, and is not pushed by design. This session may push only to its two designated branches, and the commit must not reach #1801 before verification. It can be rebuilt: `git rm -r --cached` over the paths from `bun run qa:verify-moved --inventory`, plus the `.gitignore` already on #1801. Rebuild it, rather than reuse it, after `main/<sha>` verifies.
- Scratch measurement branches, local only and rebuildable: `qa-4l4d-f3bh-scratch` `613805edd`, `scratch-3hk4-absent` `b04865e45`, `gurh-probe-1769` `0eaecdeca`.
- Superseded, safe to drop:
  - `worktree-agent-a8ba4c80e273d619d`, the first 8wj1 attempt (redone and merged);
  - the uncommitted files in worktree `agent-a0f4469f78fb1ddb2`, the rate-limited first cxcn attempt (redone and merged).
- Nothing else is unpushed. The scratchpad was lost in a container restart; nothing in it was needed.

### How to resume
1. Read #1801's CI on its current head and fix it per Next in queue, step 1. Before any push, run `bun run gates`. A subset is not the gate set: two pushes here went red that way.
2. Do zlq9, then message the steward with session `01ToWZR4…` or its successor (see #1912 and #1913).
3. On every merge of #1764 into #1801, take `ours` only for generated paths matched by folder or extension, never by substring. A "glossary" substring once swallowed `glossary-page.ts`. Run regen, then check every staged deletion is absent on MERGE_HEAD.

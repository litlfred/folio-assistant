---
title: Separation arc — consolidated workplan, gaps and migration checklist (2026-10-01)
---

# Separation arc — one workplan for GOAL 1

**Epic bean:** `folio-assistant-7x5n` (under milestone `vuip`). **Issue:** [#1770](https://github.com/litlfred/folio-assistant/issues/1770). See the
epic bean. This page consolidates **five stalled sessions'** handovers into one
arc with nine stories. The stories own no new code. Each one **points at the
beans that already exist**. Where two of those beans describe the same work, the
story names which one survives.

> Why one arc: five sessions each left a handover that said "pick up next: …".
> Read side by side, the lists overlap, contradict each other in two places, and
> share one cause of stalling: the **merge treadmill**. Main moves about every
> 3 minutes, and a merge, regen and CI cycle takes about 22 minutes. An arc that
> ignores that stalls again the same way.

## Status bars (update on every story transition)

Measured 2026-10-01 from `beans list --json`, recursive over each parent, scrapped excluded.

```
GOAL 1  vuip  repo separation          ██████████░░░░░░░░░░  74/143  (27 in-progress, 42 todo)
  vke6  layer split (#223)             █████████████░░░░░░░  52/79
  iirv  cat-harness / -tools split     ███░░░░░░░░░░░░░░░░░   3/22
  9umr  concern subgraphs              ░░░░░░░░░░░░░░░░░░░░   0/2   (PR0, PR1 merged; beans not closed)
  w2gr  cat-harness-tools (server)     ████████░░░░░░░░░░░░  steps 1–3a merged, 3b open
  fnx4  KG subscriptions               ████████████░░░░░░░░  slices 1–4,7,8 merged; 5+6 in #1756
  uhkv  SMART stack (sibling: n3ni)    ████████░░░░░░░░░░░░   5/13

ARC 7x5n stories                      S0 S1 S2 S3 S4 S5 S6 S7 S8
                                       ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
main CI (code-quality, docs-site)      RED — 5 jobs, see S0
```

**Legend for the story row:** `░░` todo, `▒▒` in progress, `██` done, `!!` blocked on the owner.

## Stories

| # | story | absorbs (existing beans / PRs) | blocks | delegable? |
|---|---|---|---|---|
| **S0** `hx65` | **Main green.** Fix the five red jobs on `cdb0a018`. Bump the submodule pins (bootstrap `ebfa406`, bootstrap-tools `03832a8`). | handover fix-ups; `14ve` | everything | yes, one agent |
| **S1** `a4of` | **Bookkeeping truth.** Close beans whose work is merged, and reconcile `fnx4`'s boxes with #1721. | `y5si`, `ybp4`, `ejye`, `ybwt`, `7dek`, `xsqm` (already done) | S4, S5 | yes, here |
| **S2** `0mf0` | **Merge-treadmill fix.** Land `merge:main` (#1754), then run regen in CI on the merge result (`d33q` part B). | #1754, `d33q`, `oz5w` | S3–S8 throughput | yes, one agent |
| **S3** `ga6u` | **Drain in-flight PRs.** #1756 (fnx4 5+6), #1747 (cmsl 3), #1735 (qsx4, **owner judgement**), #1753, #1581 (stale plan; close or rebase). | those PRs | S5 | yes, one agent per PR |
| **S4** `rfuq` | **Direction and placement.** No upward imports, and content goes to its owner. | `zlmp`, `yj6r`, `zhg2`, `r3gy`, `2j2r`, iirv `pzwb` `63wl` `tlat` `4fv8` `apcg` `8fq9` `f8wp` `p9bu`, 9umr finale | S5 | yes, one agent per placement PR, **serialised** |
| **S5** `txue` | **Code out of cat-harness.** All code goes to `cat-harness-tools` (D1). | **`w2gr` 3b ≡ iirv `70lx`** (one story; `70lx` survives, `w2gr` becomes its child), `8lcl`, `y9r6`, `vj2p` | S6 | yes, but **one agent at a time** (touches every import) |
| **S6** `ybsz` | **Standalone rehearsal.** Each staged instance builds and passes from a fresh sibling clone. | iirv `ho66`, `pyds`; vke6 `izqr`, `mer2` → `tndo` → `zmdo`, `wggr` | S7 | yes |
| **S7** `mgxw` | **Seed the staging repos (sibling strategy).** One seed PR per repo, on a branch, never to `main` of the target until approval. | iirv `smbc` (owner), `iai8`, `w1gy`; `n3ni` (sibling, smart-*) | S8 | seeding yes; **authorisation is the owner's** |
| **S8** `w0at` | **Cut over.** folio-assistant consumes each instance from its repo: a submodule for code it imports, a subscription for KG content. The in-tree copy is deleted **only with your OK**. | iirv `syzb`; `fnx4` (subscription path); `4475` | — | owner gate |

### The sibling strategy, adopted here

The sibling working on `n3ni` (smart-* → `litlfred/smart-*`) follows this sequence:
**(1)** push generic code down first (into `fhir-harness`), **(2)** seed the
staged directory into its `litlfred/<name>` fork **on a branch, one PR per fork**,
**(3)** folio-assistant **subscribes**, **(4)** cut over **only on your OK**. Then,
later, the repo moves to `WorldHealthOrganization/*` once everything works.

This arc uses the same four steps for the non-SMART instances. The one
refinement is in step 3. An instance that folio-assistant **imports code from**
(cat-harness-tools, bootstrap-tools) has to be a **submodule**, because a
subscription materialises KG content and not a module graph. An instance whose
content is only **read** (cat-harness's skills, who-iris, large-datasets) can be
a **subscription**, which is `fnx4`'s path. Both cases keep step 4 behind your
gate.

## Gap analysis

Each gap is something that **no existing bean or PR covers**, or a place where
two of them disagree. Gaps are ordered by what they block.

| # | gap | evidence | consequence if left | goes to |
|---|---|---|---|---|
| G1 | **Main is red, and every handover deferred it.** | `Code-quality gates` at `cdb0a018`: failing steps are *workflow skill refs* (Repository gates #13), *bun test*, *playwright test*, *registration chain current*. `Docs site`: *Regenerate skill instruction pages*. Four successive merges went in without CI finishing. | Every delegated agent inherits red, can't tell its own breakage from the baseline, and stalls. | S0 |
| G2 | **Two beans, one move.** `w2gr` 3b ("move the cat-harness/src server modules into cat-harness-tools") and iirv `70lx` ("git mv the unambiguous code") are the same `git mv`, planned by two sessions. The iirv handover already saw `cat-harness-tools/` appear on main from the other session. | Handovers 2 and 4. | Two agents do the move twice, and the merge conflict is the whole tree. | S5: `70lx` survives, `w2gr` closes into it |
| G3 | **Merged work still reads as open.** `y5si` has every box ticked. `ybp4` lacks only "CI green", which it got (#1687). `ejye`, `ybwt` and `7dek` are merged (#1758, #1760). `xsqm` is closed but the handover lists it as blocking. `fnx4`'s boxes don't reflect #1721. | Bean files on main. | A new agent claims done work, as happened with #1690. | S1 |
| G4 | **The treadmill is unaddressed by any bean that has an owner.** `d33q` part B (regen in CI on the merge result) is the systemic fix. #1754 holds part A and is unmerged. | Three handovers measure the cost: 8+ rounds; "a `dirty` PR cannot be merged at all". | Every story below S2 pays about 22 minutes per main movement. | S2 |
| G5 | **Two cutover mechanisms, no rule for which applies.** iirv's plan ends in **submodules** (stage 6). `fnx4` and the sibling's `n3ni` end in **subscriptions**. | The plans side by side. | The two staging repos get cut over two different ways for no stated reason. | S7/S8: the rule above (import → submodule, read → subscription) |
| G6 | ~~Some target repos don't exist~~ **Resolved 2026-10-01:** the owner created `litlfred/{folio-assistant-core, folio-assistant-sci, fhir-harness}`, all three verified empty. `large-datasets` and `agent-skills` fold into cat-harness. | `git ls-remote`, 2026-10-01. | — | S7 |
| G7 | ~~`litlfred/cat-harness` and `-tools` already hold commits~~ **Resolved 2026-10-01:** both are **empty** (fresh clone, 0 commits on `main`), so a seed is the first commit and no read-first is needed. | Clone of each. | — | S7 |
| G8 | **Orphan sidecars need a deletion ruling.** 8 detangle sidecars and 1 kg-qa sidecar are orphaned by moves, and `kg:detangle:check` fails on them. | iirv handover. | A gate stays red, or an agent deletes them unasked. | **Your decision** (S0) |
| G9 | **The submodule pins regress on merge.** Main twice put bootstrap and bootstrap-tools back to older commits, and README writers are duplicated here. | iirv handover. | bootstrap's "generated by" notices get dropped, and a merge silently de-inits submodules. | S0 (bump) + S4 (delegate README writers) |
| G10 | **`readme:subgraphs:check` red on `02f16ae98bb` is unexplained.** The log redirects to Azure blob, which this proxy denies. | Handover 3. | The gate may recur with no diagnosis. | S0. `gh api …/jobs` works from here, so retry the read |
| G11 | **`fnx4` slice 7 layout collides with staged instances** (`<root>/<harness>/` vs `who-iris/`). | Handover 5. | The first real subscription (`litlfred/ihris`) writes over a staged directory. | S8 prerequisite |
| G12 | **GOAL 1's own falsifier has no definition.** `zmdo` waits on `tndo` (MVP undefined), which waits on `mer2` (split `folio_init`). You ruled "split the operation"; it is not built. | Beans. | Nobody can say whether GOAL 1 is done. | S6 |
| G13 | **The specialised agent types can't reach GitHub.** `ci-health-watcher` spawned in this session had no GitHub MCP tools and an invalid `GH_TOKEN`. | This session, 2026-10-01. | Delegated diagnosis comes back "could not check". | Delegation rule below |
| G14 | ~~IRIS-specific code has no home~~ **Ruled 2026-10-01:** the 5 files stay in `who-iris`, and the finding becomes a QA **warning**, not a failure ("ok b/c small # tools"). No `who-iris-tools` repo. | `eayu`. | — | S0 (severity change) |

## Migration plan — checklist for status-bar monitoring

Each line is one observable fact. Tick it **only on evidence**: a merged PR sha,
a green run id, or a bean id moved to `completed`. The status bars above count
these ticks.

### S0 `hx65` — main green
- [ ] the five failing jobs on main, each named with job, step and cause
- [ ] fix PR merged on **per-job verified green** (not "merged before CI")
- [ ] submodule pins: bootstrap `ebfa406`, bootstrap-tools `03832a8`, translation templates re-extracted
- [ ] `readme:subgraphs` cause read from the job log (G10)
- [x] your ruling on the 8 + 1 orphan sidecars recorded on the bean (G8): widen the scan, keep the files

### S1 `a4of` — bookkeeping truth
- [ ] `y5si`, `ybp4` completed with PR evidence
- [ ] `ejye`, `ybwt`, `7dek` completed (#1758, #1760)
- [ ] `fnx4` boxes ticked for slices merged in #1721
- [ ] `w2gr` re-parented as a child of `70lx`'s story, and its 3b list copied there (G2)

### S2 `0mf0` — treadmill
- [ ] #1754 `merge:main` merged
- [ ] `d33q` part B: CI regenerates on the merge result and pushes a fix-up commit, so a branch no longer races main
- [ ] measured: median cycle from "PR green" to "merged" before and after

### S3 `ga6u` — drain in-flight PRs
- [ ] #1756 merged (fnx4 5+6)
- [ ] #1747 merged (cmsl step 3)
- [ ] #1753 merged (i2kp)
- [ ] #1581 closed as superseded, or rebased (the r0tm plan predates #1687)
- [ ] #1735: your per-entry ruling on `dependents` → `subgraph: true`, then merged

### S4 `rfuq` — direction and placement
- [ ] `check:import-direction` + `check:reference-direction` at **0 wrong-direction edges** (`zlmp`, `yj6r`, `zhg2`, `r3gy`)
- [ ] `2j2r`: ~44 readers of `decl.directories` follow the checkout
- [ ] **owner ruling 2026-10-01:** `large-datasets` becomes a subgraph of cat-harness. Its one upward code import (`scripts/gen-id-lookup.ts` → `folio-assistant-core/schemas/catalogue.js`) and its `needs: folio-assistant-core` go first.
- [ ] **owner ruling 2026-10-01:** `agent-skills` (16 library sources + voices) becomes a library subgraph of cat-harness. It has 0 code imports from core, and its `needs: folio-assistant-core` plus 2 prose mentions go first.
- [ ] placement PR2 `pzwb` · PR3 `63wl` · PR4 `4fv8` · PR5 `tlat` · PR6 `apcg` · PR7 `8fq9` · PR8 `f8wp` · PR9 `p9bu`
- [ ] `9umr` finale: last five tool skills out of `folio-core`

### S5 `txue` — code out of cat-harness
- [ ] 1a `70lx` (absorbs `w2gr` 3b): server, tools, routes, rbac, auth, mcp → `cat-harness-tools/`; MCP server starts and lists the same tools
- [ ] 1b `8lcl`: Zod → tools; generated JSON Schema stays
- [ ] 1c `y9r6`: cat-harness content holds no `.ts` (D2)
- [ ] 1d `vj2p`: each instance hosts its own generated outputs (D3)

### S6 `ybsz` — standalone rehearsal
- [ ] `ho66` `check:cat-harness-standalone` green from a fresh sibling clone
- [ ] `mer2` instance-init split; `tndo` MVP written down; `izqr` bootstrap on an empty repo
- [ ] `wggr` stub inversion (`<stub>/docs`)

### S7 `mgxw` — seed staging repos (sibling strategy)
- [x] current contents of `litlfred/cat-harness` and `litlfred/cat-harness-tools` read and recorded (G7): both empty, 2026-10-01
- [ ] **your authorisation** (`smbc`)
- [ ] seed PR on a branch in each target repo; fresh-clone QA (`w1gy`)
- [x] empty repos created by you for core / sci / fhir-harness (G6): created 2026-10-01, verified empty via git ls-remote

### S8 `w0at` — cut over
- [ ] import-consumed instances are submodules at the same path (`syzb`)
- [ ] read-consumed instances are subscriptions (`fnx4`; G11 layout fixed first)
- [ ] in-tree copy removed **on your OK only**, per instance

## Delegation

What this session can hand to a sub-agent, and the rules that keep it from
stalling the way the last five did.

1. **Agent type:** use `general-purpose` (all tools) for anything that touches
   GitHub. The specialised types run without the GitHub tools here (G13).
2. **Isolation:** one git worktree per agent, one branch, and one PR opened at
   the first commit.
3. **Collision rule:** S5 and the S4 placement PRs each touch a large share of
   the tree. **Run at most one of them at a time.** S0, S2 and the S3 PRs are
   disjoint and run in parallel.
4. **Claim first:** `bun run beans:claim <id>` before any edit. The claim
   commits to `main`, so keep both sides at the merge.
5. **The merge cycle every agent runs:** merge main,
   `git submodule update --init --recursive`, `bun run regen` until it reports
   0, `bun run gates`, push. Run `state:visualizer` last.
6. **Merging:** owner ruling 2026-10-01: "yes you may merge green PRs". An agent merges once **every job** on its current head is green and the PR is mergeable. Not before. Merging before CI finishes is **not** authorised; earlier sessions did that on an instruction specific to them.
7. **Report shape:** the agent ends with a table of the checklist lines it
   ticked, each with its evidence (sha, run id, bean id), and the lines it
   could not tick, each with the reason.

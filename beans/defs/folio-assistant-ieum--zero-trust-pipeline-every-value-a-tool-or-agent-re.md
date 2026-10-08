---
# folio-assistant-ieum
title: 'ZERO-TRUST PIPELINE: every value a tool or agent receives is suspect — agent handover, skill input, per-tool risk assessment, release security gate, supply chain (software/tool/KG)'
status: completed
type: epic
priority: normal
created_at: 2026-10-07T05:56:11Z
updated_at: 2026-10-08T02:20:00Z
---

## The ask, owner 2026-10-07 — verbatim

> need better security protection when agenet to agnt handover, and in general when utilizeing Iinput from a skill. ALL DATA IN PIPELINE MUST BE TREATED AS SUSPECT. ALL TOOLS ARE REPOSNSIBLE TO GUARD AGAINST CODE INJECTION, PROMPT ENGINEERING, VARIABLE TAMPERING, etc.
>
> different tools will have different securty risk assessments and best practices. all tools needed assessment QA. need also to protect software supply chain/tool supply chain/KG supply chain. will need in future notion of trusted (w/ digital signed proveannce as in swiss Trusted Data Observatory) KGs, checking digital singatures on the KG json(ld) iteslef or its assets.

Then, scoping it for now:

> for now, ingest materials, make voices/methodologies for code authroing agents, update tools processes. security check before release (for example).
>
> tools may be in place but not utilized fully probably

Sources supplied: Ars Technica on MCP "protocol pivoting" (2026-10-06), Ars Technica on BadHost CVE-2026-48710 in Starlette (2026-05-26), Rapid7 CVE-2026-97228, GitHub Docs "Secure use reference".

## Done when (this round)

- [x] GitHub Docs secure-use reference ingested (CC-BY-4.0) — `library/github-docs-actions-secure-use-reference`
- [ ] the three all-rights-reserved sources recorded reference-only (no bytes, no text held)
- [ ] utilisation audit: which existing security gates/tools exist, and which processes/CI actually invoke them
- [ ] voice for code-authoring agents (`secure-code-authoring`), every rule cited
- [ ] methodology node: zero-trust handover (value-not-provenance at every agent/tool boundary)
- [ ] release process carries a security gate step
- [ ] per-tool security risk assessment: a `tool` QA criterion

## Not this round (future, recorded so it is not lost)

- trusted KGs with digitally signed provenance; signature verification on KG JSON-LD and its assets (owner names the Swiss Trusted Data Observatory as the model — not yet researched or held)


## Owner additions, 2026-10-07 (later in the same session)

> would be good to filter inter-agent communication (e.g. handover reports/prompts) for prompt injection as well as any human input

> (mounting remote KG needs trusted provanance sources (digitally signed e..g verifiable vai GDHCN ), or explict user consent)

Also supplied for ingestion and relevance review: arXiv:2507.07974v2 (DefensiveTokens), arXiv:2510.19207v2 (DataFilter), and uploads/2503.18813v2.pdf (commit 396fc4a on main).

- [x] ingest arXiv:2507.07974v2 (CC-BY-4.0, stated in the PDF) and arXiv:2510.19207v2 (licence id not established; ingest cleared)
- [x] ingest uploads/2503.18813v2.pdf from main — CaMeL, `library/arxiv-2503.18813v2`; reviewed into `zero-trust-handover` §"Prior work" and voice rule `scz-report-never-extends-the-plan`
- [x] relevance review written into `zero-trust-handover` §"Prior work"; H8 (remote-KG mount needs signed provenance or consent) and H9 (field-wise screening of hand-overs and third-party human input); voice rule `scz-screen-handover-fields`
- [x] `bun run security:gate` (Tool node `security-gate`), named in prepare-merge step 5
- [ ] screening implementation: generalise `fenced()` (folio-assistant-core/adapters/document/index.ts:124, used by chat alone) into a shared handover screen
- [ ] remote-KG trust gate in `materialize-remote.bpmn` and dependency resolution (signed or consented; neither means not mounted)
- [ ] a `security:gate` task in the publish/merge BPMN processes (merge-base, docs-site-publish), not only in the prepare-merge recipe

## Utilisation audit, measured 2026-10-07

The owner suspected the tools were "in place but not utilized fully". That is confirmed:

| finding | evidence |
|---|---|
| security checks DO run in CI (`check:workflow-injection`, `check:secret-leaks`, `check:lockfile-pinning`, `check:qa-reviewer-permission`, `check:bun-pin`, `check:materialized-fixity`) | code-quality-gates.yml `gates-unrun`, set -e |
| **no release/publish/merge BPMN step names any security check** | merge-base, merge-train, docs-site-publish, qa-publish, publish-verification |
| **0 of 240 third-party `uses:` pinned to a full SHA**, and no gate looks | re-measured with grep; now reported (advisory) by `security:gate` |
| `check:dependency-advisories` never blocks (by design) | CQG:343 |
| prompt fence `fenced()` used by the chat prompt alone | re-measured with grep |
| `tool-args-shell-safe` computed at audit time; `preflight.ts` never consults tool QA before a tool runs | kg-qa.ts:586, preflight.ts:82 |
| signing declared only: `qa-report-signing.bpmn` Task_ApiSign has no implementation; no crypto API in the repo; merge:guard's "signed" is a session id in comment text | bpmn:149, merge-guard.ts:351 |
| `translation_security.py` has no test and no CI run | python-deps.test.ts:60 checks only that it imports |
| `safeHref` source test covers 3 of 9+ files that write HTML | href-safety.test.ts:30-33 |
| 5 of 36 workflows have no top-level `permissions:` | copilot-setup-steps, deploy-folio, pyhecke-native-wheels, pyhecke, pyodide-smoke |
| no security check had a Tool node, so agents could not find them as tools | tools/index.ts; `security-gate` is now one |

## Hazard found while working: a full `bun run cat gates` reverted uncommitted tracked edits

2026-10-07: during a local `bun run cat gates`, every uncommitted edit to a TRACKED file in the working tree was reverted (package.json, tools/index.ts, a methodology, a voice, this bean). Untracked files survived and `git stash list` was empty. The log shows a test doing git operations in the real checkout (`fatal: path 'cat-harness/test/results/kg-qa/skills/x.kg-qa.json' is in the index, but not at stage 2`). **Commit before running gates** until the culprit is found. Filed as its own bean.


## The gates-revert hazard: investigated 2026-10-07, NOT reproduced

The owner asked for it to be done in this session. Measured:

- **`bun test`, the whole suite in 8 chunks of ~120 files**, with an uncommitted marker edit to a tracked file (`THIRD-PARTY-NOTICES.md`): the marker survived every chunk.
- **13 gate scripts run individually**, the ones the first run passed through after the last lost edit (`term:mapping` … `readme:subgraphs`, plus `skill:register`, `check:cat-harness-standalone`): the marker survived every one.
- **A full `bun run cat gates`**, with the marker planted, a 5-second watcher, and a logging `git` wrapper first on PATH recording every checkout/restore/stash/reset/read-tree/switch/clean/merge call: the marker survived, and **no destructive git call ran with the real checkout as its target**. Every such call was `-C /tmp/...`.

Static leads ruled out: `detect-live-corpus.ts` (`git checkout -- .`) refuses a dirty tree and is not a gate. The MCP server's branch-switch `discard` also runs `git clean -fd`, which would have deleted the untracked files, and those survived.

What differs from the lost run: it carried several modified INPUT files (package.json, tools/index.ts, a voice, a methodology, a bean) where the probe carried one inert file. A step keyed on what changed, or something outside gates in that window, remains possible. **Status: unknown, not cleared.** Advice stands: commit before running gates.


## Owner decision, 2026-10-07 — all four next items

> 1 2 (staging doesnt need singautre) 3 (when published, make it unpinned on staging) 4

Read as follows. Recorded so a misreading can be corrected in one place:
- **1** build the shared hand-over screen
- **2** the remote-KG trust gate. **A staging preview needs no signature**; a real mount or a publish needs a signature or consent.
- **3** SHA-pin actions. **Pinning is required where a workflow publishes or runs on main; a staging-only workflow may stay unpinned.** The pin check blocks on the first kind and is advisory on the second.
- **4** a `security:gate` task in the publish/merge BPMN


- [x] **3 done:** `bun run actions:pin` (Tool `pin-actions`) pinned 216 third-party `uses:` to full commit SHAs (an annotated tag pins to its peeled commit), leaving `feature-staging.yml` and `folio-staging.yml` unpinned per the ruling. `security:gate` now BLOCKS on an unpinned action outside staging-only workflows; the 24 in staging are advisory.


- [x] **4 done:** `security:gate` is a named step in `docs-site.yml` (after the mount, before the build) and in the CI gate set that merge-train calls; `docs-site-publish.bpmn` has Task_SecurityGate + GW_Secure (refusal → publication manager alert), re-laid so the alert path no longer overlaps (owner reported the overlap).
- [x] **1 done:** `bun run handover:screen` (Tool `handover-screen`, `cat-harness/src/core/handover-screen.ts`): field-by-field screen over a declared schema; control and undeclared fields refused, data fields quarantined (never stripped); `fenceUntrusted` shared, and the chat prompt's `fenced()` now uses it. Guidance in `untrusted-input` and `security`. Guarded, not yet gated: callers must invoke it.


- [x] **2 done:** `schemas/mount-trust.ts` + a `trust` field on `remoteMounts`. `mount:remote` refuses a mount that is neither consented for its EXACT pin nor signed; a signature alone is could-not-determine because no verifier (e.g. GDHCN) exists yet; `--staging` needs neither, per the ruling. Checked before anything is checked out, so a refused mount writes nothing. `mount:remote` got its first Tool node (`remote-mount`). Open: the signature verifier itself.

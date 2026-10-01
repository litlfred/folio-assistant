---
# folio-assistant-8wj1
title: 'QA READERS F4: block and translation read-modify-write writers stop dropping agent verdicts when the prior is absent — the block-qa D2 split'
status: in-progress
type: task
priority: critical
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T17:30:00Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, §5.2 family F4). Refines `oqe3` (`translation:block-qa:check`) and `2ae2` (`qa-agent-write`). Blocked on `16ei`.

**CRITICAL (C11), and it must land before `5hox`.** Each writer below READS the prior verdict file to keep the entries it does not own, including the 13 agent verdicts (11 block-qa and 2 translation-qa, in 12 files). With the prior absent, it writes back a report holding only its own entries, and nothing reports the loss.

## Readers
- `cat-harness/content/pipeline/qa-utils.ts:975,1097` (`loadQaReport`, block discovery) (B). Unknown.
- `content/pipeline/qa-sweep.ts:415-416`, plus `sameScriptVerdict` at `:580,:632,:664,:720` (B). **LOSS.**
- `content/pipeline/qa-merge-findings.ts:186-211` (B). **LOSS.**
- `content/pipeline/integration-audit.ts:222-228` (B). **LOSS.**
- `content/pipeline/language-trap-audit.ts:346,558-559` (B). **LOSS.**
- `content/pipeline/q-usage-audit.ts:292-293,453` (B). **LOSS.**
- `content/pipeline/proof-narrative-lean-equiv-sweep.ts:515-530` (B). **LOSS.**
- `content/pipeline/qa-agent-entry.ts:78-79` (D). **LOSS.**
- `content/pipeline/translation-block-qa.ts:831-856`: `--check` is loud (35 stale, measured); the write path through `mergeCriteria` is **LOSS** (A/B).
- `content/pipeline/qa-staleness.ts:131-136` (MCP `qa_staleness`) (D). Correct unknown: `[NO-QA]`, measured.
- MCP `qa_sweep` (`folio-assistant-core/adapters/document/tools/qa.ts:39-54`) → `qa-sweep.ts` (D). **LOSS.**
- `content/pipeline/qa-agent-drain-queue.ts:89`, `semantic-cone.ts:193`, `proof-axis-dashboard.ts:128` (D/C). Unknown.
- `cat-harness/src/qa-agent-write.ts:163,181,225` (D) reads and writes the LEGACY beside-block `${base}.qa.json`, not `test/results/block-qa/`. The live-defects bean records that.

## Migration action
1. **D2 split of mixed files.** The 13 agent entries move to `test/attestations/` on main. Script entries go to the branch.
2. Every read-modify-write reads the script half from `qa-store` and the attestation half from `test/attestations/`. A miss on either is `unknown`, and **never a blank prior**.
3. An agent verdict (`qa-agent-entry`, `qa-agent-write`) is written to `test/attestations/` only.
4. `qa-paths.ts` keeps the path functions. `qa-witness.ts` (publish family) consumes them and does not edit them.

## Done when
- [x] a sweep over a tree with no `test/results/` and no fetch refuses or reports `unknown`; it does not write a report missing the 13 agent entries. All 9 writers re-source attestations from `test/attestations/`. With the store unreadable they exit 4 and write nothing. Tested per writer family with the prior ABSENT in `scripts/tests/qa-attestations-writers.test.ts`. The SCRIPT half with no fetch is still open; see Summary.
- [x] the 13 agent entries are byte-identical in `test/attestations/` (checked by a test): `schemas/qa-attestations-criteria.test.ts` (was `content/pipeline/qa-attestations.test.ts`), over the real corpus
- [ ] `translation:block-qa:check` and the MCP `qa_staleness` and `qa_sweep` give the same results with `test/results/` absent and the branch fetched. Not done: it needs the script half read through `qa-store`.


## Summary of Changes (2026-10-01, branch `worktree-agent-a8ba4c80e273d619d`, NOT pushed)

Held by session https://claude.ai/code/session_01LKpuPotV3Ve5Za75DQ3AQR (sub-agent of `claude/quirky-davinci-ixuymr`). Announced here rather than through `beans:claim`, because this session pushes nothing.

**Measured** with `bun run qa:attestations:migrate:check`, which counts every non-script entry in every derived block or translation report:
- before: 157 derived reports, **13 non-script entries in 12 files** (11 `block-qa/v1`, 2 `translation-qa/v1`; 12 by `kind: agent`), 0 in a store;
- after: the same 13, all held in `test/attestations/`, 0 missing.

**Writers found by grep.** There were 9, not 8. The ninth is `src/qa-agent-write.ts`, which the audit filed under F8b. Since `r7v6` it writes the results tree, so it had the same C11 loss.

**Store layout**
- `<instance>/test/attestations/<family>/<mirrored path>.attestations.json`, plus the marker `attestations.store.json`. Code: `cat-harness/content/pipeline/qa-attestations.ts`.
- `qa-attestations/v1` carries `family` and `subject` (the instance-relative path, plus `locale` for translation-qa) and a `criteria` map with the derived report's shape.
- Read states: hit, miss, no-store, corrupt and unknown.
- Writers use `resolvePrior` and `finalizeCriteria`. On a no-store instance (one that never migrated), they ADOPT the prior's attestations.

**Byte preservation.** 10 of the 12 source files are ASCII-escaped (an em dash is written as the six characters `—`). The store keeps each source's escaping. Tests check two things on the real corpus: each entry's TEXT is the same bytes in both files, and each derived file recomposes byte for byte from its script half plus the store.

**Commits**
- `8758a003`: the store and the migration (`qa:attestations:migrate`, `:check`); 12 store files.
- `c7988bdd`: 8 block writers, and the CI gate.
- `6b04f7b3`: the translation writer, the per-family C11 tests, and the 35 translation-qa sidecars restamped by `script_hash`.
- `8bb8d554`: `qa:resolve-conflicts` (520m) reads the store.
- `870e259a`: regen, and `@covers`.
- `32677ff4`: the `check:artefact-verification` declaration.

**Behaviour**
- Every writer refuses (UNKNOWN, writes nothing, exit 4) when the store is corrupt or unreadable, or when the prior holds an attestation the store lacks.
- `qa-merge-findings` now anchors at the block's content repo. It used the git top level, which pointed at a results tree nothing reads.
- `language-trap-audit` used to drop adjudications on its own criteria by overwriting the array. It no longer does.

**Gates.** Baseline was `bun run gates` before any change: 2 of 203 red. They were `bun test` (1 failing test: "the report is a fixpoint") and `translation:catalogue:check`. After (at `870e259a`): bun test was 13787 pass and 1 fail, the same test as the baseline. Gates were 3 of 203 red: the same two, plus `check:artefact-verification`, which flagged the new `:check`. `32677ff4` declares it, and it now passes.

**Reconcile with `2gst`.** 2gst's layout is uncommitted, in its own worktree (`schemas/qa-attestations.ts`, the declared `attestations` directory).
- The two agree on the root, the `<family>/` mirror, the suffix, the `$schema` tag and the `family` field.
- `subject`: 2gst uses the object `{kind,id,path}`, 8wj1 a string plus `locale`.
- Payload: 2gst uses family arrays, 8wj1 `criteria`, which fits 2gst's "a family adds its own arrays".
- Presence: 2gst uses the DECLARED directory, and an absent one reads unknown. 8wj1 uses a marker file, and absence means no-store, which adopts the prior's attestations.
- Module: 2gst's `schemas/qa-attestations.ts` against 8wj1's `content/pipeline/qa-attestations.ts`.
- Recommended: after 2gst lands, 8wj1's families become members of 2gst's discriminated union, `storeState` reads `attestationsHomeFor`, and the marker goes.

Open: the SCRIPT half (other writers' script criteria in the same file) is still carried from the prior derived file. With it absent, those criteria wait for their own writer to re-run. That is regenerable, not lost, but it belongs on `qa-store` (`16ei`), and it is the remaining third Done-when.

## Owner rulings 2026-10-01 (binding) — reconciliation with `2gst`
1. **2gst's declared design wins.** 8wj1 adapts: subject is an OBJECT, the families are members of the one `QaAttestationsSchema` union, presence is the DECLARED `attestations` directory (no marker file), one schema module.
2. **A folio with no store yet auto-moves on first save**, for ALL families, kg-qa included. A writer that finds judgements in a prior derived file and no store entry moves them into the store as it saves; it does not refuse and wait for a manual migration. Nothing is ever silently dropped. A corrupt store is still UNKNOWN and refused.
3. **The store stays at `<instance>/test/attestations/`** (layout-norms baseline entry kept).

## Summary of Changes — merged onto `claude/quirky-davinci-ixuymr` (2026-10-01, NOT pushed)
Cherry-picked `8758a003..e8caf202`, then:
- `b18799fb` — **one schema, one API, one migration.** `block-qa` and `translation-qa` are members of `schemas/qa-attestations.ts`'s union: `subject {kind: "block", id, path}` (id and path = the instance-relative subject root), a `criteria` map holding only non-script entries, plus `locale` on translation-qa. `content/pipeline/qa-attestations.ts` is deleted; `resolvePrior` / `finalizeCriteria` / split / compose live in the schema module and the nine writers import them from there. The marker `attestations.store.json` is gone. The 12 store files are converted: only the subject lines change, every entry byte-identical. `qa-attestations-migrate.ts` is deleted; `migrate-kg-attestations.ts` is generalised to `scripts/migrate-qa-attestations.ts` for all three families, and `qa:attestations:migrate[:check]` run it.
- **Ruling 2.** `readAttestationFile` answers `absent` (was `unknown`) when the store directory is not there. On `miss` or `absent`, `resolvePrior` MOVES the prior's judgements (`adopt`), and `finalizeCriteria` writes them to the store before the derived report. `corrupt`/`unknown` still refuse (exit 4). The old `unmigrated` refusal is now `conflict`, and only for a store HIT plus a prior judgement the store lacks: refused, never dropped, a person reconciles.
- **Kept:** the 9 writers, `qa:resolve-conflicts` reading the store, the `language-trap-audit` overwrite fix, the `qa-merge-findings` repo-root fix, and `qa-attestations-writers.test.ts` (now also: no store → qa-sweep moves the prior's judgements; corrupt store → exit 4, nothing written; store hit + stray prior judgement → conflict).
- **Counts, measured before and after:** 13 judgements (11 block-qa + 2 translation-qa) in 12 derived files, all 13 held in the store, entries byte-identical. A round-trip test on the real corpus starts from NO store, runs each subject's first save, and reproduces the committed store byte for byte, and each derived report byte for byte.
- `9f858484`: declaration, conventions and gate text. `604ef031`: regen.

**One deviation, flagged.** Block and translation derived reports still carry a PROJECTION of their judgements, composed from the store and never the source once the store holds the subject. So "the derived file is clean" holds for kg-qa only. About 30 readers and the published site take `criteria[id][0]` from the derived file; stripping the projection is reader work that belongs with `5hox`.

**Still open.** The third Done-when (the script half through `qa-store`). Also, `translation-roundtrip.ts` writes agent round-trip entries straight into a legacy-path sidecar and is not yet a store writer. With a store hit, its new entry makes the next writer refuse with `conflict`: loud, not lost.

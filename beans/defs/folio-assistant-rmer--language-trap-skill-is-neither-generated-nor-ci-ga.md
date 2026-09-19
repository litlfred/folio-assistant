---
# folio-assistant-rmer
title: 'Language-trap skill is neither generated nor CI-gated: .claude/skills/local is absent from GROUPS'
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:38:18Z
updated_at: 2026-09-19T00:57:11Z
---

`.claude/skills/local/language-trap-agent-audit.md` is the authoritative spec for the ten `trap-*` criteria (`content/pipeline/qa-criteria-registry.ts:2242-2251`), carrying the owner directive of 2026-08-15 and the false-positive classes each category needs. `GROUPS` in `scripts/gen-skill-docs.ts` lists `skills/content-lifecycle`, `src/skills`, `skills/folio-core` and the two adapter dirs; `.claude/skills/local/` is not among them, so the file is not published and `gen-skill-docs --check` does not guard it.

Known cost, from AGENTS.md: that directory holds 25 entries, 22 of them `.json` (capability/skill descriptors, not instruction bodies), so publishing it needs a filter rather than a bare path. And `todo-manager.md` there differs from the `folio-core` copy by 188 diff lines, so publishing the directory surfaces that divergence as a second published page — which is information, not a regression, but it is the reason this was left alone before.

## Done when
- The `.md` instruction bodies under `.claude/skills/local/` are generated into `docs/reference/skill-instructions/` and guarded by `gen-skill-docs --check`, with the `.json` descriptors excluded.
- Either the `todo-manager.md` divergence is resolved, or the two published copies each say which is canonical.

_2026-09-19T00:57:11Z_ — ## Summary of Changes

`.claude/skills/local/` is now a `GROUPS` entry in `scripts/gen-skill-docs.ts`, so its three `.md` instruction bodies are published and guarded by `gen-skill-docs --check`. The directory holds 3 `.md` and 23 `.json`; only `.md` is read, so the capability and skill descriptors are not mistaken for instruction bodies — the filter the bean anticipated turned out to be the generator's existing `.endsWith('.md')`.

**The todo-manager collision is resolved by publishing BOTH, not by picking a winner.** The output directory is flat, so a `publishPrefix` (`local-`) was needed. Two things were wrong before:

1. The dedupe was keyed on the source BASENAME, so the second `todo-manager.md` was silently dropped — and the index claimed it was "(same page)", which is false. Re-keyed on the published name.
2. Measured 2026-09-19: the two are 323 and 356 lines, **202 diff lines**, and NEITHER is a subset. The local copy has Coordination discipline / Core commands / Relationship to other surfaces / What beans are (and are not); the folio-core copy has Check before you create (STRICT) / Core Directives for Sessions / Installing beans / Status Display Format. Stubbing either would lose content.

So both pages carry a banner naming the other, stating the measurement, and saying the canonical question is open — `AGENTS.md` leaves it to whoever owns the skills layout. That satisfies this bean's second branch ("the two published copies each say which is canonical") as honestly as it can be satisfied without the owner's decision, and it makes the divergence VISIBLE rather than resolved-by-directory-order.

`SAME_BASENAME_DIFFERENT_DOCUMENT` is data rather than inferred by diffing, because 'these two files differ' is measurable while 'these two files are MEANT to be different' is a judgement somebody has to make.

## Still open, and it is the owner's call
Which `todo-manager` is canonical. Nothing is lost while both are published and cross-linked, so this is no longer urgent — but three copies of one skill (the third is `docs/reference/skill-instructions/todo-manager.md`, generated) remains the drift AGENTS.md warns about.

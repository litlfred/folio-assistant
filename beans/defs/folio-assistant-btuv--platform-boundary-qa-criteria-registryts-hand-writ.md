---
# folio-assistant-btuv
title: 'PLATFORM BOUNDARY: qa-criteria-registry.ts hand-writes one criterion per VOICE, three of them WHO, restating another instance''s rules uncited'
status: in-progress
type: task
priority: high
created_at: 2026-09-21T16:26:49Z
updated_at: 2026-09-21T17:57:07Z
parent: folio-assistant-vuip
---

Owner, 2026-09-21: 'cat-harness generic voice shouldnt have WHO references.'

The skill half is fixed (voice-authoring-guidance.md no longer restates any WHO rule). The registry half is not, and it is the larger leak.

cat-harness/content/pipeline/qa-criteria-registry.ts carries four voice-overlay criteria, one per voice:

  voice-overlay-who-editorial              voices: ['who-editorial']
  voice-overlay-who-guideline-development  voices: ['who-guideline-development']
  voice-overlay-who-publication-design     voices: ['who-publication-design']
  voice-overlay-milnor                     voices: ['milnor']

Each restates that voice's rules in prose. The three WHO ones describe files that live in ANOTHER INSTANCE — who-style-guide/voices/*.json — and they restate them WITHOUT the citation the voice itself carries. check-voices.ts confirms every rule in those voices cites a resolving source with a checkable quote; the registry's prose copies cite nothing. That is the same defect the skill had, one layer down, and it is the inversion of this subsystem's own claim that a voice is auditable rather than asserted.

The pattern is generic machinery HAND-INSTANTIATED per voice, which is why the content leaked in: there is no mechanism for an instance to contribute a criterion, so a voice shipping anywhere gets its criterion written into the platform by hand.

## Wider than WHO, and that is the real finding

The registry is not otherwise generic either. Its own header describes domains 'framework' and 'wall' in terms of a specific math paper — deprecated 5-tuple notation, omega for fibre functor, 'CLAUDE.md section 7c base-ring convention' — and points at .claude/skills/local/one-voice-audit.md. The WHO criteria are one instance of a registry saturated with folio-specific content.

## NOT decided

Whether to (a) derive a voice's criterion from the voice itself so no instance's rules are written into the platform, (b) give an instance a way to contribute criteria and move these four out, or (c) something else. (a) is the principled one and needs a schema decision; (b) needs an extension mechanism that does not exist today.

## Done when

- no criterion in the platform registry restates rules owned by another instance;
- a voice shipping in any instance gets its overlay criterion without a platform edit;
- the folio-specific domains in the registry header are settled the same way or explicitly excepted with a reason.


## 2026-09-21 — derived, and two of the three conditions are met

Owner: 'yes, derive the criteria'. Option (a), the principled one.

`content/pipeline/voice-criteria.ts` derives one criterion per voice from
every voice the repository's instances ship, and the four hand-written entries
are gone from `qa-criteria-registry.ts` (3140 characters of uncited
restatement). `qaCriteriaFor(root)` / `qaCriteriaByIdFor(root)` are the
instance-aware accessors; `QA_CRITERIA_REGISTRY` and `QA_CRITERIA_BY_ID` stay
as the static half.

Derived lazily and memoised per instance root, never at module scope — bean
`1hkj` and `check:module-scope-resolution`: a malformed declaration must not be
able to abort a module and strand its exports.

**The severity is DECLARED, not derived, and that was measured.** The obvious
rule — the worst rule's severity — agrees on `who-editorial` and
`who-guideline-development` and disagrees on the other two:
`who-publication-design` carries `critical` rules and was registered `major`;
`milnor`'s worst rule is `major` and it was registered `minor`. Deriving it
would have silently re-graded half the corpus, so `overlaySeverity` is a field
on the voice with a documented default of `major`.

### The consumers were the larger half of the change

Every by-id lookup against the STATIC index returns `undefined` for a derived
criterion, and each site failed differently:

- `qa-sweep.ts` voice gate — `QA_CRITERIA_BY_ID[id] ?? {}`, and a criterion
  naming no voice always runs. A WHO criterion would have swept a folio that
  never adopted WHO style. **The gate would have stopped gating.**
- `qa-sweep.ts` per-block loop — `if (!def) continue`: absent from every
  sidecar.
- `qa-agent-drain-queue.ts` — filtered the static array for `automated: false`;
  all four voice criteria are exactly that, so four adjudications vanished from
  the queue.
- `qa-merge-findings.ts` — rejected an agent's voice finding as
  `unknown criterion`.
- `qa-staleness.ts`, `integration-audit.ts` — reported a registered criterion
  as unknown.
- `summariseFreshness` in `qa-utils.ts` — its unknown-criterion fallback is
  `["md"]`, which is also a voice criterion's `depends_on`, so it happened to
  be right. Takes an optional index now with that coincidence written down,
  because the fallback exists for a fenced criterion and reading it as cover
  for a registered one would break on the first `depends_on` change.
- `script-sweep.ts` and `semantic-cone.ts` need no change — the first filters
  to `automated && SCRIPT_CHECKERS[id]`, the second to the proof domains.

`scripts/tests/voice-criteria.test.ts` asserts the derivation reproduces what
the four deleted entries declared, with the expected values written out rather
than read off the corpus. `voice-gate.test.ts` now reads the instance-aware
index, which is the consumer-facing half. 91/91 gates pass.

### Still open — the third condition

The `framework` and `wall` domains in the registry header still describe a
specific math paper (deprecated 5-tuple notation, omega for fibre functor, a
`CLAUDE.md section 7c` base-ring convention) and point at
`.claude/skills/local/one-voice-audit.md`. Untouched. That is the remaining
`## Done when` line, so this bean stays open.


Issue: https://github.com/litlfred/folio-assistant/issues/772
PR (draft): https://github.com/litlfred/folio-assistant/pull/773 — branch
`claude/bean-8h42-layout`, pushed as `798e6aca`, 95/95 gates on a branch merged
up to current `main`.

One correction to the consumer list above, after merging main: `criterion-source.ts`
is new from main and also reads the static index, and also needs no change —
both its production callers reach it only for a criterion that is `automated`
or carries a checker, and every voice-overlay criterion is neither.

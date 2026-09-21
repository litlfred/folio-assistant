---
# folio-assistant-btuv
title: 'PLATFORM BOUNDARY: qa-criteria-registry.ts hand-writes one criterion per VOICE, three of them WHO, restating another instance''s rules uncited'
status: todo
type: task
priority: high
created_at: 2026-09-21T16:26:49Z
updated_at: 2026-09-21T16:26:49Z
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

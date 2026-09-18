---
# folio-assistant-bfmf
title: 'The Milnor exposition standard has no page: three references point at a section that does not exist'
status: in-progress
type: task
created_at: 2026-09-18T23:38:18Z
updated_at: 2026-09-18T23:38:18Z
---

`skills/folio-core/exposition-swarm-drain.md` sends the reader to "one-voice style guide -> 'The Milnor exposition standard'" at lines 23, 70 and 220; line 220 spells it `.claude/skills/local/one-voice-style-guide.md`. Neither copy has such a section and the local path does not exist at all. H1-H8 are named only inside the `expo-milnor-clarity` criterion's description string in `content/pipeline/qa-criteria-registry.ts:2031` ("economy, concrete-before-abstract, why-before-what, uncluttered notation, linear argument, prose-carries-argument, right-tool framing, respect for the reader") and are nowhere expanded, so the strict 16/16 gate scores against eight names with no rubric.

Issue #208: "there is an existing 'milnor' voice. agents need to be able to overlay different voices onto content."

## Done when
- `skills/folio-core/one-voice-style-guide.md` carries a "The Milnor exposition standard" section expanding H1-H8, each with what 0/1/2 looks like, so the strict gate is scoreable.
- The three references in `exposition-swarm-drain.md` resolve, and the `.claude/skills/local/` spelling at line 220 is corrected to the path that exists.
- `bun run scripts/gen-skill-docs.ts` regenerated so the published page carries it.

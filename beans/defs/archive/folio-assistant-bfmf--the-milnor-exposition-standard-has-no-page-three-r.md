---
# folio-assistant-bfmf
title: 'The Milnor exposition standard has no page: three references point at a section that does not exist'
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:38:18Z
updated_at: 2026-09-19T00:32:17Z
---

`skills/folio-core/exposition-swarm-drain.md` sends the reader to "one-voice style guide -> 'The Milnor exposition standard'" at lines 23, 70 and 220; line 220 spells it `.claude/skills/local/one-voice-style-guide.md`. Neither copy has such a section and the local path does not exist at all. H1-H8 are named only inside the `expo-milnor-clarity` criterion's description string in `content/pipeline/qa-criteria-registry.ts:2031` ("economy, concrete-before-abstract, why-before-what, uncluttered notation, linear argument, prose-carries-argument, right-tool framing, respect for the reader") and are nowhere expanded, so the strict 16/16 gate scores against eight names with no rubric.

Issue #208: "there is an existing 'milnor' voice. agents need to be able to overlay different voices onto content."

## Done when
- `skills/folio-core/one-voice-style-guide.md` carries a "The Milnor exposition standard" section expanding H1-H8, each with what 0/1/2 looks like, so the strict gate is scoreable.
- The three references in `exposition-swarm-drain.md` resolve, and the `.claude/skills/local/` spelling at line 220 is corrected to the path that exists.
- `bun run scripts/gen-skill-docs.ts` regenerated so the published page carries it.

_2026-09-19T00:32:17Z_ — ## Summary of Changes

Superseded by a better source part-way through: the owner uploaded Milnor's actual paper (`2117d4a9`), so the standard is no longer a house standard named after him.

`library/milnorlink/` — 'Link Groups', Annals of Mathematics 59(2), March 1954, pp. 177-195, ingested at JOURNAL-page granularity so a citation to 'p. 179' resolves to `sections/page-179.md` rather than to a PDF page nobody cites. (JSTOR's embedded outline turned out to be a page index — 'p. 177', 'p. 178' — not the paper's structure, so `pdf-structure.py` collapsed 35 entries to 2 sections: a third variant of `6xaz`, and the reason `pdf-pages.py` gained `--first-page-label`.)

H1-H8 are written out with 0/1/2 for each, every row evidenced from a page, and the three dangling references are repointed. Twelve rules in `voices/milnor.json`, each quoting the paper.

**Three of them exist because the measurement contradicted us:**
- `clearly` is proof economy, not editorializing — 14 uses in 8899 words, every one routing reader effort away from a routine check. Our own `voice-editorializing` fails the exemplar 14 times. Beaned separately.
- 'Never I' is too blunt: exactly ONE first-person singular in the paper ('I am indebted to R. H. Fox'), against 20 uses of 'we'. A personal debt is stated personally; the mathematics is joint.
- Concrete-before-abstract is a property of the PAPER, not the section: §2 opens on pure abstraction and scores 2, because §1 already gave the picture.

Also measured: zero superlatives, one hedge in the whole paper, zero second person, median sentence 17 words.

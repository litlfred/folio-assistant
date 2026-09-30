---
$schema: folio-fsh-guts/v1
title: "The `capability:` field in SKILL front matter — 19 topic tags, read by nothing, naming no Capability"
kind: retired-field
movedOn: 2026-09-30
movedFrom: "front matter of 19 `*.md` files under `cat-harness/skills/folio-core/` and `cat-harness/skills/graph-management/`, and the `· Capability: …` part of 16 `> Skill id:` body lines"
bean: folio-assistant-zmm2
issue: 1168
summary: >-
  An informal topic tag (review, architecture, quality-assurance, translation, schema, interaction, authoring) on 19 of about 190 skills. Nothing read it, nothing validated it, it is not in the SKILL.md front-matter spec, and none of its seven values is a Capability id — so the rename the #1168 B8 analysis proposed, to `requiresCapability`, would have asserted something false. Where the tag carried placement, that placement already lived on a role (`Role.skills`) or in the package; the five skills no role carried were added to one. First written 2026-09-18 (1c38f4da106), beside `package:`, and copied into later skills from there.
---

# `capability:` in skill front matter — the whole record

**Removed 2026-09-30** under bean `folio-assistant-zmm2` (#1168 B9d). The
owner chose to rename it to `requiresCapability`; measurement showed its
values are categories, not Capability ids, and the owner then chose to
**retire** it and asked where its content should go.

## Why it could go

- **No reader.** No script, schema, template or generator reads a skill's
  front-matter `capability`. `scripts/front-matter.ts` reads `name`,
  `description`, `input` and `output`; `gen-skill-docs.ts` strips front matter.
  The `Capability` NODE (`.claude/skills/capabilities/*.json`,
  `requiresCapabilities`, `providesCapabilities`) is a different thing.
- **No vocabulary.** None of the seven values names a Capability node, and two
  overlap (`review` and `quality-assurance`).
- **Sparse.** 14 of about 190 folio-core skills carried it; in
  `graph-management` it equalled the package on every file.

## Where the content went

Placement is the dependent pointing at the general node (#1168 rule 1): a
**role** carries the skills its lane uses. So a skill's topic is answered by
the roles that carry it, and by its package.

- `architecture` (graph-management): the package itself.
- `review`, `quality-assurance`, `translation`: the roles already carrying
  each skill.
- The five skills no role carried were ADDED to one in
  `scenarios/roles.json` (owner, 2026-09-30, "As proposed"):
  `code-lists`, `vocabulary-authority` → `terminologist`;
  `communication-language` → `session-coordinator`;
  `edge-kinds-and-blast-radius`, `graph-rendering` → `platform-authoring-agent`.
- The one mention that named a real Capability — `smart-base-tools.md`'s
  body line `Capability: smart-base` — became `requiresCapabilities:
  ["…", "smart-base"]` on the `authoring-who-smart-guidelines` package.

## History

- 2026-09-18: first written, in `1c38f4da106` (translation support), beside
  `package:`; and `23116788b8b` (staging review).
- 2026-09-20: reached `graph-management` in `c60db70f59c`.
- Later skills copied it from those; `kg-separation.md` on 2026-09-30.

## Inventory — every value, and where it is answered now

| file | `capability:` | answered by |
|---|---|---|
| `cat-harness/skills/folio-core/adjudication.md` | `review` | roles `user`, `reviewer`, `narrative-reviewer`, `adjudicator` |
| `cat-harness/skills/folio-core/code-lists.md` | `authoring` | role `terminologist` (added) |
| `cat-harness/skills/folio-core/communication-language.md` | `interaction` | role `session-coordinator` (added) |
| `cat-harness/skills/folio-core/evidence-review.md` | `quality-assurance` | roles `qc-reviewer` |
| `cat-harness/skills/folio-core/github-state-inspection.md` | `review` | roles `authoring-agent` |
| `cat-harness/skills/folio-core/narrative-asserts-code.md` | `review` | roles `reviewer` |
| `cat-harness/skills/folio-core/publish-verification.md` | `review` | roles `publication-manager`, `build-pipeline` |
| `cat-harness/skills/folio-core/review-comments.md` | `review` | roles `review-coordinator` |
| `cat-harness/skills/folio-core/review-heatmap.md` | `review` | roles `review-coordinator` |
| `cat-harness/skills/folio-core/staging-review.md` | `review` | roles `author`, `reviewer`, `review-coordinator` |
| `cat-harness/skills/folio-core/translation-manager.md` | `translation` | roles `reviewer`, `narrative-reviewer`, `translation-coordinator`, `translator`, `translation-adjudicator`, `authoring-agent`, `build-pipeline` |
| `cat-harness/skills/folio-core/untainted-verification.md` | `quality-assurance` | roles `qc-reviewer`, `adjudicator` |
| `cat-harness/skills/folio-core/visual-diff.md` | `review` | roles `reviewer`, `review-coordinator` |
| `cat-harness/skills/folio-core/vocabulary-authority.md` | `schema` | role `terminologist` (added) |
| `cat-harness/skills/graph-management/domain-fencing.md` | `architecture` | the package `graph-management` (directory + manifest) |
| `cat-harness/skills/graph-management/edge-kinds-and-blast-radius.md` | `architecture` | role `platform-authoring-agent` (added) |
| `cat-harness/skills/graph-management/graph-detanglement.md` | `architecture` | the package `graph-management` (directory + manifest) |
| `cat-harness/skills/graph-management/graph-rendering.md` | `architecture` | role `platform-authoring-agent` (added) |
| `cat-harness/skills/graph-management/kg-separation.md` | `architecture` | the package `graph-management` (directory + manifest) |

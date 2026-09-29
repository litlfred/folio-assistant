---
$schema: folio-fsh-guts/v1
title: "The `package:` field in SKILL front matter — 18 annotations, each restating its own directory"
kind: retired-field
movedOn: 2026-09-29
movedFrom: "front matter of 18 `*.md` files under `cat-harness/skills/folio-core/` and `cat-harness/skills/graph-management/`"
bean: folio-assistant-a0s3
issue: 1168
summary: >-
  Package membership was stated three times: the package manifest's `skills` list, the directory the file sits in, and this front-matter key. Nothing read the key. Every one of the 18 values equalled the name of the directory holding the file, so the key carried no information the directory did not. First written 2026-09-18 (1c38f4da106, 23116788b8b) and copied into later skills from there.
---

# `package:` in skill front matter — the whole record

**Removed 2026-09-29** under bean `folio-assistant-a0s3` (#1168 B8), from the
string-to-reference analysis (#1168 comment 5803006038): *"package
membership is stated three times: `manifest.skills`, skill front matter
`package:`, and the directory. Delete `package:`. Nothing reads it."*

## Why it could go without migrating anything

- **No reader.** No script, schema or generator reads a skill's front-matter
  `package`. The `package` fields elsewhere in the tree are different
  fields: `workflow-policy.json`'s `package`, `assistant-package.ts`'s OS
  packages, and FHIR IG template packages.
- **No information.** Every value below equals the directory the file sits
  in. The two remaining statements, the directory and the manifest, still say
  the same thing, and `skill:register:check` already checks that they agree.

## History

- 2026-09-18: first written, in `1c38f4da106` (translation support) and
  `23116788b8b` (staging review).
- 2026-09-20: reached `graph-management` in `c60db70f59c`.
- Later skills copied it from those.

## Inventory — every value, per file

| file | `package:` | directory |
|---|---|---|
| `cat-harness/skills/folio-core/adjudication.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/code-lists.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/communication-language.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/evidence-review.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/github-state-inspection.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/narrative-asserts-code.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/publish-verification.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/review-comments.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/review-heatmap.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/staging-review.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/translation-manager.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/untainted-verification.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/visual-diff.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/folio-core/vocabulary-authority.md` | `folio-core` | `folio-core` |
| `cat-harness/skills/graph-management/domain-fencing.md` | `graph-management` | `graph-management` |
| `cat-harness/skills/graph-management/edge-kinds-and-blast-radius.md` | `graph-management` | `graph-management` |
| `cat-harness/skills/graph-management/graph-detanglement.md` | `graph-management` | `graph-management` |
| `cat-harness/skills/graph-management/graph-rendering.md` | `graph-management` | `graph-management` |

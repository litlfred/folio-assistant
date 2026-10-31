---
name: block-change-summary
description: >-
  Post-delivery content block change summary for a folio edit-set: extract
  changed block labels across `.md`, `.ts` and content-type sibling files,
  present a per-chapter table with `.md`-first GitHub blob links, modified
  sibling links, local viewer anchors, and change categories. Refines
  `delivery-summary` for content folios.
---

# Block Change Summary

> Skill id: `block-change-summary` · Package: `content-lifecycle-ext` ·
> Refines [`delivery-summary`](../../../../cat-harness/skills/sdlc/sdlc-core/delivery-summary.md) for content folios (placement PR2, bean `pzwb`).

When delivering changes in a content folio (alongside the server restart
command, commit/diff links, and staging links from
[`delivery-summary`](../../../../cat-harness/skills/sdlc/sdlc-core/delivery-summary.md)),
list every content block that changed, with a clickable link and a short
explanation of what changed.

## 1. How to find changed blocks

Extract labels from changed content blocks: the `.ts` manifest, the `.md`
content and whatever sibling file the content type adds (a `.md`-only edit is
still a block change). Add the content type's sibling extensions to the
pathspec; a paper folio, for example, adds `'content/**/*.lean'`:

```bash
# Collect changed content files (any sibling triggers the block)
changed=$(git diff origin/main..HEAD --name-only -- \
  'content/**/*.ts' 'content/**/*.md' \
  | grep -v '/rendered/' | grep -v 'schema/' | grep -v 'pipeline/')

# For each, resolve to the sibling .ts and pull the label
for f in $changed; do
  ts="${f%.*}.ts"
  [ -f "$ts" ] || continue
  label=$(grep -oP "label:\s*['\"]\\K[^'\"]+" "$ts" 2>/dev/null || echo "")
  [ -n "$label" ] && echo "$ts|$label"
done | sort -u
```

## 2. Link format

The viewer runs on `localhost:<viewer_port>` (from the instance's viewer
configuration). Each block links via its label anchor:

```
http://localhost:8080/assistant/#<label>
```

## 3. Presentation format

Group by chapter. Use a markdown table with columns: **Block** (clickable
link — ALWAYS to the `.md` file), **Siblings changed** (GitHub blob links to
`.ts` or the content type's other siblings that **also changed**), **What changed** (1-line
description).

**Rule: the Block column always links to the `.md` file.** Sibling
links (`.ts` and any other sibling) appear in a separate column and only
when that sibling was actually modified in this delivery.

| Block | Siblings changed | What changed |
|-------|------------------|-------------|
| [def:central-object](https://github.com/<owner>/<repo>/blob/<branch>/content/.../central-object.md) | [ts](https://github.com/<owner>/<repo>/blob/<branch>/content/.../central-object.ts) | Updated notation |
| [sec:scope](https://github.com/<owner>/<repo>/blob/<branch>/content/.../scope.md) | — | Added first SVG render |

Viewer anchor links (`http://localhost:8080/assistant/#<label>`) may be
included as an additional row-end column when the folio-assistant is
running locally, but the `.md` blob URL is the canonical reference.

## 4. GitHub blob links — ALWAYS PROVIDE, ALWAYS `.md` FIRST

For **every** created or modified block file, include a direct GitHub blob URL
using the pattern:

```
https://github.com/<owner>/<repo>/blob/<branch>/<relative-path>
```

**The primary link for a block is always the `.md` file.** Sibling
files (`.ts` and the content type's others) are listed only if they were
actually modified. Never make a sibling the primary clickable link
for a block reference — readers want narrative first.

This applies to **all** file kinds: `.md`, `.ts`, the content type's
siblings, config files, etc. Never report "created/edited `foo.md`" without also
giving its clickable GitHub blob link on the pushed branch.

If the branch is not yet pushed, say so explicitly — do not fabricate a
URL that will 404.

## 5. Categorize changes

Explain the nature of changes — don't just list files. Common categories:
- **Narrative edit**: `.md` content was modified
- **Re-rendered SVG**: notation/style change caused SVG hash update
- **New SVG render**: block got its first rendered SVG
- **Structural change**: label, uses[], a sibling reference, or kind changed
- **New block**: entirely new content block added

## Example block table in a delivery summary

Combined with [`delivery-summary`](../../../../cat-harness/skills/sdlc/sdlc-core/delivery-summary.md) and [`staging-review`](../../../../cat-harness/skills/sdlc/sdlc-core/staging-review.md):

> ### Changed content blocks
>
> **Chapter 1:**
>
> | Block | Siblings changed | What changed |
> |-------|------------------|-------------|
> | [def:central-object](https://github.com/<owner>/<repo>/blob/claude/feature-xyz/content/.../central-object.md) | [ts](https://github.com/<owner>/<repo>/blob/claude/feature-xyz/content/.../central-object.ts) | Rewrote point 3 for clarity |
> | [rule:main-criterion](https://github.com/<owner>/<repo>/blob/claude/feature-xyz/content/.../main-criterion.md) | — | Re-rendered SVG (notation update) |
> | [sec:scope](https://github.com/<owner>/<repo>/blob/claude/feature-xyz/content/.../scope.md) | — | Added first SVG render |

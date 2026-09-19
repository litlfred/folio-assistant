---
name: delivery-summary
description: Post-delivery summary with server restart command and viewer links
roles: [reader, collaborator, owner]
user_invocable: true
---

# Delivery Summary

After completing a feature or edit (i.e., after pushing changes), provide:

## 1. Server restart command

A single copy-paste block to fetch, switch to the branch, pull, and restart:

```bash
git fetch origin <BRANCH> && git switch <BRANCH> && git pull origin <BRANCH> && ./scripts/start-folio-assistant.sh --http
```

Replace `<BRANCH>` with the actual branch name you pushed to.

## 2. Content block change links

**This is the most important part.** List every content block that changed,
with a clickable viewer link and a short explanation of what changed.

### How to find changed blocks

Extract labels from changed content `.ts`/`.md`/`.lean` triples
(a `.md`-only edit is still a block change):

```bash
# Collect changed content files (any sibling triggers the block)
changed=$(git diff origin/main..HEAD --name-only -- \
  'content/**/*.ts' 'content/**/*.md' 'content/**/*.lean' \
  | grep -v '/rendered/' | grep -v 'schema/' | grep -v 'pipeline/')

# For each, resolve to the sibling .ts and pull the label
for f in $changed; do
  ts="${f%.*}.ts"
  [ -f "$ts" ] || continue
  label=$(grep -oP "label:\s*['\"]\\K[^'\"]+" "$ts" 2>/dev/null || echo "")
  [ -n "$label" ] && echo "$ts|$label"
done | sort -u
```

### Link format

The viewer runs on `localhost:<viewer_port>` (from `lean-mcp.config.json`).
Each block links via its label anchor:

```
http://localhost:8080/assistant/#<label>
```

### Presentation format

Group by chapter. Use a markdown table with columns: **Block** (clickable
link — ALWAYS to the `.md` file), **Siblings** (GitHub blob links to
`.ts`/`.lean`/etc. that **also changed**), **What changed** (1-line
description).

**Rule: the Block column always links to the `.md` file.** Sibling
links (`.ts`, `.lean`, `.tex`) appear in a separate column and only
when that sibling was actually modified in this delivery.

| Block | Siblings changed | What changed |
|-------|------------------|-------------|
| [def:central-object](https://github.com/<owner>/<repo>/blob/<branch>/content/.../central-object.md) | [ts](https://github.com/<owner>/<repo>/blob/<branch>/content/.../central-object.ts) · [lean](https://github.com/<owner>/<repo>/blob/<branch>/content/.../central-object.lean) | Updated notation |
| [prf:main-lemma](https://github.com/<owner>/<repo>/blob/<branch>/content/.../main-lemma.md) | — | Added first SVG render |

Viewer anchor links (`http://localhost:8080/assistant/#<label>`) may be
included as an additional row-end column when the folio-assistant is
running locally, but the `.md` blob URL is the canonical reference.

### GitHub blob links — ALWAYS PROVIDE, ALWAYS `.md` FIRST

For **every** created or modified file, include a direct GitHub blob URL
using the pattern:

```
https://github.com/<owner>/<repo>/blob/<branch>/<relative-path>
```

**The primary link for a block is always the `.md` file.** Sibling
files (`.ts`, `.lean`, `.tex`) are listed only if they were actually
modified.  Never make the `.ts` or `.lean` the primary clickable link
for a block reference — readers want narrative first.

This applies to **all** file kinds: `.md`, `.ts`, `.lean`, `.tex`, config
files, etc.  Never report "created/edited `foo.md`" without also
giving its clickable GitHub blob link on the pushed branch.

If the branch is not yet pushed, say so explicitly — do not fabricate a
URL that will 404.

### Categorize changes

Explain the nature of changes — don't just list files. Common categories:
- **Narrative edit**: `.md` content was modified
- **Re-rendered SVG**: notation/style change caused SVG hash update
- **New SVG render**: block got its first rendered SVG
- **Structural change**: label, uses[], lean ref, or kind changed
- **New block**: entirely new content block added

### Remote/deployed links

For remote/deployed builds:
- **GitHub Pages**: `https://<owner>.github.io/<repo>/`
- **Draft preview** (feature branches): `https://<owner>.github.io/<repo>/drafts/<branch>/`

## 3. GitHub links

Always provide:
- **File blob links**: `https://github.com/<owner>/<repo>/blob/<branch>/<path>`
  for every created/modified file (see §2, "GitHub blob links — ALWAYS
  PROVIDE")
- **Commit links**: `https://github.com/<owner>/<repo>/commit/<hash>` for each commit
- **Branch diff**: `https://github.com/<owner>/<repo>/compare/main...<branch>`

## Example output

After pushing changes to `claude/feature-xyz`:

> **Restart & preview:**
> ```bash
> git fetch origin claude/feature-xyz && git switch claude/feature-xyz && git pull origin claude/feature-xyz && ./scripts/start-folio-assistant.sh --http
> ```
>
> ### Changed content blocks
>
> **Chapter 1:**
>
> | Block | What changed |
> |-------|-------------|
> | [def:central-object](http://localhost:8080/assistant/#def:central-object) | Rewrote axiom 3 for clarity |
> | [prop:main-relation](http://localhost:8080/assistant/#prop:main-relation) | Re-rendered SVG (notation update) |
> | [prf:main-lemma](http://localhost:8080/assistant/#prf:main-lemma) | Added first SVG render |
>
> **Commits:**
> - [Rewrite axiom 3](https://github.com/<owner>/<repo>/commit/abc123)
> - [Re-render SVGs](https://github.com/<owner>/<repo>/commit/def456)
>
> **Full diff:** [main...claude/feature-xyz](https://github.com/<owner>/<repo>/compare/main...claude/feature-xyz)

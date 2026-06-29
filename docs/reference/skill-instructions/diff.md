---
layout: default
title: Diff
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/diff.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/diff.md) — do not edit here.

{% raw %}
# Diff — Content Block Change Report

Show what changed at the content-block level, with viewer links and
explanations. This is the primary way the user sees what an agent did.

## When to invoke

- After pushing changes (replaces delivery-summary)
- When user asks "what changed", "diff", "show changes"
- At the end of any editing session

## 1. Server restart command

```bash
git fetch origin <BRANCH> && git switch <BRANCH> && git pull origin <BRANCH> && ./scripts/start-folio-assistant.sh --http
```

## 2. Per-block change report

**This is the most important part.** Every changed content block gets a
clickable viewer link and 1-line explanation.

### Finding changed blocks

```bash
for f in $(git diff origin/main..HEAD --name-only -- 'content/**/*.ts' | grep -v '/rendered/' | grep -v 'schema/' | grep -v 'pipeline/'); do
  label=$(grep -oP "label:\s*['\"]\\K[^'\"]+" "$f" 2>/dev/null || echo "")
  if [ -n "$label" ]; then echo "$f|$label"; fi
done
```

### Viewer link format

```
http://localhost:8080/assistant/#<label>
```

Port from `lean-mcp.config.json` `viewer_port`. Use `assistant/` (not
`viewer/`) since the assistant has changelog, before/after toggle, and
undo built in.

### Presentation

Group by chapter. Markdown table: **Block** (link), **What changed**.

| Block | What changed |
|-------|-------------|
| [def:central-object](http://localhost:8080/assistant/#def:central-object) | Rewrote axiom 3 |
| [prf:main-lemma](http://localhost:8080/assistant/#prf:main-lemma) | Added first SVG render |

### Change categories

- **Narrative edit**: `.md` content modified
- **Re-rendered SVG**: notation/style change → SVG hash update
- **New SVG render**: block got first rendered SVG
- **Structural change**: label, uses[], lean ref, or kind changed
- **New block**: entirely new content block added
- **Removed block**: block deleted

## 3. Viewer features for reviewing changes

Point the user to these built-in viewer features:

- **Changelog** (`hist` button on each block): shows git log for that
  block's files, with commit links
- **Before/after toggle** (`prev` button on rendered SVGs): switches
  between current and previous version of the SVG
- **Undo** (`undo` button, collaborator+): shows downstream impact
  analysis before reverting

## 4. GitHub links

- **Commits**: `https://github.com/<owner>/<repo>/commit/<sha>`
- **Branch diff**: `https://github.com/<owner>/<repo>/compare/main...<branch>`

## 5. Undo guidance

When users ask to "undo" or "revert" a block change:

1. The viewer's `undo` button calls `/api/undo-impact` which walks the
   reverse `uses[]` dependency graph
2. It shows direct dependents (blocks that `uses` the target) and
   transitive dependents (further downstream)
3. The user confirms before the revert proceeds via `/api/block/revert`
4. Agents should also use `/api/undo-impact` before reverting
   programmatically — never revert without showing consequences

## API endpoints (for agents)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/diff?id=<paper>&base=main&head=<branch>` | GET | Full paper diff |
| `/api/block-changelog?label=<label>&limit=N` | GET | Git log for a block |
| `/api/content-asset-at/<sha>/<paper>/<ch>/rendered/<file>` | GET | SVG at a specific commit |
| `/api/undo-impact?label=<label>` | GET | Reverse dependency analysis |
| `/api/block/revert` | POST | Revert block .md to a commit |

## Example output

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
>
> In the viewer, click `hist` on any block to see its full changelog,
> or `prev` on rendered diagrams to compare before/after.
>
> **Commits:**
> - [Rewrite axiom 3](https://github.com/<owner>/<repo>/commit/abc123)
>
> **Full diff:** [main...claude/feature-xyz](https://github.com/<owner>/<repo>/compare/main...claude/feature-xyz)
{% endraw %}

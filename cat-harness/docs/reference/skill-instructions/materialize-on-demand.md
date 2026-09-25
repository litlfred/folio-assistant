---
layout: default
title: 'Materialize on demand'
parent: Skill instructions
---

{: .note }
> Generated from [`large-datasets/skills/materialize-on-demand.md`](https://github.com/litlfred/folio-assistant/blob/main/large-datasets/skills/materialize-on-demand.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/large-datasets/skills/materialize-on-demand.md){: .fa-edit-source }

{% raw %}
# Materialize on demand

Bootstrap brings an agent to a working harness. It does **not** bring the
corpus, and must not: `who-iris` alone is 1,057,223 files and 361.55 GB
(IRIS's own storage report, read 2026-09-20). What arrives is the
**reference**. Owner, 2026-09-20: *"user can ask (as they come in need to
use) if they want to material parts of subgraphs."*

This skill is that ask. The gates are not here; they are in
[`materialize-remote`](materialize-remote.md), once.

## 1. What is already here

```sh
bun run cache:index          # summary and eviction candidates
bun run cache:index --all    # every copy
```

Read the columns for what they are:

| column | values | what it means |
|---|---|---|
| size | `recorded` · `measured` · `directory` · `absent` | `measured` is the file now, not when it landed. A directory is counted through its parts. `absent` is not zero. |
| fetched | a date, or `not recorded` | only the record's `materializedAt` |
| last read | `not recorded`, always | nothing records reads. The owner chose to say so rather than read file access times, which are often off or reset by a checkout. |
| freshness | `fresh` · `expired` · `no-expiry` · `permanent` | from `freshness()`. `no-expiry` is a finding: a working copy nobody gave a lifetime. |

If what they want is already held and fresh, stop: point them at it.

## 2. Put a number on the ask BEFORE anything moves

"The user can ask" must not mean 361 GB arrives without a number first. Before
calling `materialize-remote`:

- **Name the subset** in the source's own terms: its identifiers, or a subset
  strategy its descriptor (`large-datasets/sources/`) supports.
- **Close it over dependencies** if the descriptor says the subset is not
  self-contained (`subsetIsSelfContained: false`, mathlib). The size that
  matters is the closure's.
- **State the size and its basis**: from the descriptor's enumeration, or a
  measured listing. If neither gives a number, say that. The SIZE gate
  refuses on an unknown, and so should this conversation.
- **Say what it would add** to the cache total from step 1.

Then ask the person, with the number in front of them.

## 3. Materialize

Run `Process_MaterializeRemote`. Its five gates decide; this skill does not
second-guess them. A refusal leaves the content `referenced`, with the reason
recorded. That is the process working, not failing.

## 4. Eviction is a report

`cache:index` lists candidates: `expired` first, then `no-expiry` working
copies, largest first. **An archival copy is never a candidate.** Nothing is
removed by the tool or by you. Show the list with sizes and reasons, and let
the person decide (`deletion-requires-confirmation`). Its worked example,
`plj1`, is a workflow whose shape deleted every open PR's preview with nobody
deciding.
{% endraw %}

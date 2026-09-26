---
layout: default
title: '/repo-conversion'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/repo-conversion.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/repo-conversion.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/repo-conversion.md){: .fa-edit-source }

{% raw %}
# /repo-conversion — folio-assistant over a repo that already has a life

Process: [`processes/getting-started.bpmn`](../../processes/getting-started.html),
`Task_ScanRepo` and `Task_ConfirmImport` (non-relaxable).
Scanner: `bun run scripts/scan-repo-content.ts`.

## 0. The one rule

**Scan, show, ask, then move — and never in any other order.** The author's
repository is the thing of value in this operation; the scaffolding is
replaceable and takes ninety seconds to regenerate. An import that guessed wrong
about which of their files were sources and which were drafts is not fixed by a
`git checkout`, because the author now has to work out what the agent did.

`Task_ConfirmImport` is marked `relaxable="false"` in the BPMN for this reason,
and a content package may not declare it away.

## 1. Scan — read-only, and honest about its limits

```sh
bun run scripts/scan-repo-content.ts            # human-readable report
bun run scripts/scan-repo-content.ts --json     # same, as facts
```

It walks the working tree (respecting `.gitignore`) and sorts what it finds into
**three** buckets:

| bucket | means | typical |
|---|---|---|
| `library` | external source material — something somebody else wrote, that the folio will cite or ingest | PDFs, papers, scans, datasets, `references/`, `papers/`, `sources/` |
| `content` | material authored here, that could become folio blocks | Markdown prose, `docs/`, `notes/`, `drafts/`, `.tex` |
| `unclassified` | it could not tell | everything else, and it is reported, not hidden |

**`unclassified` is the point.** A scanner that forces every file into one of
two buckets has an accuracy that cannot be assessed, and its mistakes arrive as
moved files. This one reports what it could not place, and the author disposes
of it. The same third-state discipline as `readme-sections.ts` ("could not
determine" is never rendered as "empty") and `pages-live-gate.dmn`.

The classification is by **path convention and extension only**. It does not
read file contents, does not call a model, and is not trying to be clever —
it is trying to be *fast, explicable and reversible*, so the author can
disagree with any row of it in one word.

## 2. Show, then ask — three questions, all as selections

Present the scan as counts and a handful of examples per bucket, never as a
1,400-line file list. Then three questions, each answerable by picking. Load
[`interaction-modality`](interaction-modality.md) first.

**Q1 — import at all?**
1. Import everything the scan found *(recommended)*
2. Import only the `library` bucket — sources now, prose later
3. Import nothing; just set up folio-assistant
4. Let me pick bucket by bucket

**Q2 — where does each group go?** Only for groups the scan was not confident
about, and only when Q1 was not "nothing". Offer `library/` vs `content/` per
*directory*, not per file — a per-file interrogation of 400 PDFs is the
accessibility failure in [`interaction-modality`](interaction-modality.md) §0
with extra steps.

**Q3 — leave in place, or reorganise?**
1. **Leave everything where it is** *(recommended)* — the folio references the
   files at their current paths. Nothing moves, every existing link still
   works, and the decision stays open.
2. Reorganise into `library/` and `content/` — tidier, and it rewrites paths.
   Offer this only on a clean working tree, do it in its own commit, and use
   `git mv` so history follows.

Recommend **leave in place** by default and mean it. Decluttering is a
preference; a broken relative link in somebody's README is a defect.

## 3. Dispatch the ingestion

Ingestion proper is [`document-intake`](document-intake.md)
and `processes/document-ingestion.bpmn`. What this skill decides is *how
much parallelism*, and it is a question for the author because it spends their
tokens:

| scale | when | how |
|---|---|---|
| **inline** | under ~10 documents | do it here, no subagents |
| **one agent** | tens of documents, one kind | a single background agent, reporting per document |
| **small swarm** | hundreds, or several distinct kinds | [`dispatch-agent`](dispatch-agent.md) — 2–4 agents partitioned **by directory**, never by file count |

Partition by directory because a per-file partition puts two agents in the same
manifest, and the resulting conflicts cost more than the parallelism saved.

Open one bean per ingestion front before dispatching — running the existence
check in [`todo-manager.md`](todo-manager.md) §"Check before you create" first —
so a session that dies mid-import leaves a plan behind rather than a half-full
`library/`.

## 4. The conversion itself

Once Q1–Q3 are answered, `folio_init` against the existing directory. It refuses
rather than overwrites where a file is already present, which on this branch is
the common case (`README.md`, `.gitignore`, a `docs/`). Read its report rather
than assuming; the files it declined to write are the ones you now merge by
hand:

- **`AGENTS.md`** — if one exists, merge; do not replace. An existing `AGENTS.md`
  is the most valuable file in the repository for the next agent.
- **`README.md`** — never replaced. `readme-sections.ts` only writes inside
  marker pairs the author has opted into, so offer to add markers rather than
  content.
- **`.gitignore`** — append the folio entries; keep theirs.

## 5. Anti-patterns

1. **Moving a file before Q3 is answered.** The non-relaxable step exists
   because this is the tempting one.
2. **Reporting a two-bucket classification.** If `unclassified` is empty on a
   real repository, suspect the scanner rather than celebrate it.
3. **A per-file confirmation loop.** See §2.
4. **Swarming a 12-document import.** The dispatch overhead exceeds the work.
5. **Replacing an existing `AGENTS.md` or `README.md`.** Merge, or leave.
6. **Treating the scan as ingestion.** It reads; it never writes. Ingestion is
   a separate process with its own diagram and its own gate.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Getting started](../../processes/getting-started.html) | Scan the repo for content worth importing; Import what, where, and who does it; Create the repository |


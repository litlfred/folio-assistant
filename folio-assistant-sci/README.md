# folio-assistant-sci

Scientific source material used by folios that formalise mathematics. Staged as
a top-level directory ahead of becoming its own repository — the same
arrangement as [`who-iris/`](../who-iris/) and
[`folio-assistant-core/`](../folio-assistant-core/).

## What is here

One document, and it is the reason this instance exists.

| | |
|---|---|
| `library/milnorlink/` | The source text the derived `milnor` skill reads. 64 tracked files. |
| `library/image-verdicts.json` | The image-role judgements for it — one document's worth, split from the file that used to judge four. |

## Why it is not in `who-iris/`

`milnorlink` was the fourth entry under `cat-harness/library/`, beside three WHO
IRIS publications. It is **not an IRIS item** and never was: no handle, no
DSpace UUID, no collection path, nothing in the catalogue that names it.

Sending it to `who-iris/` would have been the cheaper move and the wrong one — a
repository named for one catalogue is not a place to keep things that belong to
another, and the next agent looking for the WHO corpus would have found a
mathematics paper in it with no way to tell why. Bean `r1lz` called this
destination before the move; bean `frs5` made it.

## Why it is not in `cat-harness/`

`AGENTS.md` states the rule this instance is an application of:

> **folio-assistant is the platform, not the content.**

`cat-harness/library/` held 1,431 files of somebody else's writing inside the
repository that ships the skills, schemas and pipeline for working with it.
Every one of those files has now left; `cat-harness` declares no `library`
graph at all, because a declared-and-empty directory is the `dh4f` defect —
a consumer scans nothing and reports a clean run over it.

The **pipeline** stays platform-side. OCR, ingestion, the JSON-LD generator and
the L1 completeness gate are all still in `cat-harness/`, and they read this
library through the declaration rather than through a path anyone wrote down.

## How it is reached

`folio-assistant-sci.json` here declares `library/` under the conventional id, so this
instance's own tooling resolves it directly. `cat-harness/cat-harness.json`
additionally declares it as `folio-assistant-sci-library`, repository-scoped,
because the consumers that scan libraries — `check:l1-complete`, the narrative
queue, `gen-library-jsonld`, the MCP server's graph roots — run from that root
and a library they cannot see is a corpus they pass silently.

Those consumers now fan out over **every** declared library rather than taking
the first (bean `a02m`). Before that change this move would have made half the
corpus invisible to them, with every gate still green.

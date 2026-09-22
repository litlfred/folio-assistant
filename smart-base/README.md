# smart-base

The **WHO SMART Guidelines base layer** — the ingested WHO digital-health
corpus, the methodologies read out of it, and the editorial voices derived
from it.

Staged as a top-level directory ahead of becoming its own repository, the same
path `who-iris`, `smart-trust` and `smart-immunizations` are on.

## What this layer is for

WHO digital health guidance is spread across many publications that do not
speak with one voice, and the **Digital Implementation Investment Guide**
carries the process content the digital transformation handbooks build on.
This layer is where those documents become something a tool can read: L1
sections under `library/`, methodologies adopted from them, and voice profiles
whose every rule cites the page it was read from.

## What it is not

**It is not a copy of `WorldHealthOrganization/smart-base`.** That repository
stays the authoritative home of the DAK toolchain — ~54 Python scripts whose
callers are the DAK repositories' own GitHub Actions. This layer references it
and never vendors it; `smart-base-tools` carries the wrapper and the argument.

**It holds no position on the IG pipeline layering.** Bean `nsbb` rules that a
per-IG harness should not exist and that the DAK/IG pipeline belongs in an IG
base. That restructure is `nsbb`'s; this layer is the harness it called for,
holding KG assets.

## Re-deriving an entry

```sh
bun run ingest uploads/FILE.pdf --library smart-base
```

Nothing under `library/` is authored, so nothing under it is edited. A wrong
section is a defect in the rung that read it or in the upstream document — see
[`AGENTS.md`](AGENTS.md).

## Counts

Deliberately absent. A count written in prose is a claim that has already begun
to drift; re-derive it from the directory rather than reading it here.

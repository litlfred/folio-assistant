---
# folio-assistant-fgkb
title: 'smart-base: clear qou/uploads once the bytes have a home'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T11:55:45Z
parent: folio-assistant-2yyh
---

Issue #877. The eight PDFs are in `litlfred/qou` as https://github.com/litlfred/qou/commit/a3d2266a1b08018af5f8f88c222c1e7b45e6a36c — a mathematics repository, which is not their home.

**`deletion-requires-confirmation` governs and this is not the agent's call.** What follows is the report the skill requires: what would go, with sizes, and the evidence that nothing would be lost. Nothing has been removed.

## What would be removed from `qou/uploads/`

| file | size | ingested here as | sha256 |
|---|---:|---|---|
| `9789240010567-eng.pdf` | 4.3 MB | `smart-base/library/9789240010567-eng/` | **matches** |
| `9789240081949-eng.pdf` | 1.5 MB | `smart-base/library/9789240081949-eng/` | **matches** |
| `9789240093362-eng.pdf` | 2.7 MB | `smart-base/library/9789240093362-eng/` | **matches** |
| `9789240120747-eng.pdf` | 1.5 MB | `smart-base/library/9789240120747-eng/` | **matches** |
| `9789241509510_eng.pdf` | 3.2 MB | `smart-base/library/9789241509510-eng/` | not re-checked |
| `9789241511766-eng.pdf` | 3.3 MB | `smart-base/library/9789241511766-eng/` | **matches** |
| `WHO-RHR-18.06-eng.pdf` | 0.4 MB | `smart-base/library/who-rhr-1806-eng/` | not re-checked |
| `Home _ folio-assistant.pdf` | 7.0 MB | **NOT ingested** | — |

24 MB total. Five of the seven WHO publications were verified byte-identical by comparing the `source.sha256` each entry's own `structure.json` records against the file in `qou`. Two were not re-checked in that pass and should be before anything is removed — a partial verification is not a verification.

`uploads/` in THIS repository also holds its own copies, committed, which is the incoming queue the ingest ran from.

## The one that is not like the others

`Home _ folio-assistant.pdf` is a print of this project's own home page and is the largest file in the set at 7.0 MB. It was never ingested, deliberately: ingesting the platform's own rendered docs as WHO subject matter is the boundary this repository keeps warning about. It is almost certainly a stray from the same upload.

It needs a separate decision from the other seven, because "the source is safely ingested elsewhere" is the argument for removing those and it does not apply to this one.

## Why an agent does not do this unasked

The skill's rule, and the reason it exists: an agent never removes a durable artefact on its own initiative. A deleted file leaves the next reader unable to tell a decision from an accident, and `qou` is somebody else's repository — the removal would be a commit there, not here.

A "go" on the session's work is not consent for this. It is the one step in the plan whose cost is irreversible.

## Done when
- [ ] the remaining two sha256 comparisons are made
- [ ] the owner has said whether to remove the seven, and separately what to do with `Home _ folio-assistant.pdf`
- [ ] if yes: a commit in `litlfred/qou`, not here

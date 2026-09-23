---
# folio-assistant-792y
title: 'CSVW KEYS DANGLE: the tabular `fac:` annotation keys cannot be bound in a CSVW context under any prefix — they need absolute IRIs'
status: todo
type: bug
created_at: 2026-09-23T07:30:19Z
updated_at: 2026-09-23T07:30:19Z
---

Found by bean `zaqn` (prefix = stub).

## What is wrong

`schemas/tabular-csvw.ts` writes four annotation keys as `fac:anchor`, `fac:headerRow`, `fac:extent`, `fac:stub`. A CSVW metadata document may put ONLY `@language` and `@base` in its local `@context` (W3C CSVW Metadata §5.2), so no prefix of ours can be bound there — `fac` expands as a URI scheme, the same defect `zaqn` fixed in the content context.

Renaming to `folio-assistant-core:` would move the defect, not fix it.

## Why it was not caught

No CSVW metadata document is committed today, so `check:context-emission` has nothing to read. Once one is committed the gate will flag `fac` as spoken-and-unbound.

## Todo

- [ ] decide: absolute IRI keys (`https://…/folio-assistant-core/ns#anchor`), which CSVW permits for non-core annotations
- [ ] update tabular-csvw.ts, tabular-nodes.ts, check-tabular-stubs.ts and their tests
- [ ] update skills/folio-core/tabular-metadata.md (it carries a "known defect" note pointing here)

## Done when

A CSVW document with these annotations, expanded by a JSON-LD processor, has no IRI outside http(s).

---
# folio-assistant-15gn
title: Evaluate LeanDojo premise index (CI-only artifact) — deferred
status: scrapped
type: task
priority: normal
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-08T11:55:14Z
---


## Status: deferred, evaluate only

LeanDojo (arXiv 2306.15626, MIT) gives a traced-repo artifact with premise-use
annotations, a premise index, and a programmatic `run_tac` environment.

`formalizer` steps 3-4 currently use `lean_leansearch` / `lean_loogle` —
network calls to external services. A local premise index would be
offline-capable and repo-specific.

Against: heavy full-build trace, Python-side against a Bun/TS pipeline,
version-pinned to specific Lean/Mathlib. CI-only artifact if adopted at all,
and likely redundant with leansearch/loogle for most folios.

Revisit only if a folio hits real leansearch/loogle latency or needs offline
operation. ReProver as a fallback tactic generator: skip.


---

## Reasons for Scrapping

Re-checked 2026-08-08 (session `3bada08b`) against this bean's own revisit
condition: *"Revisit only if a folio hits real leansearch/loogle latency or
needs offline operation."*

**The condition has fired — and was already answered, more cheaply.**
`skills/folio-paper-adapter/lean-environment-setup.md` documents that in a web
sandbox `loogle.lean-lang.org` and `leansearch.net` fail with
`SSL: CERTIFICATE_VERIFY_FAILED` (self-signed cert in the proxy chain), so the
`lean_loogle` / `lean_leansearch` MCP tools error out. That is exactly the
"needs offline operation" trigger.

It is met by three substitutes that need no network and no new dependency:

1. grepping the Mathlib source that ships with any clone or cache restore
   (`.lake/packages/mathlib/Mathlib/`) — the closest analogue to a loogle
   name/substring search, and it works with or without Lean installed;
2. `lean_local_search` (MCP) — offline, over the current project plus imported
   modules;
3. `lean_hover_info` / `lean_declaration_file` — offline once a file is loaded.

So the premise index would be solving a problem the tree already solves. The
costs this bean listed are unchanged and still real: a heavy full-build trace,
Python-side against a Bun/TS pipeline, and a version pin to specific
Lean/Mathlib releases — for a CI-only artifact.

Scrapped rather than completed: nothing was built, and the evaluation this bean
asked for has an answer, which is *no*.

Reopen if the grep/`lean_local_search` substitutes prove inadequate for a real
authoring task — that would be new evidence, not the condition already tested
here.

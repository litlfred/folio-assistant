---
# folio-assistant-1wef
title: 'INJECTION: workflow expression, environment, template and prompt injection have no gate, in a repo whose generators write executable pages'
status: todo
type: task
priority: normal
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

## Why this repository specifically

Its generators **write executable pages**. `gen-library-viz.ts` composes
browser JavaScript inside a TypeScript template literal — and on 2026-09-21
that exact construction shipped six pages whose script did not parse, because a
`\n` was consumed at generation time (PR #805). That was a *correctness* bug.
The same construction with untrusted input in it is an injection.

Three surfaces, none gated today:

- **Workflow expression injection** — `${{ }}` interpolation of attacker-
  controllable values (PR titles, branch names, issue bodies) into `run:`
  blocks. The repo runs `pull_request`-triggered workflows and a staging
  publisher.
- **Template injection in generators** — any generated page whose content comes
  from ingested corpora (`uploads/`, the IRIS catalogue, 674 ingested
  smart-trust artefacts) and is composed into HTML or JS without escaping.
- **Prompt injection** — the corpora above are read by agents, and this epic is
  about *dispatching* agents over content. Rule 2 of `0grh` (no tools, declared)
  is a mitigation; it is not the whole of one.

`q2wm` (*"RENDER SAFETY: declared XSS hints"*) is adjacent and open — read it
before starting, and merge rather than duplicate if it already covers the
second bullet.

## Done when

- [ ] The three surfaces are enumerated against this repo's actual inputs, with
      each generator classified by whether its input can be foreign
- [ ] Overlap with `q2wm` is resolved — one of the two owns render safety
- [ ] Anything gated is falsified with a crafted input, not argued

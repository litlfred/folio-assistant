---
# folio-assistant-4dj5
$schema: bean/1.0.0
title: 'PAPER TEMPLATE WIRING: the sci paper adapter supplies its print preamble to generate-main-tex, and publish.yml uses it (#2117 P2, P5)'
status: todo
type: task
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T11:55:00Z
parent: folio-assistant-7x5n
---

The platform half of [#2117](https://github.com/litlfred/folio-assistant/issues/2117) still open after #2118.
The template exists at `folio-assistant-sci/adapters/paper/latex/paper-preamble.tex`,
but its README says "Not yet wired":

- **P2.** `generate-main-tex.ts` (cat-harness-tools) still defaults `--preamble` to the
  deleted `cat-harness/latex/preamble.tex`. Pointing it at sci from the core would invert the
  layering, so the paper adapter must supply the template through the renderer contribution.
- **P5.** `publish.yml` passes the template the same way.

Platform-only. qou-side wiring (qou stories Q1–Q4, the notation fragment) is out of scope
here: qou is a math repo and changes there need the owner's OK first.

## Done when

- [ ] `generate-main-tex` with no `--preamble` gets the template from the paper adapter.
- [ ] No cat-harness or cat-harness-tools file names a sci path.
- [ ] `publish.yml` builds a paper PDF without an explicit `--preamble`.
- [ ] The sci README's "Not yet wired" section is removed.

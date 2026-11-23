---
title: "folio-assistant-sci"
description: "Scientific source material used by folios that formalise mathematics, and the methodologies for formalising it in Lean that this layer adopts from that material."
has_children: false
---

# folio-assistant-sci

Scientific source material used by folios that formalise mathematics, and the
methodologies for formalising it in Lean that this layer adopts from that
material.

## What this layer holds

- **The paper content adapter** (`content-adapters/`, `adapters/paper/`): how a
  paper folio's blocks become LaTeX, PDF and HTML, and how the suggest editor
  checks paper math.
- **Skills** (`skills/`): authoring mathematics in Markdown and LaTeX, Lean
  formalisation and proof review, the proof, rendering and compute audits, and
  the integration watchers that run them on every change.
- **Tools** (`tools/`): one node per command a skill or process calls, such as
  `lean-build`, `lean-cache`, `latex-preflight`, `paper-latex-build` and
  `tex-snippet-validate`, each with its inputs and outputs.
- **Library and methodologies** (`library/`, `methodologies/`): the papers this
  layer reads, and the Lean formalisation methods adopted from three of them.

## Processes

Three BPMN processes in `processes/content/` say who does what:

- **Authoring a paper.** The author (a person) plans the paper. The authoring
  agent seeds the work plan, scaffolds the folio repository and authors blocks.
  The Lean toolchain role formalises claims in Lean, and the build pipeline
  validates the folio and renders the PDF and HTML.
- **Publish a folio's Lean render.** The doc-gen4 HTML of a folio's Lean
  package, staged under its site with the harness navbar and rail.
- **Atomic mass drift check.** Whether `AtomicMass.lean` still matches its data
  table.

Each process has a generated checklist beside it for an agent that walks the
steps by hand.

## Guides

The guide walks the authoring process end to end, from planning the paper to
publishing it.

- [Writing a paper with folio-assistant]({{ '/folio-assistant-sci/guides/writing-a-paper.html' | relative_url }})

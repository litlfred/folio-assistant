---
$schema: folio-fsh-guts/v1
title: "smart-base's legacy agent notes and its Python-only Copilot instructions"
kind: retired-docs
movedOn: 2026-10-23
movedFrom: "litlfred/smart-base:{CORE_DATA_ELEMENT_UPDATE_SUMMARY.md,DAK_CHOICE_TYPE_CLARIFICATION.md,DAK_COMPONENT_REFERENCE_OPTIONS.md,GENERICPERSONA_REFERENCE_EXAMPLES.md,ISSUE_RESPONSE.md,JSON_EXAMPLES_COMPONENT_REFERENCES.md,OPENAPI_DOCUMENTATION_OPTIONS.md,README_COMPONENT_REFERENCES.md,SUMMARY_DAK_COMPONENT_REFERENCES.md,test-pr-comments.md,CODING_AGENTS.md,.github/copilot-instructions.md}"
summary: >-
  Twelve files at the root of litlfred/smart-base, all inherited from
  WorldHealthOrganization/smart-base: ten notes left by earlier Copilot
  sessions about DAK component references, CODING_AGENTS.md (the
  multifile.xml agent workflow) and a 297-line copilot-instructions.md that
  described only the Python DAK extraction pipeline. Owner, 2026-10-23:
  "remove deprecated DAK to fsh-guts. make copilot instructions as per
  harness SOPs". The guidance now lives in smart-base's root AGENTS.md, with
  CLAUDE.md, GEMINI.md and copilot-instructions.md pointing to it. Packed
  from smart-base main 96c018f47e with git archive.
---

# smart-base legacy agent notes

`smart-base-legacy-agent-notes.tar.gz` beside this file holds the twelve files
as they stood on litlfred/smart-base main at `96c018f47e`, under a
`smart-base/` prefix.

Three rules in `CODING_AGENTS.md` were still worth keeping, and were put to
the owner on 2026-10-23 for a home in the knowledge graph: make the smallest
change that does the job and keep diffs minimal, read the repository's
code-style file before writing code, and do not put HTML tags in Markdown.
Its "ask with buttons" rule is already the `interaction-modality` skill.
Everything else in it, and all of `copilot-instructions.md`, described the
`multifile.xml` and Python-only workflows, which nothing uses now.

Retired in session https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19.

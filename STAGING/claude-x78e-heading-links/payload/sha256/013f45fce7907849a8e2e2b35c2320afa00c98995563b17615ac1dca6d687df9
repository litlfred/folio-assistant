---
# folio-assistant-88mg
title: 'CONSOLIDATION: one voice over bootstrap and cat-harness docs, with skills and docs sharing content rather than restating it'
status: in-progress
type: feature
priority: high
created_at: 2026-09-21T16:21:35Z
updated_at: 2026-09-21T19:50:20Z
parent: folio-assistant-2upx
---

Owner, 2026-09-21: a thorough analysis of the existing documentation AND skills, consolidated, in ONE voice. All of the documentation eventually; **bootstrap and cat-harness first**.

**Two structural asks:**
- **Reuse content between `skills/` and `docs/`** so both consolidate, with the docs pointing at the skill for rendering where the skill was written correctly.
- **Some documentation will need splitting** between folio-assistant and cat-harness. That is expected and fine. Clean up what you touch; bean what you do not.

**The review pass, run after every first draft:** have I repeated anything (consolidate); does it flow in logical order (else detangle, `j79e`); is this Term defined (else Glossary, `lqo9`).

This is the bean that turns the other children into a coherent corpus rather than four new pages beside the old ones.

Blocked on the voice and skill existing first — otherwise "one voice" has no definition to consolidate towards.

## Measured 2026-09-21 — the premise does not hold, and the real gap is elsewhere

The review pass this bean is built on opens with *"have I repeated anything? If
so, consolidate."* Measured across all 13 hand-authored `cat-harness/docs`
pages against all 221 skill bodies, two ways:

- **Verbatim: 6 shared sentences in the whole corpus.** Three page/skill pairs,
  two sentences at most in any of them.
- **Paraphrase (5-gram containment): the highest is 14.2 %**, and most pages
  are **below 2 %**. Only three pages exceed 10 % — `accessibility` vs
  `interaction-modality` (14.2 %), `subgraph-viewers` vs `schema-management`
  (13.5 %), `swarm-management` vs its own skill (12.4 %).

**So there is almost nothing to de-duplicate.** A consolidation pass aimed at
removing repetition between `docs/` and `skills/` would find 6 sentences and
three loosely-overlapping pairs, and would spend most of its effort rewriting
text that is not repeated.

### What IS wrong: the docs do not point at the skills

The bean's SECOND ask is the live one — *"the docs pointing at the skill for
rendering where the skill was written correctly."* Counting distinct
`reference/skill-instructions/*` links per page:

| | pages | skill links |
|---|---|---|
| hand-authored `docs/` pages predating today | 13 | **9 total**, and **6 pages link to none** |
| the three pages written 2026-09-21 | 3 | **13** |

Three new pages carry more skill links than the entire pre-existing corpus.
`architecture.md`, `index.md`, `installation.md`, `sage-mcp.md`,
`folio-assistant-migration.md` and `qou-migration-checklist.md` cite no skill
at all — so a reader who starts at the documentation has no route into the
discipline, and an agent that reads a page cannot tell which skill governs it.

### The pass this bean should actually run

1. For each hand-authored page, name the skill that governs its subject and
   link it — or record that none exists, which is a finding rather than a gap
   to paper over.
2. Where a page and a skill DO overlap above ~10 % (the three pairs above), cut
   the page down to what a reader needs and point at the skill for the rule.
3. Leave the rest alone. There is no repetition to consolidate, and rewriting
   in the name of "one voice" would be churn on text nobody reported a problem
   with.

The measurement is cheap to re-run: 5-gram containment of each page's shingles
against each skill's, plus a count of `reference/skill-instructions/` links.
**Re-derive rather than quote these numbers** — they move with every page.

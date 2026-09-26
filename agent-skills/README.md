# agent-skills

Published guidance on **authoring and operating agent skills**, ingested as L1
source content, and the voices read out of it.

This instance is staged as a top-level directory ahead of becoming its own
repository — the same arrangement as `who-iris/`, `who-style-guide/`,
`folio-assistant-sci/` and `folio-assistant-core/`.

## Why it is not in `cat-harness/`

`AGENTS.md` opens by saying folio-assistant is the platform and not the
content. These are other publishers' documents, so they live here even though
their subject is the harness's own.

## Two kinds, and the difference is load-bearing

| kind | what it is | what a rule read from it is |
|---|---|---|
| **assertion** | a publisher describing its own product | a convention |
| **evidence** | a measurement somebody else can repeat | a finding |

Vendor documentation is revisable without notice, and in one case here
describes a product that no longer exists. Nothing in the schema can tell the
two apart, which is why each voice states which it is reading.

## The corpus

Captured 2026-09-20. The four vendor pages are browser prints
(`Producer: Skia/PDF m152`) taken within about half an hour of each other; the
arXiv papers carry `pikepdf`, which is arXiv's own processing.

| document | publisher | kind |
|---|---|---|
| Skill authoring best practices | Anthropic (Claude Platform Docs) | assertion |
| Equipping agents for the real world with Agent Skills | Anthropic | assertion |
| Agent Skill best practices | Google (Gemini CLI) | assertion, **superseded** |
| Agent Skills | Google (Antigravity) | assertion |
| Best practices | Google (Antigravity) | assertion |
| Skills in OpenAI API | OpenAI | assertion, **partial capture** |
| *SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks* | arXiv 2602.12670v4 | evidence |
| *Authoring Agent Skills: A Software-Engineering Approach* | arXiv 2607.25032v1 | evidence |
| *What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files* | arXiv 2608.08453v1 | evidence |

Two of those labels are measurements rather than opinions, and both are on the
document's own face:

- **Superseded.** The Gemini CLI page carries a banner reading *"Gemini CLI was
  replaced by Antigravity CLI on June 18th, 2026"*, and its own footer says
  *"Last updated: Apr 30, 2026"*. It is kept rather than dropped — the guidance
  may still be sound, and which parts survived is what the Antigravity pages
  beside it answer.
- **Partial capture.** The OpenAI print is a single page that begins
  mid-sentence (*"Local shell uses the files you created above…"*). It is one
  page of a longer cookbook article, not an authoring guide, and no rule should
  be read from it as though the rest agreed.

## Ingestion state

Only what has cleared `check:l1-complete` is in `library/`. The rest is staged
and NOT promoted, which is the pipeline working: an entry crosses into
`library/` at one moment and only with every requirement met.

The seven still staged are blocked on `image-descriptions` alone. Their images
are browser-print chrome — 104 of them on one four-page document, at 0.018% page
coverage each — and `pdf-images.py` classifies by geometry with no verdict
between "page scan" and "figure", so a navigation icon is a figure. That is a
classifier question, not a writing task, and it is not decided here.

## The voices

A shared base plus one override per vendor, on the owner's ruling of
2026-09-20: *"for model specific sources, make those model specific voices."*
The vendors overlap heavily — "degrees of freedom", with the same three levels
and nearly the same triggers, appears in both Anthropic's and Google's pages —
so the agreed part is stated once and an override carries only what differs.

Rule content is deliberately **not** formally constrained. Owner, same day:
*"preference leave unstructured schema, agentic review b/c of 'best practice'
drift, not formal."* Published best practice is revised without notice, so a
schema gate would pin whichever vintage was current when it was written and
then report clean over the drift.

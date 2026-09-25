---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: todo
type: task
priority: normal
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-25T16:27:00Z
parent: folio-assistant-slw1
---

> **Body reconstructed by another session, 2026-09-25, and not by this bean's
> author.** It landed in `#1343` with front matter and nothing else, which made
> `check:bean-parents` and `check:bean-bodies` — both CI gates — **red on
> `main`**, so every open PR inherited the failure. Everything below is taken
> from the bean's own title and from the commit that created it
> (`ad77224054`); nothing is invented. The author should replace it with what
> they actually intend.

## What it asks for

A skill that takes a **decision context** as input and returns the
**applicable methods, ranked**, each with its when-to-use criteria and the
rationale for its rank. So the output is a shortlist with reasons, not a single
recommendation — the choosing stays with the reader.

## Source

`qou` commit `bd0c2cb7`, three arXiv papers, named in the title so the coverage
claim can be checked against them rather than taken on trust:

| paper | family |
|---|---|
| 2508.21620 | probabilistic methods, bandits |
| 2509.06388 | MCDM — AHP, SAW |
| 2607.20636 | sequential and social choice |

The title claims the skill *"covers all methodology families"*. That is a
**claim, not a measurement**: three papers are the source, and whether they span
the families is exactly what the ingest has to establish rather than assume.

Issue [#206](https://github.com/litlfred/folio-assistant/issues/206).

## Done when

- [ ] the skill exists and takes a decision context, returning ranked methods
      with when-to-use criteria and rationale
- [ ] the coverage claim is either grounded against the three sources or
      narrowed to what they actually support


---
# folio-assistant-thb1
title: 'SOURCE ASSESSED AND SPLIT: the AI-Mediated RACI preprint backs the four letters, not one empirical claim'
status: in-progress
parent: folio-assistant-slw1
type: task
created_at: 2026-09-23T05:37:58Z
updated_at: 2026-09-23T05:37:58Z
---

An SSRN preprint was uploaded 2026-09-23 and ingested to `library/dusengumuremyi-2026-ai-mediated-raci/` (rung `pdf-ocr+pdf-pages`, 6 pages, no text layer, sha256 cc0ba9bc…). On the owner's ruling the same day it IS cited as `evidence` on `methodologies/raci.md` — but for ONE paragraph only, its §2.1 rendering of the four roles. Every empirical claim in it is rejected, for the reasons below. This bean holds that split so nobody re-reads the paper and reaches a different line through it in either direction.

## What the document is

Dusengumuremyi, A. (2026). *How AI-Mediated RACI Matrix in the Organisational
Boardroom Reshapes Real-Time Operational Efficiency, Error-Free Sensemaking of
Strategic Decision-Making, Management Effectiveness, and Organisational
Defensibility.* Single author, Southern Federal University (SFedU). Uploaded as
an SSRN download; the PDF's own producer is "Microsoft: Print To PDF" and its
embedded title is `How AI-Mediated RACI Matrix.pdf`.

Six pages, **zero characters of text on every page** (`pymupdf`, measured), so it
was read as rendered images and ingested through the OCR rung.

## Why it is not evidence for `methodologies/raci.md`

Two independent reasons. Either alone is sufficient.

### 1. It is the wrong KIND of source

It is not a source for *what RACI is*. §2.1 takes its RACI definition by
citation from **Project Management Institute (2021), PMBOK Guide (7th ed.)** —
the paid standard already listed in `methodologies/raci.md` §"Its source is not
held" as an unfetched candidate. Citing this paper for the method would be
`methodology-adoption` §"Never write a method from recall and cite a paper
nobody fetched" at one remove: the authority would rest on a text nobody here
has opened.

The paper's own contribution is a *proposed AI-augmented variant*, which is a
different object from the method.

### 2. The document refutes its own empirical claims

Each of these is checkable in the ingested pages under
`library/dusengumuremyi-2026-ai-mediated-raci/sections/`.

- **Its own Data Availability statement (p. 5):** *"No new datasets were
  generated or analyzed during this study."* Page 1 claims data comprising
  "1,247 decision events, 89 strategic meetings, and pre- and post-implementation
  operational metrics", and §4.1 reports `t(1245)=47.3, p<.001`. A paper cannot
  both run that test and state that nothing was analysed. **This is the
  document's sentence, not a reader's inference**, which is why it leads.
- **Its own reference list refutes its masthead.** The running head claims
  *Journal of International Business Studies* 2026, "Vol. 1"; refs 3 and 12 cite
  JIBS at **52 (2021)** and **53 (2022)**. A journal at vol. 53 in 2022 is not at
  vol. 1 in 2026. The `DOI:` field reads `Vol. 1, D.A/No. 5` — a volume string,
  not a DOI, so there is no registered identifier to resolve.
- **The abstract's headline figure appears nowhere in the findings.** Abstract:
  92.4 % of vulnerability gates detected. §4.3 and §6: **78.4 %**.
- **Study length contradicts itself.** Abstract: "implemented over 24 months",
  and §4.3 "387 % ROI over 24 months". §3.3's phases run months 1–48 and §6 says
  "48 months of case study evidence".
- **One number pair is reused across unrelated variables.** §3.4: decision-to-
  action latency baseline `94.2 (SD 31.4)` hours; organisational defensibility
  score (0–100) `31.4 → 94.2`. The same two values, swapped, in different units.
- **The reported t does not follow from the reported table.** From §3.4's own
  means, SDs and ns (94.2/31.4/647 vs 5.0/2.1/600), pooled SD ≈ 22.7, SE ≈ 1.29,
  so t ≈ 69 — not 47.3. Computed here, unlike the items above; recorded as a
  derived check rather than as the document's own words.
- **The title asserts a property the findings contradict**: "Error-Free
  Sensemaking" against a reported 99.1 % accuracy.
- The copyright block reads "Submitted for possible open access publication"
  beside masthead dates asserting Accepted 5 March and Published 12 April 2026.
- References are misnumbered (two entries numbered 6, two numbered 12) and
  include a self-citation "Dusengumuremyi, A. (under review)".

## What was done, and what was deliberately not

- **Done:** ingested to L1 and promoted. `library-ingestion` is explicit that a
  file left in `uploads/` makes a clean corpus grep read as "nobody has looked",
  and the point of this bean is that somebody has.
- **Done:** the single extracted image was re-roled `figure` → `logo` by
  inspection. It is the ORCID iD mark; geometry called it a figure at coverage
  0.00015, the role-from-area failure the `inspection` basis exists to catch.
- **NOT done:** no `evidence:` line was added to `methodologies/raci.md`. RACI
  still reports as unbacked by `check:methodology-evidence`, which is correct.
- **NOT done:** no `ai-mediated-raci` methodology node. Adopting it would need
  the empirical claims to hold.

## The collision it exposed — a real finding, not a chore

`folio-assistant-core/schemas/library-ref.test.ts` asserts *"the PLATFORM's
library holds ONLY sources its methodologies cite"*, and this entry fails it,
**correctly**: it is in the platform library and no node cites it.

That is a genuine design question the corpus had not been asked before: **is an
assessed-and-rejected source platform grounding material?** Both answers are
defensible.

- *Yes* — the `scrapped`-over-deleted argument from `bean-coordination`: holding
  the rejected source is what stops the next agent re-ingesting and re-deciding.
  Then the test's question needs a second clause.
- *No* — the platform library is the harness's own grounding material, and a
  source that will never ground anything should not be L1. Then the entry goes
  and this bean carries the memory.

**Not decided here.** Removing a promoted library entry is a durable deletion,
and `deletion-requires-confirmation` says an agent reports and waits. Put to the
owner 2026-09-23.

## Done when

- [x] Owner rules on whether an assessed-and-rejected source belongs in the
      platform library. **Ruled 2026-09-23: cite it on the RACI node.** The
      question the bean posed turned out to be the wrong one — see
      §"How this was actually settled".
- [x] `library-ref.test.ts` green, unchanged: the entry is now cited, so the
      existing clause is satisfied and no second clause was needed.
- [x] `bun run gates` green.

## How this was actually settled — 2026-09-23

**The bean asked whether an assessed-and-rejected source belongs in the platform
library. The owner's answer made that the wrong question**, and the reasoning is
worth keeping because the node itself had already anticipated it.

`methodologies/raci.md` said, before any of this: *"closing this gap needs
either a copy or a decision to render from an open secondary source — the route
`swot` took. That is the owner's call, not an agent's."* The owner made that
call. So the source is **not** rejected wholesale; it is **split**:

- **Accepted** — §2.1's rendering of the four roles, quoted verbatim in the
  node: *"a classic project management instrument delineating four roles:
  Responsible (doer), Accountable (owner), Consulted (input provider), and
  Informed (notified)."* This is exactly the secondary-source route `swot` took.
- **Rejected** — every empirical claim, for the reasons above. The node's
  warning box states this and forbids any efficacy, latency, error-rate or
  risk-detection claim in this repository resting on it.

`library-ref.test.ts` therefore passes unchanged: the entry IS cited by a
methodology node. **No second clause was added, and the design question the
collision raised is still unanswered** — the corpus simply has not yet met a
source that is rejected *whole*. When it does, the two options in §"The
collision it exposed" are still the two options.

### Which methodology it backs — measured, not assumed

The owner asked whether the paper evidences RACI or RASCI. The ingested text
contains **zero** occurrences of `rasci`, `racsi`, `supportive` or `five roles`
(grep over `library/dusengumuremyi-2026-ai-mediated-raci/`), and does carry the
four-letter definition on page 2. It backs **RACI**. RASCI stays unbacked.

## Standing rule this bean leaves behind

**Never cite `library/dusengumuremyi-2026-ai-mediated-raci` for a claim about
what RACI achieves** — only for the four-letter structure. If a future node,
skill or QA axis wants a number out of this paper, the answer is no, and this
bean is why.

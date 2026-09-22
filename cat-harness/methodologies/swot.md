---
$schema: folio-methodology/v1
name: swot
title: SWOT — situation analysis over internal and external factors
origin: >
  Rendered from Gürel, E. & Tat, M. (2017), "SWOT Analysis: A Theoretical Review",
  *The Journal of International Social Research* 10(51), pp. 994–1006,
  doi:10.17719/jisr.2017.1832. The METHOD's own origin is contested and this
  file does not settle it — see §"Where the method came from, and why that is
  not a settled question".
evidence: library/gurel-tat-2017-swot-analysis
applies-when: >
  **Situation analysis, before a decision — never instead of one.** Use it to
  assemble what is true about a subject's internal attributes and its external
  environment, when the point is to see the field whole rather than to choose
  between candidate options. Not for choosing: a one-off choice among options is
  `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence behind a
  health recommendation is `grade`, and the record of whatever is decided is
  `madr`. SWOT produces the INPUT to those; it is not a substitute for any of them.
---

# SWOT — the two axes, and what the method refuses to do

**Adopted 2026-09-22 from a single review paper, which is ingested.** Unlike the
other methodologies here, SWOT has no standards body and no canonical text, so
"adopted whole" has to mean something narrower: this file renders *one* secondary
source faithfully, and says so everywhere it matters. Where this text and
Gürel & Tat differ, they are right and this file is wrong.

The source is at [`library/gurel-tat-2017-swot-analysis`](../library/gurel-tat-2017-swot-analysis/),
13 pages, ingested at page granularity. **This is the first methodology in this
repository whose cited origin a reader can actually open.**

## The method

SWOT crosses **two axes**, and the whole technique is those two axes:

|  | helpful | harmful |
|---|---|---|
| **internal** — attributes of the organisation | **S**trengths | **W**eaknesses |
| **external** — attributes of the environment | **O**pportunities | **T**hreats |

The internal/external split is the load-bearing one. Gürel & Tat's definitions,
verbatim in substance:

- **Organizational strengths** — characteristics that give advantage over others
  in the industry.
- **Organizational weaknesses** — characteristics that place the organisation at
  a disadvantage relative to others.
- **Environmental opportunities** — external elements that give benefits for the
  organization.
- **Environmental threats** — external elements that could cause trouble for it.

### TOWS is the step that makes it produce something

Weihrich (1982) argued the only logical starting point is **opportunities and
threats**, because they are outside the organisation and largely beyond its
control, and must be managed using its strengths and weaknesses. The matching
matrix that follows is where the four lists become strategy:

|  | strengths | weaknesses |
|---|---|---|
| **opportunities** | **SO** — achieve opportunities that greatly match the strengths | **WO** — overcome weaknesses to attain opportunities |
| **threats** | **ST** — use strengths to reduce vulnerability to threats | **WT** — prevent weaknesses, to avoid becoming more susceptible to threats |

**TOWS is one node with SWOT here, not a second methodology.** The source
presents it as SWOT reordered plus the matching step — a development of the
technique, alongside Dealtry's Dynamic SWOT and Wheelen & Hunger's SFAS/EFAS/IFAS
tables — not as an independent method with its own origin. Splitting them would
mint a methodology that cites nobody for the half that does the work. *If the
owner reads TOWS as separable, this is the seam to cut on.*

## Where the method came from, and why that is not a settled question

**Faithfulness matters more here than anywhere else in this file, because the
usual story is repeated everywhere and the source declines to endorse it.**

Gürel & Tat report that the origin of SWOT is **uncertain**. Albert S. Humphrey
(2005) described a research project at Stanford Research Institute running
1960–1970, with a team including Marion Dosher, Otis Benepe and Birger Lie. The
paper then states plainly that **literature review shows there are no academic
references supporting Humphrey's claim**, and that the emergence of SWOT is
usually associated instead with Philip Selznick and with the Harvard Business
School business-policy group of the 1960s.

So: **this file does not assert who invented SWOT.** An adopted methodology that
launders a contested attribution into a flat statement of fact is exactly the
failure an evidence base exists to prevent — and it would be this repository's
"a count in prose is a claim rather than evidence" rule, applied to a citation.

## What this platform adopts, and what it refuses

`methodology-adoption` requires both halves, with reasons. Both are below.

### Adopted

- The **two axes** and the four quadrants, as the structure of a situation scan.
- The **internal and external checklists** as prompts for what to look at — the
  source gives them by business function (marketing, R&D, management information
  systems, management team, operations, finance, human resources) and by category
  of external change (societal, governmental, economic, competitive, supplier,
  market).
- The **TOWS matching step**, because a SWOT that stops at four lists produces
  nothing actionable, which is the source's own central criticism of it.
- Its **applicability at any level** — the source explicitly covers individual,
  organizational, national and international levels, and non-profit, educational
  and governmental use.

### Refused, and why

**SWOT must never be used here to decide anything.** This is the refusal that
matters, and it comes straight from the source's conclusion: SWOT gives managers
"the raw material needed to perform more in-depth strategic analysis", but
"cannot show them how to achieve a competitive advantage", and must not become
"an end in itself, temporarily raising awareness about important issues but
failing to lead to the kind of action steps necessary". Gürel & Tat's stated
limitations, each of which is a reason this platform keeps deciding elsewhere:

- **Listing is prone to bias.** Writing strengths on paper "is very different
  from testing the organization and experiencing the strengths at work", and the
  content "may be unreliable, all bound up with aspirations, biases, and hope of
  the individuals involved".
- **It cannot prioritise.** Many factors can be identified, but "quantity does
  not mean quality": SWOT provides no way to rank the factors it lists. That is
  precisely the gap `kepner-tregoe` fills with MUSTs and WANTs, and a table fills
  with `dmn`.
- **Categorisation is genuinely ambiguous.** "The same factor can be fitted in
  two categories. A factor can be a strength and a weakness at the same time."
  Strengths not maintained become weaknesses; opportunities not taken, but taken
  by competitors, become threats.
- **It is a one-shot view of a moving target** — "primarily a static assessment
  … like studying a single frame of a picture", developed when "environmental
  conditions were still".
- **Strengths may not lead to an advantage**, however unique or impressive.
- **It is rarely deployed below the organisation level**, so one scan can drive
  wrong strategies across units for which its factors do not hold equally.
- Hill and Westbrook (1997) go further and hold that the technique "expired long
  ago". The source reports this rather than endorsing it, and so does this file.

**Not adopted: the quantitative extensions.** The source lists a long series of
attempts to give SWOT a numeric backbone — AHP, ANP, their fuzzy variants,
SMART, SMAA-O, MADM, TRIZ, evidential reasoning, contrast mining, and others.
None is adopted here. Each is a separate methodology with its own literature,
and pulling one in to patch SWOT's ranking problem would be the composite this
repository's `methodology-adoption` forbids: "this one's vocabulary, that one's
record, a third one's filter" is a house method that cites nobody. **When ranking
is needed, use a methodology adopted for ranking.**

## Where the rendering stops

- **One secondary source, no primary texts.** Humphrey (2005), Weihrich (1982),
  Dealtry (1992), Wheelen & Hunger (1998), Hill & Westbrook (1997), Mintzberg
  (1990) and Dess et al. (1997) are all read *through* Gürel & Tat. Their own
  papers are not in any library here, so every attribution above is second-hand
  and is marked as such.
- **The worked example is not rendered.** The source works a full SWOT for an
  international sportswear brand. It is in the ingested pages and in the figure
  narratives; it is not repeated here, because a worked example of somebody
  else's commercial analysis is not guidance.
- **No step-by-step procedure is invented.** The source is a theoretical review
  and does not give one. The executable process beside this file
  (`processes/swot-analysis.bpmn`) draws only the sequence the source itself
  states — scan internal, scan external, cross them, and hand the result to a
  decision method — and **adds no step the source does not support.**

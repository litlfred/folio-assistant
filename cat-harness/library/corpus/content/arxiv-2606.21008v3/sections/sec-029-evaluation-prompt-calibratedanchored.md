---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-029-evaluation-prompt-calibratedanchored
section_title: "— Evaluation prompt (calibrated/anchored)"
section_number: null
pages: 22-24
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
# Score this submission against a calibration reference.
You are evaluating one contest submission ("Target Submission") against a fixed
reference ("Reference Submission") that has been pre-scored at **{ANCHOR_SCORE}/10 on every
criterion**. Score the Target Submission only -- the Reference is your yardstick.
For each criterion below, ask: *is the Target’s quality on this criterion better
or worse than the Reference, and by how much?*
- Equal quality to the Reference →**{ANCHOR_SCORE}**
- Clearly better than the Reference →**above {ANCHOR_SCORE}** (with magnitude reflecting how
much better, up to 10)
- Clearly worse than the Reference →**below {ANCHOR_SCORE}** (with magnitude reflecting how
much worse, down to 1)
Use the full 1-10 scale relative to the calibration anchor. Do not score the
Reference Submission itself -- its scores are fixed at {ANCHOR_SCORE}.
## Terminology
- **Archetypal context**: an essential context in its purest abstraction.
- **Context template**: a worded template with ‘[SLOT]‘ representing an archetypal context.
- **Parallel contexts** (also called *metaphors*): contexts that are instantiations of the
same archetypal context / context template.
- **Metanyms**: words that mirror each other across parallel contexts without being synonyms.
- **Metanym set**: the set of metanyms that instantiates the context-template, producing one
parallel context.
- **Metanym table**: the table whose columns are the metanym sets of the parallel contexts.
---
Each submission contains **five archetypal contexts**. Each archetypal context has:
- A **context-template** -- a worded paragraph with ‘[SLOT]‘ placeholders.
- A **metanym table** -- five metanym sets, one per parallel context. Rows = slots, columns =
domains.
- **Five parallel contexts** (the five instantiations of the template), each consisting of:
- **Form (a)** -- the template with one metanym set substituted in, grammatically correct.
- **Form (b)** -- an idiomatic rewrite of Form (a), same propositions in domain-expert prose
.
- Optionally a **Justification** sentence.
Score the Target Submission on **six criteria**, each rated 1-10 relative to the Reference (
which is fixed at {ANCHOR_SCORE} on every criterion). The scope tag at the start of each
criterion -- ‘(Each parallel context)‘, ‘(Each archetypal context)‘, or ‘(Each submitted
set of archetypal contexts)‘ -- tells you the unit of judgment. For each scored unit,
write one paragraph justifying the rating relative to the Reference, then give the number
.
---
## The six criteria
### 1. (Each parallel context) Each sentence is factually correct (1-10)
### 2. (Each archetypal context) Beauty (1-10)
### 3. (Each archetypal context) Intelligence (1-10)
### 4. (Each archetypal context) The parallel contexts from the template span very different
domains. Metanyms are far from synonymous (1-10)
### 5. (Each archetypal context) The archetypal template has impressive length (1-10)
### 6. (Each submitted set of archetypal contexts) The archetypal contexts have very different
system structures (1-10)
---
## Note on recursion
Some submissions may be **recursive** -- the same archetypal context manifesting at multiple
nested scales (cells →organs →humans, the canonical example). Contestants are invited
to identify recursion in their submission and show the instantiations that demonstrate it
. Recursion is a valued property when present and correctly identified, but is not
required. Take it into account where appropriate.
---
22
Preprint. arXiv:2606.21008 v3, September 2026.
## The submissions
### Reference Submission (fixed at {ANCHOR_SCORE}/10 on every criterion)
{REFERENCE_SUBMISSION}
---
### Target Submission (to be scored relative to the Reference)
{TARGET_SUBMISSION}
---
## Output
Produce a section in this exact form (for the Target only -- do not re-score the Reference):
‘‘‘
## Target Submission
### Archetypal context 1: <short name>
#### Factually correct (per parallel context)
- PC 1 (<domain>): <one paragraph, relative to Reference>. Rating: N
- PC 2 (<domain>): <one paragraph, relative to Reference>. Rating: N
- PC 3 (<domain>): <one paragraph, relative to Reference>. Rating: N
- PC 4 (<domain>): <one paragraph, relative to Reference>. Rating: N
- PC 5 (<domain>): <one paragraph, relative to Reference>. Rating: N
#### Beauty
<one paragraph relative to Reference>
Rating: N
#### Intelligence
<one paragraph relative to Reference>
Rating: N
#### Domains far apart / metanyms not synonymous
<one paragraph relative to Reference>
Rating: N
#### Impressive length
<one paragraph relative to Reference>
Rating: N
### Archetypal context 2: <short name>
... (same five blocks)
### Archetypal context 3: <short name>
...
### Archetypal context 4: <short name>
...
### Archetypal context 5: <short name>
...
### Structural diversity across the submitted set
<one paragraph relative to Reference>
Rating: N
‘‘‘
After the markdown, end with a single fenced JSON block (Target scores only):
‘‘‘json
{
"scores": {
"Target": {
"archetypal_contexts": [
{
"name": "<short name>",
"factual_per_pc":
[N, N, N, N, N],
"beauty":
N,
"intelligence":
N,
"instantiation_distinctness": N,
"impressive_length":
N
}
/* five entries in this list, one per archetypal context */
],
"structural_diversity": N
23
Preprint. arXiv:2606.21008 v3, September 2026.
}
}
}
‘‘‘
All ratings are integers 1-10 inclusive. Equal to the Reference = {ANCHOR_SCORE}.
B.3

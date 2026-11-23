---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-028-generation-prompt
section_title: "— Generation prompt"
section_number: null
pages: 19-22
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
# Make more of these. This is a contest -- your submissions will be ranked.
You will propose new **archetypal contexts** -- universal relational templates
that apply across multiple distant domains. Below are two worked examples,
then your task.
---
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
## Example 1
19
Preprint. arXiv:2606.21008 v3, September 2026.
### Template
"[SIGNALING] is part of a complex system of communication that governs basic [ELEMENT]
activities and coordinates [ELEMENT] actions. The ability of [ELEMENT] to perceive and
correctly respond to [BOUNDARY] is the basis of development, [SUBSYSTEM] repair, and [
RESILIENCE] as well as normal [SUBSYSTEM] [HOMEOSTASIS]. Errors in [ELEMENT] information
processing are responsible for [FAILURE]. By understanding [SIGNALING], [FAILURE] may be
treated effectively. [KNOWLEDGE SYSTEM] research helps us to understand the underlying
structure of [SIGNALING] networks. [SIGNALING] is mostly thought of as signaling between
[ELEMENT] of a single [SYSTEM]. However, [SIGNALING] may also occur between the [ELEMENT]
of two different [SYSTEM]."
### Substitution table (metanyms in base form)
| [SLOT]
| Cell Signaling
| Organ Signaling
| Human Language
|
|-------------------|------------------|--------------------------|------------------|
| ELEMENT
| cell
| organ
| human
|
| SIGNALING
| cell signaling
| endocrine signaling
| human language
|
| SUBSYSTEM
| tissue
| organ system
| community
|
| RESILIENCE
| immunity
| physiological resilience | resilience
|
| HOMEOSTASIS
| homeostasis
| systemic homeostasis
| equilibrium
|
| BOUNDARY
| microenvironment | internal environment
| environment
|
| FAILURE
| disease
| organ failure
| dysfunction
|
| KNOWLEDGE SYSTEM
| systems biology
| physiology
| sociology
|
| SYSTEM
| organism
| organism
| society
|
### Cell Signaling
**Form (a)** -- grammatical substitution (metanyms inflected as English requires):
"Cell signaling is part of a complex system of communication that governs basic cell
activities and coordinates cell actions. The ability of cells to perceive and correctly
respond to their microenvironment is the basis of development, tissue repair, and
immunity, as well as normal tissue homeostasis. Errors in cellular information processing
are responsible for disease. By understanding cell signaling, disease may be treated
effectively. Systems biology research helps us to understand the underlying structure of
cell-signaling networks. Cell signaling is mostly thought of as signaling between cells
of a single organism. However, cell signaling may also occur between the cells of two
different organisms."
**Form (b)** -- idiomatic rewrite (same propositions, written as a domain expert would):
"Cell signaling is the communication apparatus that governs and coordinates cellular behavior.
A cell’s ability to sense and respond appropriately to its microenvironment underlies
development, tissue repair, immunity, and ordinary tissue homeostasis. When that
information processing fails, disease results -- and conversely, a clear understanding of
cell signaling enables effective therapeutic intervention. Systems biology unpacks the
structure of these signaling networks. Most cell signaling occurs within a single
organism, but inter-organism signaling (host-pathogen, microbiome) is well-documented."
(Two more domains would follow with their own form (a) and form (b).)
---
## Example 2
### Template
"A [AGENT] must commit [RESOURCE] under uncertainty, and once a [COMMITMENT] is observed it
cannot be costlessly reversed. As [INFORMATION] arrives, the [AGENT] learns that earlier
[COMMITMENT] are increasingly suboptimal. [REVERSAL_COST] grows with the depth of prior [
COMMITMENT], so the [AGENT] often continues along the original [PATH] even when fresh [
INFORMATION] favors a different one. [DECISION_THEORY] studies how rational [AGENT]
balance the value of [INFORMATION] against the cost of [REVERSAL_COST]."
### Substitution table
| [SLOT]
| Capital Investment
| Coalition Politics
|
|-------------------|----------------------|----------------------|
| AGENT
| firm
| coalition
|
| RESOURCE
| capital
| endorsement
|
| COMMITMENT
| investment
| public statement
|
| INFORMATION
| market signal
| polling data
|
| REVERSAL_COST
| switching cost
| reputational cost
|
| PATH
| strategy
| position
|
| DECISION_THEORY
| investment theory
| political science
|
### Capital Investment
**Form (a)**:
"A firm must commit capital under uncertainty, and once an investment has been made it cannot
be costlessly reversed. As market signals arrive, the firm learns that earlier
investments are increasingly suboptimal. Switching costs grow with the depth of prior
20
Preprint. arXiv:2606.21008 v3, September 2026.
investments, so the firm often continues along the original strategy even when fresh
market signals favor a different one. Investment theory studies how rational firms
balance the value of market signals against the cost of switching."
**Form (b)**:
"Capital investments must be made under uncertainty, and once committed they are sunk --
reversal is costly. New market signals continuously update what would have been optimal,
but the depth of prior commitment raises the cost of changing course. Firms therefore
tend to stay with their original strategy, even when current information would favor
switching. Real-options theory and other strands of investment theory characterise how
rational firms trade off information value against reversal cost."
---
## Your task
Propose **five archetypal contexts**. Each archetypal context has a worded context-template,
one metanym table with five metanym sets, and five parallel contexts (the instantiations
of the template). The five archetypal contexts in your submission should themselves have
very different system structures from each other. Surface relabelings of the worked
examples above don’t count.
### Note
Example 1 is **recursive**: cells - organs - humans. Recursive archetypal contexts can be
observed in nature. But not all archetypal contexts are recursive. You are free to submit
archetypal contexts of both kinds. If there are recursive ones in your submission, point
to them. The instantiations should demonstrate the recursion.
### What to submit
For each of your five archetypal contexts, begin with:
‘‘‘
## Archetype Proposal: <short name>
‘‘‘
Then provide, for that archetypal context:
1. **Context-template** -- a worded paragraph with ‘[SLOT]‘ placeholders. Slots use one
canonical noun (e.g. ‘[ELEMENT]‘, never ‘[ELEMENTS]‘).
2. **Metanym table** -- rows = slots, columns = 5 domains, each cell a metanym in **base form
** (singular noun, infinitive verb, etc.).
3. **Five parallel contexts**, one per domain:
- **Form (a)** -- the context-template with that domain’s metanym set substituted in.
Inflect metanyms as English requires; Form (a) must be grammatically correct.
- **Form (b)** -- idiomatic rewrite of Form (a). Same propositions, written as a domain
expert would naturally write them.
- **Optional ≤1-sentence justification** beginning ‘Justification:‘ -- only if a
propositional claim might be misread by a domain expert.
### Rules
- The **context-template** uses base-form slot placeholders -- ‘[ELEMENT]‘ not ‘[ELEMENTS]‘.
One token per slot, used consistently.
- The **metanym table** lists metanyms in **base form** -- ‘cell‘, ‘human‘, etc.
- The **parallel contexts** (Form (a) and Form (b)) must use the **correct grammatical form**
of each metanym for the sentence -- ‘cell‘ in the table becomes ‘cells‘ or ‘cell’s‘ in
the PC as English grammar requires.
- Every proposition in Form (a) must appear in Form (b), and vice versa. Do not add or drop
claims between the two forms.
### How you will be ranked
A submission contains **five archetypal contexts**. Evaluators score on six criteria, each
rated 1-10. The scope tag tells you the unit of judgment:
1. **(Each parallel context)** Each sentence is factually correct
2. **(Each archetypal context)** Beauty
3. **(Each archetypal context)** Intelligence
4. **(Each archetypal context)** The parallel contexts from the template span very different
domains. Metanyms are far from synonymous
5. **(Each archetypal context)** The archetypal template has impressive length
6. **(Each submitted set of archetypal contexts)** The archetypal contexts have very different
system structures
21
Preprint. arXiv:2606.21008 v3, September 2026.
B.2

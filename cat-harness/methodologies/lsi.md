---
$schema: folio-methodology/v1
name: lsi
title: Latent Semantic Indexing — retrieve and relate by co-occurrence structure, not by shared words
origin: >
  Scott Deerwester, Susan T. Dumais, George W. Furnas, Thomas K. Landauer and
  Richard Harshman, "Indexing by Latent Semantic Analysis", Journal of the
  American Society for Information Science 41(6):391–407 (1990), for the
  method. Susan T. Dumais, "Improving the retrieval of information from
  external sources", Behavior Research Methods, Instruments & Computers
  23(2):229–236 (1991), for the log-entropy term weighting. Michael W. Berry,
  Susan T. Dumais and Gavin W. O'Brien, "Using Linear Algebra for Intelligent
  Information Retrieval", SIAM Review 37(4):573–595 (1995), for folding-in and
  updating. Thomas K. Landauer and Susan T. Dumais, "A Solution to Plato's
  Problem", Psychological Review 104(2):211–240 (1997), for the cognitive
  reading of the same computation (there called LSA), which this node does NOT
  adopt.
applies-when: >
  **Finding or relating units of text that discuss the same thing in different
  words, across a corpus too large to read whole, where no controlled
  vocabulary has been assigned.** Use it to ask "what else in this graph is
  about this?", to propose a home for an unfiled item among existing groups,
  to find near-duplicates, and to surface clusters nobody named. It answers
  *which units are close in co-occurrence structure*. It does NOT answer
  whether a unit is relevant, correct, or a dependency: every output is a
  PROPOSAL a person or an agent confirms. Not for assigning terms from a
  controlled vocabulary (`skill-pipeline-subject-indexing`), not for judging
  an assignment (`consensus-grounded-subject-evaluation`), and not for any
  decision (`kepner-tregoe`, `dmn`).
---

# Latent Semantic Indexing: the vocabulary problem, answered with a truncated SVD

**Adopted 2026-09-29** (bean `ansc`, issue #1482).

## Its sources: located, unreachable, and therefore no `evidence`

**Attempted 2026-09-29, and recorded because it did not succeed.** Every
source in `origin` is published and located; none is reachable from the agent
container that wrote this node. The egress policy answers 403 to
`lsa.colorado.edu` (which hosts the 1990 paper), `en.wikipedia.org`,
`arxiv.org`, `nlp.stanford.edu` and `www.cs.bham.ac.uk` alike — the same
policy bean `p2en` measured for arXiv and huggingface.co. That is a fact about
this agent, not about the literature.

**So `evidence` is absent, and the rendering below is from the published
method as it is widely taught, not from a reading of the text in this
checkout.** Where this node states what a source *says*, it paraphrases and
does not quote. `check:methodology-evidence` reports this node as unbacked,
which is correct. The gap closes when someone with open egress ingests the
1990 paper through `library-ingestion` and checks the rendering against it —
at which point any sentence here that disagrees with the paper is wrong.

## The load-bearing idea, in one sentence

> **Words are a noisy observation of what a text is about. People describe the
> same thing with different words (synonymy) and use one word for different
> things (polysemy), so lexical matching both misses and over-matches. A
> low-rank approximation of the term–document matrix keeps the dominant
> co-occurrence structure and discards the rest as noise, and similarity
> measured there survives a change of vocabulary.**

The empirical premise behind it is Furnas et al.'s *vocabulary problem* (the
same group at Bellcore): two people choose the same word for the same object
far less often than a keyword system assumes.

## The method, as the 1990 paper defines it

| # | step | what it is |
|---|---|---|
| 1 | **Unit and vocabulary** | choose the text unit (a document, a section, a paragraph); tokenise; drop words in only one unit and very common function words |
| 2 | **Term–document matrix** | `A`, `m` terms × `n` units, entry = weighted count. The 1990 paper used raw counts; Dumais (1991) compared weightings and log-entropy — local `log(1 + tf)`, global `1 + Σ_j p_ij log p_ij / log n` — performed best, and it became the standard |
| 3 | **Truncated SVD** | `A = U Σ Vᵀ`; keep the `k` largest singular values: `A_k = U_k Σ_k V_kᵀ`. By the Eckart–Young theorem `A_k` is the best rank-`k` approximation of `A` in the Frobenius (and spectral) norm — a theorem, not an empirical claim |
| 4 | **Choose `k`** | an empirical choice, not derived; the literature reports useful ranges of roughly 50–300 for small to medium collections. Too small merges distinct topics, too large re-admits the noise |
| 5 | **Compare** | units by cosine between rows of `V_k Σ_k`; terms by cosine between rows of `U_k Σ_k` |
| 6 | **Query (folding-in)** | a query is a pseudo-document: its weighted term vector `q` maps to `q̂ = qᵀ U_k Σ_k⁻¹` and is compared by cosine. Unit coordinates here are `V_k Σ_k = Aᵀ U_k`, so `qᵀ U_k` is in the same frame |
| 7 | **Update** | new units can be folded in the same way without recomputing; Berry, Dumais & O'Brien (1995) show folding-in does not change the basis, so after enough additions the index must be recomputed. **An index is therefore stale by construction once its corpus changes** — the property the QA criterion checks |

**What the 1990 paper claimed and did not claim.** It claimed improved recall
at comparable precision on some standard test collections and no improvement
on others; it did not claim the latent dimensions are interpretable topics,
and it gave no rule for `k`. Both omissions are load-bearing below.

## What this platform adopts, and what it refuses

### Adopted

- Steps 1–7, with **log-entropy** weighting as default and `tfidf` available
  for comparison.
- Units are the graph's own nodes — a library **section**, a skill file, a
  bean, a block — because the KG already chunks semantically (bean `p2en`'s
  third measured constraint); LSI indexes that chunking rather than
  re-chunking.
- The index is recomputed, not incrementally folded, whenever its input
  fingerprint changes: at this corpus size a rebuild is about a second.

### Refused, with reasons

1. **A latent cosine is never merged with a lexical match.** `graph-search`
   refuses to rank because a made-up order hides that everything matched
   equally. A cosine is a *defined* quantity, but it answers a different
   question. So a latent hit is reported with its own provenance — `latent` —
   beside the lexical result, and a caller always sees which it is.
2. **A dimension is not a topic until a person names it.** The paper does not
   claim interpretability. Dimension summaries (top-loading terms at each
   pole) are published for review, not as labels.
3. **LSI output never writes a relation.** It proposes a parent for a bean, a
   `uses[]` candidate for a block, or a duplicate pair; it never writes one.
   `uses[]` is the editorial relation (`uses-editorial-review`) and populating
   it from a similarity score would destroy the signal every ordering metric
   is computed from — the same reason it is never populated from Lean.
4. **LSI similarity is never evidence for a claim in content.** It is a
   retrieval aid. Nothing it computes enters a proof, a formal statement, a
   recommendation or a GRADE judgement.
5. **The cognitive reading is not adopted.** Landauer & Dumais (1997) present
   the same computation as a model of human word learning. That is a
   psychological hypothesis about people; this platform uses the computation
   as an index and takes no position on it.
6. **No stemming.** Stemming is language-specific; the corpus is multilingual
   by design. Inflections co-occur, so LSI recovers much of what stemming
   would — part of the method's own claim, and stemming first would hide
   whether it held.

## The parallel tracks, and why they are not this node

| track | answers | why it is separate |
|---|---|---|
| lexical search (`graph-search`) | which nodes contain these words, and what is adjacent | exact, explainable, no score; LSI supplements it and never replaces it |
| dense neural embeddings (the LanceDB option in `docs/proposals/rag-document-ingestion.md`) | the same question as LSI, from a model pre-trained elsewhere | needs a model download (huggingface.co is a 403 in the sandbox), is not reproducible from the corpus alone, and imports a vocabulary from outside the graph |
| `skill-pipeline-subject-indexing` | which controlled-vocabulary terms a work should carry | closed vocabulary, policy-governed; LSI has no vocabulary to validate against |
| probabilistic topic models (pLSI, LDA) | a generative account of the same matrix | a different method with a different claim (topics as distributions); not adopted here |

**Pick one per question.** A pipeline that seeds by LSI and filters by an
embedding model is a house method; see `methodology-adoption`
§"Parallel, not composable".

## How it is performed here

The skill is [`lsi-indexing`](../skills/graph-management/lsi-indexing.md); the
engine is `content/pipeline/lsi.ts`; the CLI is `bun run lsi`. The skill
carries which graphs get an index, where the sidecar lives, and the QA
criterion that says a graph needs one.

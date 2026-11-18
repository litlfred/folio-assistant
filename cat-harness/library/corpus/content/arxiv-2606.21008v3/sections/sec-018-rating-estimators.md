---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-018-rating-estimators
section_title: "Rating estimators"
section_number: null
pages: 14-14
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Every rating comes from one object: the scores the participants produce when each model grades
the others’ portfolios, swept across the anchor. No external answer key is used.
Panel, tasks, anchor. Twelve models, indexed s, t ∈{1, . . . , 12}, are each a submission (its port-
folio is graded) and an evaluator (it grades the others). Every model was asked to grade every port-
folio including its own, and those self-evaluations are released; but no rating below uses a model’s
grade of its own portfolio — every estimator is leave-self-out. A portfolio holds five archetypes,
each realised as five parallel contexts. Scoring uses six axes on a 1–10 scale: a factual axis (once
per parallel context) and five non-factual axes — beauty, intelligence, instantiation-distinctness,
impressive-length (once per archetype) and structural-diversity (once per portfolio). Every score
is relative to the anchor — the model a whose portfolio won the un-anchored initial selection —
declared to score 7 on every axis. The anchor value is swept, θ ∈Θ = {5, 6, 7, 8}, and θ∗= 7 is
the production anchor. Write rt,s,x,u(θ) for evaluator t’s score of unit u of axis x of submission s

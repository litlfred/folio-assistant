---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-014-related-work
section_title: "Related work"
section_number: null
pages: 9-9
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
As an intelligence test, the Metanym Game probes the abstraction-and-analogy cluster a long tra-
dition places at the centre of thinking (Gentner, 1983; Hofstadter & Sander, 2013; Penn et al., 2008;
Chollet, 2019; Mitchell, 2021). The classical instruments (Srivastava et al., 2023; Webb et al., 2023;
Lewis & Mitchell, 2024; Chollet, 2019) give source and target and ask for one selection or comple-
tion, scored against a key; the metanym game asks for many coupled slots across unrelated domains,
built from scratch, and is the first to make analogical production falsifiable sentence by sentence.
As a self-contained method, the council sits in the unsupervised peer-evaluation line, which already
removes the gold key: single-judge protocols (Zheng et al., 2023) trust one judge; PoLL (Verga et
al., 2024) adds a panel but trusts it as given; LLM-as-Examiner (Bai et al., 2023) lets the examiner
write the questions; PiCO (Ning et al., 2025) lets unlabelled models answer and grade one another
and recovers an ability ordering from peer agreement alone, and UPME (Zhang et al., 2025) extends
it to vision-language. We weight by agreement only where agreement is licensed to mean truth,
and our council certifies and re-contests its own judges. Label-free spectral aggregation is one-
sided in both its lineages: in the aggregation lineage (Parisi et al., 2014; Dawid & Skene, 1979)
predictors classify a fixed external dataset, so there is no generator to score; in the reputation lineage
(EigenTrust, Kamvar et al., 2003) EigenBench (Chang et al., 2026) has LLMs judge one another’s
responses against a written value constitution and takes the leading eigenvector of a model-by-
model trust matrix as each model’s score: one number is both standing and weight as a judge,
applied to every criterion, subjective ones included. Our matrix is two-sided: one SVD scores
judges on the left and generators on the right, the two are kept apart, and the generation–evaluation
gap of §4.4 — which contradicts that premise on the factual axis — is definable only because the
test is self-produced. Rating consistency applies the judge-reliability principle of invariance under
non-semantic perturbation (Weng et al., 2026; Bellibatlu et al., 2026) to subjective, ground-truth-
free criteria on self-produced items — to our knowledge a new use of the sweep. Don-Yehiya et
al. (2026) find the anchor should be recalibrated to the field’s range, which is the rule here, with the
anchor pinned at 7 and headroom above (§4.1).
6

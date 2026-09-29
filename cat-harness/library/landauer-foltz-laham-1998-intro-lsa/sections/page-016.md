---
doc_id: landauer-foltz-laham-1998-intro-lsa
doc_title: "landauer-foltz-laham-1998-intro-lsa"
section_id: page-016
section_title: "Page 16"
pages: 16-16
pdf_page: 16
source_pdf: landauer-foltz-laham-1998-intro-lsa.pdf
source_sha256: e1f7573855ca5836
text_source: embedded
granularity: page
---
Introduction to Latent Semantic Analysis
16
generated from a source of the same dimensionality and general structure as the
reconstruction. Suppose, for example, that speakers or writers generate paragraphs by
choosing words from a k-dimensional space in such a way that words in the same
paragraph tend to be selected from nearby locations. If listeners or readers try to infer the
similarity of meaning from these data, they will do better if they reconstruct the full set of
relations in the same number of dimensions as the source. Among other things, given the
right analysis, this will allow the system to infer that two words from nearby locations in
semantic space have similar meanings even though they are never used in the same
passage, or that they have quite different meanings even though they often occur in the
same utterances.
The number of dimensions retained in LSA is an empirical issue. Because the
underlying principle is that the original data   should not be perfectly regenerated but, rather,
an optimal dimensionality should be found that will cause correct induction of underlying
relations, the customary factor-analytic approach of choosing a dimensionality that most
parsimoniously represent the true variance of the original data is not appropriate.  Instead
some external criterion of validity is sought, such as the performance on a synonym test or
prediction of the missing words in passages if some portion are deleted in forming the
initial matrix. (See Britton & Sorrells, this issue, for another approach to determining the
correct dimensions for representing knowledge.)
Finally, the measure of similarity computed in the reduced dimensional space is
usually, but not always, the cosine between vectors.  Empirically, this measure tends to
work well, and there are some weak theoretical grounds for preferring it (see Landauer &
Dumais, 1997).  Sometimes we have found the additional use of the length of LSA vectors,
which reflects how much was said about a topic rather than how central the discourse was
to the topic, to be useful as well (see Rehder et al., this volume).

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-026-using-strength-of-concavity
section_title: "Using Strength of Concavity"
section_number: null
pages: 46-47
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we introduce a family of algorithms designed to address the question of
providing sharper bounds for the improving multi-armed bandits problem. The design of
this family is motivated by two factors: (1) the family must contain the algorithm that is
known to provide the worst-case near-optimal guarantee of [BR25]; (2) there must exist
an algorithm in the family that performs better than the general worst-case if instances
satisfy a stronger regularity condition. In Section 4.3.1, we define the family. Then, in
Section 4.3.2, we define a strengthening of concavity and show that a variant of [BR25]
achieves optimal competitive ratio guarantees on instances that satisfy the strengthened
property. In Section 4.3.3, we show that we can learn the best algorithm from this family
for instances arising from a distribution with polynomially-many samples.
Finally, in
Section
4.3.4, we present empirical evidence on real learning-curve data that different
instances prefer different values of α, corroborating the intuition that adapting the choice
of this parameter to data is valuable.
31
The data-driven perspective we take in this section differs from standard worst case
guarantees in several ways. On the one hand, we do not have to make stronger assump-
tions to get the guarantees and can instead adapt to the distribution of data. On the other
hand, we must be in a setting where such a distributional assumption holds and we have
access to other instances from the distribution.
4.3.1

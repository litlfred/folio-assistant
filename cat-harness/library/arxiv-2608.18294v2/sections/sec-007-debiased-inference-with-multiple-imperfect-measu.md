---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-007-debiased-inference-with-multiple-imperfect-measu
section_title: "Debiased Inference with Multiple Imperfect Measurements"
section_number: null
pages: 8-10
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
We now show how to use multiple imperfect labels to perform valid downstream inference without
requiring gold-standard labels.
In particular, building on established results on identification of
latent variables, we use the joint distribution of multiple imperfect labels to recover the unbiased
downstream moment under a conditional independence assumption. In Section 3.1, we begin by
reviewing this classical assumption and then relax it to accommodate modern applications of LLM
annotations. We then discuss nonparametric identification (Section 3.2) and propose a consistent
and asymptotically normal estimator to enable valid downstream inference (Section 3.3).
3.1
Assumptions
As is clear from the previous section, if researchers assume no access to gold-standard labels, they
have to instead make some assumptions about proxy labels (Schennach, 2016). Here, we build on
the established literature of nonparametric latent variable models (e.g., Goodman, 1974; Kruskal,
8
1977; Dawid and Skene, 1979; Hu, 2008; Allman, Matias and Rhodes, 2009). We begin with a brief
review of the classical conditional independence assumption (see Section 6.1 of Schennach, 2016 for
a detailed review). Specifically, the classical methods assume that multiple imperfect measurements
are independent conditional on the true label:
X(1) ⊥⊥· · ·⊥⊥X(J) | X∗.
(3.1)
Importantly, the proxy labels may be biased, unequally accurate, and nonidentically distributed.
In particular, their false-positive and false-negative rates may be nonzero and may differ across
labels. This assumption is substantially weaker than assuming proxy labels are perfect and have no
measurement errors.
A large literature has developed methods for latent variable models under this conditional in-
dependence structure.
Examples include nonparametric estimation using an algorithm and joint
approximate diagonalization (Hall and Zhou, 2003; Bonhomme, Jochmans and Robin, 2016, respec-
tively), crowdsourcing and noisy label models (Raykar et al., 2010; Zhang et al., 2016), and tensor
based methods or canonical correlation analysis for multi-view latent variable learning (Anandkumar
et al., 2014; Chaudhuri et al., 2009, the latter under a weaker conditional moment restriction).
However, this classical assumption may be violated if human annotators make similar errors
because of shared characteristics of the input or annotation task (e.g., some texts are much longer
and more difficult to annotate). Similarly, machine annotators may make correlated errors because
of shared model characteristics that interact with the input (e.g., overlapping training data or a
common prompt). For example, recent papers emphasize that errors in LLMs are correlated even
conditional on the true label (Kim et al., 2025; Chen, Rambachan and Tamer, 2026).
To make this assumption more plausible, we allow for conditioning on auxiliary input- or annotation-
level information Di, the downstream covariates Wi, and the downstream dependent variable Yi. The
vector Di may account for heterogeneity in label accuracy or shared sources of dependence but need
not enter the downstream regression.
Assumption 3.1 (Independence across labels conditioning on input and annotation information).
The multiple imperfect labels are mutually independent conditional on the latent label and the observed
covariates:
X(1) ⊥⊥· · ·⊥⊥X(J) | X∗, eD,
where eD = (D, W, Y ).
Assumption 3.1 allows for the misclassification rates to vary across annotators and across units.
It specifically allows imperfect labels to share sources of errors as long as such common causes are
captured by eD. The vector D may contain observed or derived characteristics of the input (e.g.,
writing style, text length, language, or image quality) measured by rich text embeddings. It may also
contain annotation-level information that varies across units (e.g., prompt version, task duration,
annotation order, or recorded fatigue). This assumption is significantly weaker than the classical
conditional independence assumption stated in (3.1), which did not allow for any shared source of
errors. Assumption 3.1 still fails if unobserved common sources of errors remain after conditioning.
Importantly, if researchers want to avoid assuming access to gold-standard labels, they have to make
some assumptions about proxies, and our paper makes the assumption explicit and transparent by
building and extending the classical literature.
Remark 1. As LLM annotations are one of the most common application areas, we will come back
to this assumption and use Section 5 to specifically discuss (a) how to make this assumption more
plausible by carefully selecting conditioning variables eD and (b) how to choose different families of
LLMs and prompts to construct measurements. We also develop a series of diagnostic tools for this
assumption. Please see Section 5.
9
3.2

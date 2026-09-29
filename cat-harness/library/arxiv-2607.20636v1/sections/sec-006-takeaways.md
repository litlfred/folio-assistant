---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-006-takeaways
section_title: "Takeaways"
section_number: null
pages: 21-24
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Finally, let us summarize the key contributions and takeaways of this thesis. They are, as
mandated by rhetorical best practices, threefold:
1. Technical results in the IMAB setting: We provide algorithmic upper bounds
and complementary lower bounds for the general version of the problem. We follow
this up with a beyond-worst case analysis of the problem in the data-driven algo-
rithm design paradigm, characterizing the sample complexity of historical instances
to learn good algorithms. Our results provide insights for important practical prob-
lems like hyperparameter tuning. In general, our algorithms for this problem have
an optimistic flavor, and they follow a “singular evaluation approach” [Kle01] to
decision-making, which involves serially and quickly evaluating whether an option is
likely to be the best one and discarding it if not.
6
2. Incentivizing ambition: We theoretically characterize where can financial inter-
ventions help people act in a way that is in accordance with their beliefs while also
being ambition. That is, we ask and answer: can we align ambition with beliefs
about self and community? These works show not only that financial incentives
can incentivize people to engage in ambition (which is perhaps intuitive) but also
that carefully-designed financial incentives can have lasting effects even after the
intervention period ends.
3. Applying CS tools to philosophical questions: This thesis expands our un-
derstanding of how to apply computer science tools to problems about belief and
epistemology. We, of course, do so through our technical results. We also analyze
why this approach is useful and explore limitations of theoretical models. Our re-
flections on these issues culminate with our guidelines for developing theoretical CS
models for such problems.
7
Part I
Improving Multi-Armed Bandits
8
Chapter 2

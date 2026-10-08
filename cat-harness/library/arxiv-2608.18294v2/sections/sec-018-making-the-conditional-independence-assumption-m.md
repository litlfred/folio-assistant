---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-018-making-the-conditional-independence-assumption-m
section_title: "Making the Conditional Independence Assumption More Plausible"
section_number: null
pages: 22-22
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
The first approach is to judiciously create a conditioning set.
Unlike the traditional conditional
independence assumption that only conditions on the latent variable itself (equation (3.1)), our
method explicitly allows for conditioning on auxiliary input- or annotation-level information Di and
the downstream variables Wi. Therefore, by incorporating rich information about each annotation
task, the proposed method allows for measurement errors to be dependent through task difficulty,
such as text length, complexity, language, writing style, or image quality. More generally, researchers
can include any pre-specified features derived from the raw input like texts, images, and videos, such
as text embeddings. One useful option is to include an estimate of task difficulty constructed from the
level of agreement among additional proxies that are not used in the main analysis, e.g., quantifying
the disagreement between multiple LLMs and including the disagreement score in a conditioning set.
Second, researchers can also make the conditional independence assumption more plausible by
carefully constructing multiple measurements themselves. In particular, researchers should seek mea-
surements with substantively different error mechanisms rather than selecting proxies solely by pre-
dictive accuracy. For LLM annotations, this may involve using different model families (e.g., one
from the GPT family and another from an open-source model) as errors are more likely to be corre-
lated within the same model family. In general, our method only requires G ≥3 groups of proxies
that are conditionally independent, but we can allow for any dependence of errors between proxies
within each group. Specifically, partition the proxies into G ≥3 groups e
X[1], . . . , e
X[G] and generalize
Assumption 3.1 to the following group-level conditional independence assumption.
e
X[1] ⊥⊥· · ·⊥⊥e
X[G] | X∗, eD,
which allows for arbitrary dependence among proxies within the same group. Each group is then
treated as a single multicategory measurement whose realizations are the joint label patterns. If
each group has a full-rank joint measurement matrix, one can construct a group-specific bridge and
apply the robust bridge construction across groups, as in Section 4.2. This formulation permits, for
example, annotations from GPT-4 and GPT-5 to form one group, annotations from Claude Opus
and Sonnet to form another group, and those from an open-source model to form the third group,
while allowing for any error dependence within each group. In practice, independently produced
human annotations can also provide another useful measurement group even if they are not treated
as gold-standard labels and their accuracy might be lower than LLMs. This is because human errors
may differ systematically from those of LLMs. Importantly, human annotators should be blinded to
the other annotations.
Finally, another strategy is to use different prompts across annotators, as a particular pattern in
one prompt might create the same error across annotators. If researchers can commit to one clean and
validated prompt or a codebook, that will not introduce any correlated error. But when researchers
cannot pin down one particular prompt, as in many applications, they might be able to randomly
sample prompts from an admissible pool of prompts so that different annotators share fewer sources
of errors. More generally, prompts may also be adapted to different types of inputs, provided that
the prompt version and characteristics are recorded and included in the conditioning covariates eD.
5.2

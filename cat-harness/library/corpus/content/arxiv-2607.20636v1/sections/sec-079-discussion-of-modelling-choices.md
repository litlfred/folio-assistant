---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-079-discussion-of-modelling-choices
section_title: "Discussion of Modelling Choices"
section_number: null
pages: 107-108
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Modelling Perspective In this work, we provide a theoretical model for the following
aspects of grit: we define a two-armed improving bandit instance that represents the
decision-making problem agents are faced with. We further define two different objectives
a decision-making agent might prioritize. Finally, we model different aspects of grit with
92
careful study of variations of parameters in the bandit instance. While there are many
folk notions of “grit”, the aspects we choose to model are based on the abstraction and
formalization provided by [MP19]. We do not seek to evaluate whether or not their account
is valid but rather to quantitatively formalize their notions and study the implications of
their analysis. In doing so, we find additional confirmation for empirical work regarding the
value of “grants” provided to people attempting ambitious choices. For instance, a study of
grants given to entrepreneurs in Burkina Faso shows that even if immediate profits aren’t
improved, providing this financial support increases innovation and improves business
practices, suggesting that those who get support get more time to explore and build a good
foundation for their business [GSW21]. Similarly, a study in Kenya found that intervening
with grants to youth entrepreneurs at a time of crisis helped individuals maintain their
businesses and produce more profits [DJSZ21]. In a different vein, experiments in cognitive
science and psychology show that children and adults alike are more likely to explore in
the presence of caregivers [DATG24]. These empirical studies suggest that if someone
is inclined to take an ambitious action, then supporting them helps improve outcomes,
exactly what is captured by our model (as summarized in the table). In the future, our
model could be used to develop resource allocation schemes in such settings. It would also
be interesting to study community-level effects when agents of varying levels of grit make
decisions based on each other.
Strengths A strength of our model is that the same multi-armed bandits instance can be
used to study many different facets of grit, and resulting outcomes are visible just through
this two-armed bandits instance. Also, our modelling allows for a modular understanding
of the effect of grit on first, behavior and second, outcome or reward associated with that
behavior. This, then, allows us to study interventions that encourage similar behavior
with less outcome risk.
Weaknesses Our model is not without its shortcomings. We are limited to studying
an agent’s choice between two options in this framework.
In real settings, the stable
option might not have the same return for all time. Human rationality is rarely, if ever,
executed exactly as competitive ratio maximization or expected reward maximization over
a prior. However, these seem like natural simplifications that provide a starting point for
quantitative analysis of this trait.
7.7

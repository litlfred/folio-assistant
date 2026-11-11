---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-039-taxonomy-of-tcs-based-social-models
section_title: "Taxonomy of TCS-based Social Models"
section_number: null
pages: 63-65
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this essay, I reflect on three epistemic purposes a theoretical model might serve. First,
a satisfactory model will reproduce a phenomenon observed in the real world. A richer
model would propose an explanation for why this phenomenon occurs. Finally, the richest
model is one that suggests an intervention that would allow us to achieved a desired real-
world outcome. Typically, a model should achieve at least one of these epistemic purposes.
Certainly, I never claim that a model will be correct in an absolute sense; the processes of
abstraction and idealization inherent to modeling necessarily excise the complexity, and
often messiness, of the real world. Thus, when considering the adage “All models are
wrong, but some are useful,” frequently attributed to statistician George Box, I seek to
argue about the different ways in which models can be useful. I will then discuss how to
evaluate models against those intended purposes.
The idea that models should be designed for and then assessed with respect to a
certain purpose is what, in her 2020 paper, Wendy Parker calls an “adequacy-for-purpose
view” [Par20]. We will take a similar perspective to hers, arguing that rather than study
how accurately a model reflects reality, we will assess whether it fits its purpose well or
not. Parker further notes that, “for a model to be adequate-for-purpose, it must stand
in a suitable relationship not just with a representational target but with a target, user,
methodology, and background circumstances jointly.” [Par20, pg. 460]. We will engage
with all of these aspect as we think about models and evaluation.
While ontological and semantic questions abound about these models, I will focus
narrowly on theoretical models, which I am defining as models that include formal math-
ematical definitions of any agents, their action and reward spaces, and “update rules” for
both agent behavior and reward provided by the universe. The model specification should
also include any constraints on when the model and regimes in which it is / isn’t relevant
to the real-world task at hand. An agent is anyone that has some ability to take actions
in the world. In the most general sense, actions might not even be adaptive; they could
just be a collection (for instance, we can think of training data for a machine learning
model as the set of “actions” in this framework). Reward comes from playing the action
in context (this is clear in the decision-making setting; in the machine learning setting
this is the loss). Update rules define the dynamics and could either comprise how agents
choose their next action / interaction and/or what changes about the environment (in
the machine learning example, the change in the weights during gradient descent could be
48
the change in the environment). This is a sufficiently general framework for the kinds of
models we will discuss here. When I refer to the “setting,” I mean the tuple that specifies
the things defined so far. The “phenomenon” is the outcome of the model under certain
conditions. The “outcome” could be the forward evolution of initial conditions, or it could
be a comparison of two different parameter regimes in the setting. My construction draws
on Michael Weisberg’s conception of a theoretical model [Wei07]. He writes that:
The construal of a model is composed of four parts: an assignment, the mod-
eler’s intended scope, and two kinds of fidelity criteria. The assignment and
scope determine and help us evaluate the relationship between parts of the
model and parts of the real-world phenomenon. The fidelity criteria are the
standards theorists use to evaluate a model’s ability to represent real phenom-
ena.
The assignment, “which is the specification of the phenomenon in the world to be
studied and the explicit coordination of parts of the model with parts of the real-world
phenomenon,” ([Wei07, pg. 219]) arises through the specification of the agents and rewards
and formalizing the action spaces. The scope, which Weisberg writes, “specif[ies] which
parts of the model are to be ignored,” is handled by making explicit the regimes in which
the model is meant to be used and not used and by specifying the constraints on the
model. Finally, the fidelity criterion arise from the purposes for which we develop the
models. We discuss these in the respective sections.
Note that when we talk about the epistemic purpose of the model, it is (almost always)
with respect to outcomes. That is, a model is useful with respect to modeling some out-
come, or some set of outcomes, in the setting, not just the setting. Again, this corresponds
to Parker’s view that models should be evaluated with respect to a purpose, not just with
respect to their ability to reproduce reality. Parker further details the distinction between
adequacy for instance of use and context of use [Par20], the latter being a generalization of
the former. Finally, Parker argues that, “for a model to be adequate-for-purpose, it must
stand in a suitable relationship not just with a representational target but with a target,
user, methodology, and background circumstances jointly” [Par20, pg. 460]. That is, they
must be developed and evaluated with the user, the ways in which they are deployed, and
broader conditions in which they are deployed. The taxonomy of epistemic purposes I
develop here can be viewed as an adaptation of Parker’s framework for the specific class
of models I focus on, namely TCS-style models for social problems.
Running Example: Schelling Model
Throughout this essay, we will refer to a “Schelling model,” and so we briefly introduce it.
The Schelling model [Sch71] is a computational model that aims to answer the question,
“can cities end up segregated through only the preference of people to live close to those
similar to them?” In order to study this, the model instantiates a grid in which each cell
represents a household. At each time step, an agent evaluates whether or not at least α
fraction of their neighbors are like them. If this condition is satisfied, then the agent stays
put. Else, the agent moves to the nearest empty location.
Suppose we instantiate this model with a random initial distribution of agents accord-
ing to types, and α = 0.3. Then computer simulations on a 51 by 51 grid result in almost
49
70% similar neighbors.
Thus, the model answers in the affirmative that a mechanism
purely driven by agent preference can lead to segregation1.
5.1.3

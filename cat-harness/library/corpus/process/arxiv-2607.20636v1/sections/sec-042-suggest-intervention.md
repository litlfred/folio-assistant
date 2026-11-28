---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-042-suggest-intervention
section_title: "Suggest Intervention"
section_number: null
pages: 71-73
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In the sequence we have been developing, the grandest purpose of a model is to suggest
how to change the real-world system so we may achieve desirable outcomes. It could be the
case that the posited explanation justifies why an action taken in practice is a wise idea.
The model might suggest a mechanism that we could hope to intervene on. Alternatively,
the modularized model might evince a “location” (in terms of a module, or a few) where
changing something would appreciably change outcomes under the same dynamics. In
these ways, having a model clarifies the key parts of the dynamics and setting that lead
to the observed outcomes and allows us to identify which to interact with to change the
outcomes.
Elliot-Graves writes of a distinction between “confirmatory prediction” and “applied
prediction” [EG26]. The former is meant for testing theories and evaluated by accuracy
and variance, while the latter is meant for intervention and evaluated for its utility even in
resource- and information-poor settings [EG26]. Thus, in this section, we shift our focus
from confirmatory to applied prediction. These aspects of models and interventions leads
us to an additional, crucial, perspective arising from the literature on causal inference.
Per Woodward’s interventionist account of causal modeling, to claim a causal relationship
between variable A and variable B is to claim that an intervention on variable A always
results in a predictable change in variable B [Woo07]. Thus, interventions provide an
extremely natural framework for evaluation of the causal structure ina model. We return
to this argument and perspective when we address evaluation.
First of all, interventions do not need to be novel and grand. If there is some existing
input into the system, positing an explanation for why that input effects its outcome can
justify an existing intervention. Thus, depending on how we break up the system and
inputs to it, just solving the second goal (explanation) might already have implications
for the intervention goal. For instance, if a subsidy program is in place in the real-world,
a model that explains why that is useful justifies the use of that subsidy scheme as an
intervention.
A helpful perspective to take in this discourse involves setting up a parallel between
physics and engineering, and in particular, control theory. When it comes to the quality of
the model, it can turn out that a model that suffices for explaining most behaviors in the
prediction or reproduction sense is not sufficient enough for control. For instance, we might
have a non-linear system for which a first-order model mostly covers the observed behavior.
The non-linear correction might be ignorable when we are just comparing trajectories.
However, if the control input brings the system into a problematic regime, the error might
blow up badly.
56
In fact, I can give this example with conviction, as this happened in my final project for
a control theory class. My lab partner and I built a LEGO elevator and characterized
its behavior in open loop. A simple model mostly fit observations and definitely incurred
noise, but we figured that is what happens in the real world.
Thus, we proceeded to
derive the controller and implement it. It failed miserably. We redid everything several
times before whispering to each other, “should we try a more complex model?” We did,
rederived the controller, and had great success.
To frame this anecdote in the language of the philosophy of modeling literature, the
real-world target remained consistent throughout. For the initial purpose of reproduction,
the dynamic fidelity criterion [Wei07] was okay to incur some noise. However, when our
purpose shifted to intervention, what we asked of the model changed, and with that, so did
the dynamical fidelity criterion. Likewise, in the language of Wendy Parker’s adequacy-for-
purpose framework[Par20], the simpler model was adequate for the purpose of reproduction
but not for the purpose of intervention.
Thus, this anecdote really highlights a core
argument of this essay, that models must be constructed and evaluated according to the
epistemic purpose they serve, even when they are meant to reflect the same target.
To think about interventions, it is important to have not only a good understanding
of the world but also access to some way of controlling the system. That is, we need
some sort of way of accessing and modifying the relevant part of the system. This access
point, in the engineering setting, could be electrical, mechanical, or digital. Note that
we need to be careful about the control environment in the model. For instance, it is
nonsensical to suggest changing the laws of physics, but it might be sensible to add a
motor to an item in order to change its position. Likewise, in a social model, we must
carefully consider who carries out the intervention, what kinds of resources or influences
they have, and what information they have access to. Sure, we can change outcomes if
individuals automatically do different things, but this is not a realistic, implementable
intervention.
Similarly, assuming an intervener has access to information they do not
have (such as access to a relevant probability distribution, or agents’ private information)
is silly. The concept is familiar to computer scientists as “lexical scoping.” Weisberg shows
that in the Schelling model, the information available to each of the agents can be viewed
as scoping:
Lexical scoping can also be a representational resource in more scientifically
interesting contexts. Consider an agent-based model such as Schelling’s model.
In this model, each agent is very simple but still has an identity. In this case,
an identity means that it is numerically distinct, has a location and a utility
function, and has a current level of utility. All of this information should not
be available to all of the other agents. In other words, the scope of these agent
variables is restricted to the agent and sometimes the agent’s neighbors. In a
slightly more sophisticated version of the model that had strategic interactions,
this would be even more relevant. One agent may need to “guess” what another
is going to do, but if it had access to the internal state of all the agents, there
would be no need to guess; all the information would be available. [Wei20,
pgs. 226-7]
Could interventions that use privileged information still have value? Possibly, in that
57
they could guide us to consider how to get them access to information or develop incentives,
but we must be aware that we are not telling a complete story yet.
Finally, we must ask: is an intervention useful if it hasn’t been implemented in the
real world? To that I say: absolutely! Studying interventions, even without implementing
them, provides additional insight about the setting in the model: it shows us what is
possible and what heuristic aspects of the world could be affecting our outcomes. We can
think of proposed interventions as experiments we can run on our model to, on the one
hand, identify cause and effect and, on the other hand, stress test which aspects of the
model are robust.
What This Implies for Evaluation of Model
Having made the shift from confirmatory to applied prediction (as distinguished by Elliott-
Graves in [EG26]), it is important to note that the standards for evaluating the two families
of models are different. Thus, it would be inappropriate, and possibly even harmful, to
only consider metrics like accuracy of the predictions of the model on real-world targets.
Following up on our claim in the beginning of this section, by developing interventions
in our models, we may evaluate the causal structure in our modeling. An interventionist
perspective on causality, of which Woodward is a prominent proponent, argues that a
model represents causal relationships between its variables if the effect of an intervention
on a variable in the model is reflected in a corresponding change in the target when the
real-world variable is intervened upon. In particular, following Woodward’s terminology, a
model is said to be invariant under an intervention when it correct predicts the outcome of
an intervention in the target. Importantly, he notes that: “Invariance under interventions
is thus a relative matter: a generalization may be invariant under some interventions (and
thus qualify as causal) but not under others” [Woo07, pg. 162]. Accordingly, we can see
that intervention poses a stronger criterion for model evaluation than reproduction.9 A
model that is invariant under intervention is a strong model.
Practically speaking, implementing versions or variations of our intervention could help
us understand, in the positive case, how robust our intervention is, and in the negative
case, whether the model had fatal flaw or the lack of success of the initial intervention was
just a result of simplification (and therefore a version that accounts for noise works in the
real-world case).
5.1.6

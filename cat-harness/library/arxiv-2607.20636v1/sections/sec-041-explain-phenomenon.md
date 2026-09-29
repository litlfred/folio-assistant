---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-041-explain-phenomenon
section_title: "Explain Phenomenon"
section_number: null
pages: 67-71
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The next kind of model goes beyond just reproducing a phenomenon. It posits an expla-
nation for why this outcome occurred. The explanation often modularizes the muddled
impacts of various abstract pieces. This explanation can then be tested in the real world
by intervening on the posited mechanism, i.e., on the module that has significant impact.
In this way, such a model provides probes for future inquiry4. The posited mechanism
should, ideally, be falsifiable. Abstraction and modularity are familiar terms to computer
scientists and are key parts of the design of computer systems. In this section, we show
how they are relevant for building theoretical models for phenomena of interest.
The philosophy of modeling literature distinguishes between two different kinds of
explanations, how-possibly and how-actually explanations ([Dra64, Dra79, For10, VJ19],
among others). How-actually explanations are meant to explain, as their name suggests,
how actually some phenomenon arises in the real world. On the other hand, how-possibly
explanations essentially show that an outcome is not impossible. They provide a possible
mechanism without necessarily providing a complete explanation5. In our development,
we will defend how-possibly explanations as valuable in specific circumstances, especially
when we argue in Section 5.1.6 that TCS brings to modeling a unique perspective on
encapsulation as a topic of study.
A satisfactory explanation must address two puzzles: why the outcome occurs and
what would change about the outcome if things changed in the setting. Often, causal con-
siderations come into play, and the latter part described above is indeed a counterfactual
that a model would be able to predict. To this end, James Woodward writes in [Woo04]
that the relationships and dependence between “explanans” (factors) and “explanandum”
(things to be explained):
enable us to see what sort of difference it would have made for the explanandum
if the factors cited in the explanans had been different in various possible ways.
Thus, in the terms used by Woodward, a model allows us to isolate the explanans and
and the explanandum in such a way that we can modify the explanans in order to see the
effect on the explanandum.
Once explanans and explanands are isolated, we have modules that comprise our model.
Each module reflects some or several aspects of reality in some simplified way, by remov-
ing either “noise” or excess complexity. These modules correspond to the components
Weisberg describes as comprising an “abstraction hierarchy” [Wei20]. This perspective is
valuable because it also, as suggested by Weisberg, draws out the question of where in the
hierarchy representation occurs (in fact, it is up to the modeler to decide the answer to
this question through the way in which they choose to organize the modules):
Parts of computational structure becomes representational when theorists have
the appropriate construals. As a consequence, construals will help us answer
the question of which parts of the hierarchy are represented. For our purposes,
robustness, clarifying the differences between parameter, structural, and representational robustness.
4as a field, physics makes tremendous use of this perspective
5See [YA14, VJ19] for thorough ontological accounts of how how-possibly explanations could possibly
explain. For our purposes, it suffices to accept that they can.
52
the most important part of a modeler’s construal is her intended scope and her
assignment. Intended scopes specify which aspects of a target phenomenon are
intended to be represented by a model, while assignments tell us which parts of
the model are intended to represent which parts of a real or imagined target.
Taken together, they allow the modeler to specify which part of the model
should be understood as representational and which is just part of the non-
representational infrastructure of the model. [Wei20, pg.219]
Thus, we may conclude that as modelers, our intents in framing the target and defining
modules to model it are crucial parts in the modeling task. This, then, provides us the
freedom to choose modules that isolate explanations.
Naturally, we gravitate toward
simplifying the real-world when devising modules. Indeed, a rich line of work argues that
not only do models explain despite their simplicity, but also they only explain because of
their simplicity. Among them, Batterman and Rice 2014 argue that, “an explanatory story
devoid of representation relations is required to understand how these models can be used
to such great effect” (emphasis mine) [BR14]. They go on to argue that such models and
many real-world phenomena lie in the same universality class. Potochnik develops this
idea further, arguing that “idealizations themselves play a positive representational role.
Idealized models and other scientific products do not represent despite their idealizations
but partly in virtue of those idealizations. Moreover, idealizations aid in representation
not simply by what they eliminate, such as noise or non-central influences, but in virtue
of what they add, that is, their positive representational content” [Pot17, pg. 50].
During a wonderful month spent in the French Alps, pondering what aspects of statistical
physics could be applied to machine learning 6, I found myself marveling at how the
erosion patterns of the solid rock comprising the mountains so closely resembled the erosion
patterns of the ice making up the glaciers that crowned them. Indeed, at the level of
erosion, it did not (significantly) matter whether the underlying substance was rock or
solid water. Similarly, returning to the Schelling computational model, Elliott-Graves and
Weisberg argue:
Imagine if we replaced the highly idealized utility function with a more psy-
chologically realistic one.
Imagine further that we included a realistic city
map and realistic barriers to moving house. Such a model may well exhibit
the Schelling dynamic, but now it would be impossible to tell which aspects
of the model were responsible for the dynamic. This would result in a loss
of explanatory power, even while we might gain representational realism. In
cases like these, idealizations are justified and will remain. [EGW14, pg. 180]
The desire for simple components that provide explanatory clarity, then, raises the
question of what it means to “isolate” these explanatory aspects. To answer the question
of what it means to isolate the modules, we have to consider exactly what about the real
world we are “ignoring” in order to develop the model. We can separate the kinds of
6This experience raised for me many questions of how we should shape the epistemology of deep learning
“theory” inspired by physics. Time spent considering this, no doubt, must’ve influenced my contempora-
neous reflections on models and universality
53
simplifications we make into two categories: abstractions and idealizations. The distinc-
tions between then two and the resulting relative roles have been studied extensively in
the literature, including in [Val12, EGW14]. On the one hand, abstraction involves “black
boxing,” assuming that item has some input-output behavior or certain characteristics;
an abstraction is not dependent on exactly how the inputs cause the outputs or why the
characteristics arise. Weisberg develops a thorough account in [Wei20] of abstraction and
encapsulation. He writes: “By encapsulate, I mean that we hide details of how things
work, only knowing that a certain kind of input is expected, a procedure will be applied...,
and then the transformed output will arrive in a particular form.”
We use the term
“abstraction” to refer to this process.
On the other hand, idealization involves taking some limit or stylizing behavior in
some fictional way. Elliot-Graves and Weisberg develop a rich account of idealization in
[EGW14]. They identify three different kinds of idealizations: Galilean, minimal, and
multiple-models. Galilean idealization [EGW14, pg. 177-8] are ones made due to lack
of capacity to consider the full version, and we expect to be able to de-idealize them
with availability of better data or computational power. Minimal idealizations [EGW14,
pg. 178] entail the modeler choosing factors they deem relevant to the purpose of their
model. Finally, multiple-model idealizations [EGW14, pg. 178] occur when several par-
allel, related, but incompatible models are developed to address different aspects of the
problem.
In the TCS-style models we study, we typically utilize abstraction7 and focus on mini-
mal and multiple-models idealizations. The distinctions between these different approaches
affect the kinds of explanations that arise from models that use them. Abstraction allows
us to focus on the role components with certain inputs and outputs play in a system with-
out getting distracted by the particularities of the map between the inputs and outputs.
We idealize concepts exactly so we can focus on the idealized versions without having to
deal with the complexity of the de-idealized concept. A minimal model explains because
of its simplicity, and attempting to add complexity back would destroy the explanation.
Models employing multiple-model idealizations each explain isolated components of a sys-
tem but do not explicitly combine these factors.
It is not always easy to go beyond idealizations in social modeling. In my own work, I have
been guilty of assuming “rationality” of human actors8. While it is convenient to argue
that we are simply following the assumptions of the philosophers on whose work we base
ours, there are significant reasons to deeply question the simplification (and particularly
the idealization) of “humans are rational actors.” On the one hand, we can talk about
all kinds of reasons for which people might not behave rationally, ranging from inability
to reason about uncertainty to unexpected influences.
However, harping on humans’
inability to be rational belies a deeper issue with idealizing the setting in this way: when
we formalize behavior, we impose that an agent must be able to specify a quantitative
objective such that optimizing that objective yields rational behavior.
In practice, as
7of course! we are computer scientists, after all.
8This is one of Potochnik’s paradigm cases: “Many people are familiar with the common assumption
in physics of frictionless planes and with the common assumption in economics that humans are perfectly
rational agents. These are both idealizations: every plane has friction, and no human is a perfectly rational
actor” [Pot17, pg. 42-3].
54
people, we do not, and we actually ought not, make most of our decisions according
to optimizing a quantitative objective.
In Weisberg’s terms, by making a rationality
assumption, we are defining a procedure followed by agents in our computational model.
He notes that in the Schelling model, “The model will explain the segregation in a real
city if an analogue to that procedure characterizes the real agents in that city” [Wei20,
pg. 213]. Thus, the possibility that humans’ decision-making processes are unlikely to be
similar to the procedure induced by the rationality assumption is quite troubling for the
purposes of deriving an explanatory model.
In our work assuming rational human behavior, we often made these assumptions
partially due to the emphasis on rationality in the philosophy source material and partially
with the aim of mathematical tractability. For instance, it can interesting to note that
bad outcomes occur even when agents behave rationally. Thus, in this case, the use of
idealization allows us to show that simply being rational cannot itself protect against
negative outcomes. However, it does make it harder to evaluate whether our interventions
might be relevant for the real world.
Appropriately modularizing components of a system, whether through abstraction or
idealization, allows us to examine the real world system, absent subtleties and noise that
we have decided are okay to set aside for now. Assuming the first goal (reproduction of
the phenomenon) is fulfilled, an explanation will consist of rules for how one module affect
other modules and/or how changing one module will affect another one.
What This Implies for Evaluation
Per Weisberg’s account in [Wei18], we are actually not validating the model itself, but
rather we are validating hypotheses about the model. In particular, he writes, “ One way
to develop such an account is to formulate hypotheses about a model’s similarity to its
target. . . . we can formulate them as follows: ‘Model M is similar to target T in respects
X, Y, and Z.”’ [Wei18, pg. 250]. If we are simply interested in reproduction, as in the
previous section, X, Y, Z would essentially capture first-order measurements that are easy
to evaluate. On the other hand, in the case of explanations, X, Y, Z could be posited
mechanisms that can then must evaluated in the target real-world system.
In particular, if the posited mechanism is falsifiable, then we could hope to design
an experiment to test whether this mechanism is reflected in the real world. The mod-
eling exercise involves isolating modules that effect outcomes, and such a module could
represents a probe in the real world. For example, if a model suggests that the age of in-
dividuals with whom someone interacts should affect outcomes, we could either passively
measure whether there are differences in the data between individuals that have different
age communities or actively rearrange social groups and observe effects.
It is especially important here over other places that we keep the user of the model
in mind, as Parker encourages [Par20]. If our explanation is in the language of our TCS
model, the natural user base would be individuals who have the appropriate background
and language to interpret the resulting theorems. An explanation that appeals to, say,
convergence of an iterated dynamic to a Nash equilibrium is adequate-as-explanation only
for users who can make sense of that conceptual apparatus.
Thus, if the goal of the model is producing a mechanistic explanation, we end up with a
55
natural way to evaluate the model: if the mechanism is true, then the model is good; if not,
the model is bad. But is it still useful to identify false mechanisms? Suppose by “false,”
we mean a mechanism that is not at all at play in the real world. This could still be useful
if it allows us to rule bad explanations out to make way for the true explanation. It could
also help posit a counterfactual world; in particular, if the false explanation has attractive
properties, then we could think about modifying the world so that that explanation takes
root. This brings us toward the idea of using a model to identify interventions. We cover
this in detail in the next section.
5.1.5

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-001-unifying-framework
section_title: "Unifying Framework"
section_number: null
pages: 18-19
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We take two perspectives regarding theoretical models for decision-making in this thesis:
(1) what I will call the classical “sequential decision-making” perspective and (2) what I
will call the “social modeling” perspective. These two perspectives will echo the ways in
which game theory and mechanism design, as fields, view problems; the differences lie in
what about the problem setting we hold fix and what we modify. In a decision problem,
there are three parts we will need to specify in order to define the abstract version of the
problem. First, we delineate the abstract details of the setting. This includes agents,
actions available to them, information available to them, and any constraints thereof.
Next, we consider the heuristic or algorithm by which agents make decisions. Finally,
we must study outcomes. This includes the degree to which the decision objective is
optimized, as well as any resulting phenomena or externalities. We will make all of these
more precise in the specific settings in which we study them. For now, in the abstract
sense, we will discuss what happens to the setting, algorithm, and outcomes in each
perspective.
In the classical sequential decision-making perspective, we are interested in character-
izing optimal algorithms for solving a sequential decision-making task. In our framework,
that means that we specify the setting, specify the outcome we wish to achieve, and
then identify algorithms and characterize their optimality. As the setting, we would
specify the information and actions available to an agent in the decision-making problem,
the costs incurred or rewards available thereof, and any resulting changes to the world.
As the outcome, we could say that we wish to maximize the accrued reward, or minimize
costs. Then, an algorithm or strategy would have to navigate the world, getting informa-
tion, costs, and reward under the specified goal. This perspective is familiar to theoretical
computer scientists.
In the “social modeling” perspective, we will have two tasks. First, we will fix the
setting, fix the algorithm used by agents, and study the outcomes. Usually the goal in
this stage will be to ensure our model reproduces outcomes from the real-world setting of
interest. Once we are satisfied that the model reflects what we want it to about the real
world1, we can think about modifications. We then tweak the setting and explore how that
affects the outcome, allowing us to steer outcomes toward desired ones by appropriately
intervening on the setting.
Further, this tells us what conditions in the setting were
sufficient or even necessary for outcomes to look a certain way. Through this exercise, we
are able to reason about human behavior and how to make outcomes incentive-compatible.
For studying decision-making in an abstract sense, it is useful to consider this frame-
work because it allows us to isolate the relative effects of the setting and algorithmic
1Models reflecting what we want them to about the real world can be subtle! We discuss more on our
perspective on what models can be useful for in Chapter 5.
3
choices. From here, we can characterize optimal decision-making in a way that is familiar
to computer science theorists. Additionally, we can develop controlled models in which
to study heuristics used by humans in practical decision-making. By comparing these
two sides of the coin, we can hope to evaluate outcomes from using heuristics against
outcomes that would result from optimal decision-making, and we could even try to in-
centivize agents to use optimal decision-making strategies. On the other hand, by thinking
of the factors/heuristics driving human decision-making as fixed, we also don’t take an
overly prescriptive position. That is, we never say, “if people just changed their behavior,
things would be better in the world!” We instead think about what factors in the world
might lead decision makers toward “worse” decisions and identify ways to change those
factors. This perspective is especially useful when studying social problems.
We do not claim that this framework is complete or without flaws. It is simply the
framework that we use to organize and interpret our results.
1.2

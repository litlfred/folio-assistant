---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-132-related-work
section_title: "Related Work"
section_number: null
pages: 179-180
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We survey two categories of work related to ours. First, we discuss work from the social
sciences that observes grit in people and analyzes its role and impact in society. We also
include work that abstracts and formalizes what differentiates grit from other related traits.
Next, we focus on relevant computer science literature related to the formal frameworks
we use in our analysis.
One of the most popular studies of grit is psychologist Angela Duckworth’s book
[Duc16]. In it, she discusses how across fields and circumstances, the trait of grit dis-
tinguishes people who succeed from people who succumb to their circumstances. This
work had a significant impact on popular understanding of the impact of hard work on
success, suggesting that grit is often a more important factor than talent or proclivity.
Relatedly, psychologist Martin Seligman has a large body of work encouraging positive
attitudes as a path to success and good outcomes [Sel02, Sel06]. School systems like the
Knowledge is Power Program (KIPP) Charter Schools have operationalized this somewhat
academic research (including by bringing Seligman on as a consultant [Gib20]) to build
their signature “no excuses” philosophy of education, emphasizing personal responsibility
and grit as paths to success.
More recently, sociologist Tom Wooten studied the impact of the “no excuses” educa-
tional approach in his dissertation [Woo22], using ethnographic methods to study outcomes
for six students who attended schools with this educational philosophy, particularly explor-
ing the mechanisms by which these systems perpetuate poverty. In particular, he argues
that upward mobility in the United States is fundamentally precarious, with seemingly
small disruptions destabilizing those coming from impoverished backgrounds much more
than those who have more financial stability. Wooten’s findings are the impetus for us to
investigate the impacts of financial support on the behavior of gritty agents in Section 7.4.
He also reflects on the pitfalls of an educational system that overemphasizes grit, writing
that, “In lieu of such large, fundamental changes, my research also points to smaller policy
shifts that could make a big difference. One shift is that primary and secondary schools
should carefully examine the explicit and implicit lessons they teach their students about
‘grit,’ altering their curricula to emphasize balance and pacing.”
Abstracting findings from several such observational studies, [MP19] develop a philo-
164
sophical theory of grit, arguing that it is possible due to a philosophical concept called
Permissivism for two agents to interpret the same body of evidence in completely dif-
ferent ways, and in fact grit is a consequence of Permissivism. We build heavily on the
abstractions derived in this work.
Finally, we survey some computer science literature that we draw on in order to quan-
titatively formalize and study the question of decision-making with and without grit. The
perspectives we take on rationality are inspired by objectives that are commonly opti-
mized in the computer science literature, including the competitive ratio studied in online
learning [BEY05] and the Bayesian approach to uncertainty quantification [BS00]. The
framework we use to represent the decision problem is an instance of the multi-armed ban-
dits problem, a well-studied framework for making decisions when the payoff is unknown
[Sli22]. More particularly, we suppose the bandit arms have structured reward, and the
structure of interest is improving, first formalized by [HKR16] and studied in general by
[PNGK23, BR25].
D.2

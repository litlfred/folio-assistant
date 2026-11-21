---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-065-related-work
section_title: "Related Work"
section_number: null
pages: 95-96
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
several fields, including philosophy, sociology, and computer science. Then, we formally
introduce the multi-armed bandits instance we study. In Section 7.3, we study the compet-
itive ratio-based notion of rationality, following which in Section 7.4 we introduce models
for financial support and study the effects of the financial safety net on behavior and re-
ward. Finally, in the Appendix, we investigate the Bayesian notion of rationality, studying
uncertainty tolerance in this setting.
7.1.3
Related Work
First, we discuss work from the social sciences that observes grit in people and analyzes its
role and impact in society. One of the most popular studies of grit is psychologist Angela
Duckworth’s book [Duc16]. Relatedly, psychologist Martin Seligman has a large body of
work encouraging positive attitudes as a path to success and good outcomes [Sel02, Sel06].
More recently, sociologist Tom Wooten studied the impact of the “no excuses” educational
approach, which draws on the above ideas, in his dissertation [Woo22], particularly explor-
ing the mechanisms by which these educational systems perpetuate poverty. Abstracting
findings from several such observational studies, Morton and Paul develop a philosophical
80
theory of grit [MP19]. We build heavily on the abstractions derived in this work.
Next, we survey computer science literature that we draw on in order to quantita-
tively study the question of decision-making with grit. Our formalizations of rationality
are inspired by objectives that are commonly optimized in the computer science litera-
ture, including the competitive ratio studied in online learning [BEY05] and the Bayesian
approach to uncertainty quantification [BS00]. The framework we use to represent the de-
cision problem is an instance of the multi-armed bandits (MAB) problem, a well-studied
framework for making decisions when the payoff is unknown [Sli22]. In particular, we sup-
pose the bandit arms have structured reward, and the structure of interest is improving,
first formalized by [HKR16] and studied by [PNGK23, BR25].
Key Features of Grit According to Morton and Paul
Since we base our development of a theory of grit on the account of [MP19], it will be
helpful to summarize the key points from their work. In their work, Morton and Paul
describe gritty behavior as displaying a form of “epistemic resilience.” An important part
of this is how an agent redefines their goal in the presence of encouraging or discouraging
evidence. They also reason that grit is rational, and therefore agents displaying grit cannot
ignore evidence but rather should be sensitive to failure. Citing works from psychologists
Angela Duckworth and Martin Seligman, Morton and Paul further highlight the impor-
tance of hope and optimism. They culminate by providing a description of an “Evidential
Threshold” that captures the decision-making of a gritty agent. The Evidential Threshold
as conceptualized by them asks how compelling evidence must be to change the actions of
an agent; for a gritty agent, the Evidential Threshold is higher than that of an “impartial
observer.” Since this threshold hinges on how compelling the agent finds the evidence,
Morton and Paul argue that Permissivism applies, and different agents can witness the
same evidence but come to different conclusions about what implications that evidence
should have on their actions. Throughout the chapter, we will connect back to these vari-
ous facets described by Morton and Paul, including by providing a quantitative analog of
the Evidential Threshold.
7.2

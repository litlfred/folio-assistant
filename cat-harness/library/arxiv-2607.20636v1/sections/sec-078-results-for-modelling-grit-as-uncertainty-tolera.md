---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-078-results-for-modelling-grit-as-uncertainty-tolera
section_title: "Results for Modelling Grit as Uncertainty Tolerance"
section_number: null
pages: 106-107
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We consider the case where an agent has a Gaussian prior on when the striving arm
will pay off. This corresponds to having some understanding of when the arm might start
91
Figure 7.2: Switch point as a function of standard deviation σ for prior of N(25, σ2).
paying off but not being entirely sure that it will pay off then so allowing for some latitude.
Thus, the variance of the Gaussian prior corresponds to the uncertainty tolerance of the
agent.
We find that as the variance of the prior increases, the point s at which the agent
reverts to the stable arm also increases. Thus, as an agent becomes more gritty, there is
a wider range in which if θ lies, they will witness it. At the same time, if θ lies above the
blue curve in Figure 7.2, the agent would not witness the increase, and they would also
collect less stable reward. From the asymptoting shape, we can conclude that beyond a
certain point, uncertainty tolerance has limited benefits, as the stable reward decreases
but the additional region is not increasing by much.
Morton and Paul note that:
“Other things being equal, the gritty agent’s evidential threshold for updating
her expectations of success will tend to be higher than the threshold an impar-
tial observer would use. This is not because the perspective of the impartial
observer is epistemically privileged, however; the Permissivist latitude applies
to the policies of the agent and the observer alike. Rather, it is because the
observer has no need to respond to the evidence in a way that guards against
premature despair, and this should be reflected in his evidential policies.” (p.
195 in [MP19])
Our results corroborate this – if we suppose the ‘impartial observer’ switches if the
striving arm has not yet paid off when s reaches their expectation for when they payoff
begins, then the gritty agent indeed has a higher threshold for updating their expectation
of success.
7.6

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-047-our-contributions
section_title: "Our Contributions"
section_number: null
pages: 79-80
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this chapter, we study pessimism traps as conceptualized by Morton and offer interven-
tions to shift communities out of these traps. Our first major contribution is to link the
concept of a pessimism trap to the opinion dynamics literature. We do so by interpreting
a single-dimensional information cascade model as a decision sequence in a community.
We extend this in Section 6.4 to consider k parallel information cascades representing the
decision processes of k independent communities.
Our next major contribution is an intervention for the single community setting that
sustainably shifts communities out of pessimism. We consider a subsidy enacted by the
government to incentivize certain behavior in an agent.
Two natural ideas fail: first,
suppose we subsidize the ambitious action by a large fixed amount. While this intervention
incentivizes agents to act ambitiously in the short term, once the subsidy program ends,
subsequent agents will ascribe prior agents’ ambition entirely to the subsidy they received
and fall back into pessimism traps. Secondly, subsidizing by too small an amount fails to
incentivize the ambitious action over the moderate one at all. Thus, we derive the precise
size of the subsidy that will incentivize those who were already leaning toward ambition
while not moving those who were anyway not considering the ambitious choice. Herein
lies our first surprising insight – the non-monotonicity associated with the effect of the
size of subsidy.
Next, we study k communities, each behaving as above. The government still inter-
venes but must act impartially with respect to community membership. Each of these
groups may have a different optimal choice among the two options, and the government
(a) does not know which choice is optimal for each group and (b) must be blind to com-
munity membership in providing subsidies. We show that in this case, we can construct
a distribution D such that if the government draws the subsidy randomly from that dis-
tribution, then eventually each community will shift toward what is the optimal end for
them. This intervention relies crucially on the previous insight: if the provided subsidy is
in the “just right” range discussed above for an agent, the agent’s action will shift their
community toward optimal action. However, if it is too large or too small (outside of that
range), the community will remain in the same state. Thus, provided the distribution as-
signs at least a minimum probability to the “just right” range for a fixed community, that
group will eventually settle into their optimal action. Therefore, our second main insight
is that since we can guarantee (1) the existence of a range of subsidy values that shift
the community toward the correct action for that community and (2) a single community
faces no negative effect when provided a subsidy outside of that range, the government
can use randomization to shift all groups into optimal behaviors, even without knowing
what is optimal for any given community.
Finally, we verify the effectiveness of our proposed intervention in the one-group case
via experiments. Our experiments show that the intervention we develop is indeed success-
ful in shifting sequential decisions into optimism. Further, we confirm that the required
budget for the intervention is tractable. Our experiments provide additional confirmation
64
of the benefits of our intervention in the simple model that we study.
We view our work as a step forward in providing a theoretical model in which to
study pessimism traps and, more broadly, in developing empowering interventions for
marginalized communities. While our model is necessarily stylized, our major insights
could help guide interventions in more complex settings.
In summary, our contributions are:
1. Linking the opinion dynamics and pessimism traps literatures by studying pessimism
trap formation in the information cascade model.
2. Identifying an intervention that sustainably shifts a community of agents away from
pessimism traps.
3. Extending this result into a setting where there are k different groups and where the
government knows neither which the correct action is for a group, nor how close they
are to escaping the trap and showing the power of randomization in this setting.
4. Corroborating the success of our theoretical interventions experimentally.
The remainder of this chapter is organized as follows. First, we briefly survey work from
a diverse array of fields related to our work. Next, we present the formal mathematical
model in which we study pessimism traps along with some preliminary facts about them,
and we reflect on the strengths and weaknesses of this modeling approach. In Section 6.3,
we introduce and analyze our intervention to shift a single group toward optimism. We
then extend this in Section 6.4 to the setting with k groups each of whom has an unknown
optimal action. Finally, we provide experiments that show the success of our proposed
interventions, substantiating our theoretical results.
6.1.2

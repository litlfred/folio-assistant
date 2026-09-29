---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-069-modelling-grit-optimism
section_title: "Modelling Grit: Optimism"
section_number: null
pages: 98-101
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Now, let us discuss the relationship between the grittiness of an agent and their approach
to the multi-armed bandit problem above. A gritty agent is optimistic about the potential
for reward of the risky action, or they would not persevere in taking it. Accordingly, for
this setting, we consider an agent with higher guess for the slope of the increasing portion
of arm f2 to be more gritty. Based on this, we can investigate consequences (in terms of
both strategy and reward) of demonstrating grit and offer mechanistic insight as to why
these consequences exist. The guess for the slope affects how long the agent is willing to
play the striving arm (details in Appendix D.3.1). Formally:
83
Definition 7.3.2. In the “grit-as-optimism” setting, an agent is ˜α-gritty if they guess
that the slope of the increasing portion of the striving arm is ˜α .
Lemma 7.3.2. Suppose an agent guesses a value for α that we call ˜α , i.e., is ˜α−gritty.
Assume their goal is to maximize the competitive ratio. Then, they play f2 for T −
q
2T
˜α
steps, following which they switch to f1 permanently.
Results
Now, let us consider A, an ˜αA-gritty agent. A is not particularly gritty, so ˜αA is small. On
the other hand, B is somehow privy to perfect information, so ˜αB = α . Finally, consider
C, an ˜αC-gritty agent. C is very gritty, and so ˜αA < ˜αB = α < ˜αC . (We are simply
instantiating the agents in this way to study “high” and “low” grit as they compare to
perfect information.) In order to understand the impact the grit-induced strategy has on
the reward the agent accrues, we are interested in understanding (1) what level of grit
witnesses the striving arm paying off; (2) what level of grit results in good stable reward.
Observation 1: Duration of Attempt
Applying Lemma 7.3.2, we have that agent A
switches at time sA = T −
q
2T
˜αA , agent B at sB = T −
q
2T
α , and agent C at sC = T −
q
2T
˜αC .
Note that sC > sB > sA . Our first conclusion, therefore, is that the duration for which
an agent explores is longer for a grittier person.
Observation 2: When Does Increased Grit Benefit the Agent?
Let us now study
under what conditions each agent comes out on top. The reward achieved by any agent
depends on the relationship between θ , the threshold beyond which the striving arm starts
increasing, and s , the agent’s switch point as stated in the below proposition.
Proposition 7.3.1. If θ ≤s , then an agent switching at s receives α
2 (T −θ)2 reward, but
if θ > s , then the agent receives T −s reward.
Proof. If θ ≤s , then the arm starts paying off while the agent is still playing it. This
means that the agent accrues reward starting at time θ up until time T as the function
increases linearly. Hence, the reward is α
2 (T −θ)2 . On the other hand, if θ > s , then the
agent gains no reward from the striving arm. They gain reward from the stable arm from
time t = s to time t = T , which is T −s units of reward.
Let us consider how different levels of grit affect reward (Figure 7.1 may help visualize
the relative rewards.):
1. Case 1: θ < sA .
θ < sA .
θ < sA . Everyone’s reward is the same in this case, since all agents receive
α
2 (T −θ)2 reward.
2. Case 2: sA < θ < sB .
sA < θ < sB .
sA < θ < sB . In this case, A has given up and switched to the stable arm.
As a result, they receive
q
2T
˜αA reward. However, agents B and C stay on the striving
arm long enough to witness θ , and so they receive α
2 (T −θ)2 reward. We see that
this is a situation where a lack of grit fares worse than being rather gritty.
84
3. Case 3: sB < θ < sC .
sB < θ < sC .
sB < θ < sC . In this case, A and B have both given up and switched
to the stable arm, but C valiantly perseveres.
Here, A receives
q
2T
˜αA reward, B
receives
q
2T
˜αB reward, and C receives
α
2 (T −θ)2 . C outshines even B, who had
perfect information about the rate of reward increase. In this case, curiously, the
least gritty person actually fares better than someone with perfect knowledge of the
payoff. We can understand this as follows: there are two reasons why the received
reward would be small – one is location of θ and one is size of α. In this case, someone
that is pessimistic about the value of the reward magnitude due to pessimism about
α ends up reaping the side benefit when the reward is indeed small, but it is because
θ is large i.e., they are right about the reward being small but for the wrong reasons2.
4. Case 4: sC < θ .
sC < θ .
sC < θ . In this case, no one receives the reward from the striving arm.
However, since C has stuck around for so long, they actually also receive less reward
overall from the stable arm. This indicates that there is a failure mode when an
agent is too optimistic. Further, the resulting strategy of sticking it out for a long
time can fail when θ is quite large.
This reflects what [Woo22] calls the “effort
paradox,” where students encouraged to be gritty often end up burnt out.
Figure 7.1: This table shows the reward the agents described in Section 7.3.2 receive if
θ , the true threshold beyond which f2 pays off, lies in different regions. The columns are
increasing in grit from left to right. We can see that if θ is larger, more grit can actually
result in less reward, since the agent switches back to the stable arm and accrues less
reward there.
2This is an interesting consideration for further modeling – in this particular setting, the model does
not disentangle between these reasons for the reward to be small. More broadly, a competitive ratio-based
model that studies reward in general rather than particular kinds of reward may not be able to disentangle
this at all.
85
Observe that when the first agent switches, all agents have the same evidence about
the striving arm. Likewise, when each agent switches, the remaining agents all have the
same evidence, though different agents act differently, albeit all rationally, in response to
this information. While it may at first seem disconcerting that people with access to the
same evidence have different yet completely rational responses to it, this is is consistent
with the philosophical thesis of Permissivism, which argues that “some bodies of evidence
permit more than one rational doxastic attitude toward a particular proposition” [JL23].
Thus, it is reasonable for different agents to have different beliefs about the underlying
state of the world upon receiving a set of evidence (i.e., different agents have different
beliefs about how long it is worth staying on an arm after receiving reward 0 for the first
sA time). In fact, Morton argues that Permissivism exactly allows for grit to be conceived
of as a factor in shifting people’s behavior from the norm even when presented shared
evidence. Indeed, in our model, we explicitly model this aspect of how beliefs + evidence
→actions by having each agent hold different beliefs about the payoff slope α.
This perspective also provides us a natural way in which to consider the optimal level
of grit for this setting. In particular, if we can remove the uncertainty in the guess for α ,
then the only remaining uncertainty has to do with when the function will start improving.
This suggests that agents who have guesses for α closer to the true α will fare better.
7.3.3

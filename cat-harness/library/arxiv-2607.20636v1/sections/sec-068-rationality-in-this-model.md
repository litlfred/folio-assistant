---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-068-rationality-in-this-model
section_title: "Rationality in This Model"
section_number: null
pages: 97-98
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The first formal model for rationality we study is one in which an agent minimizes regret in
hindsight by optimizing the competitive ratio. Competitive ratio measures the relationship
between the achieved reward and the optimal reward. This is a commonly-studied notion
in theoretical computer science, and particularly in online algorithms [BEY05]. Achieving
a competitive ratio of 1 ensures that the agent did as well as they could hope. Formally,
we define the competitive ratio as follows:
Definition 7.3.1. An algorithm achieves competitive ratio g if the ratio of its reward
ALG to the optimal achievable reward OPT is at least g , i.e., if ALG/OPT ≥g .
In certain situations where we are interested in the accumulated reward up to a certain
time point t of the algorithm, we will refer to it as ALGt .
We will consider agents who have beliefs about α , the potential for payoff, and who
optimize their competitive ratio over an unknown θ , the time after which the payoff begins.
Suppose an agent has a deterministic algorithm to choose how to play arms f1 and f2 as
defined above. Each time the agent plays f1 and then switches back to arm f2 , they
could instead have played f2 followed by f1 while gaining the same reward but possibly
witnessing the increase sooner. Thus, there is no benefit to interweaving steps of the arms,
1for instance, during a PhD or while starting a business
82
and any deterministic strategy for playing this instance can be boiled down to the point
at which it switches from f2 to f1 . We formalize this in the following lemma.
Lemma 7.3.1. Any strategy that interweaves plays of f1 and f2 can be converted into a
strategy that plays only f2 followed by only f1 that achieves at least as much reward.
Proof. Suppose the interweaving strategy plays a total of t1 steps on f1 and s steps on
f2 . Consider two cases: in the first case, s < θ . Then, the total reward of the policy is t1 ,
and playing s steps of 0-reward-accruing f2 followed by t1 steps of f1 achieves this reward,
the same as any interweaving version. In the second case, s ≥θ . Now, by the previous
argument, the policy that plays θ steps of f2 followed by t1 steps of f1 still receives t1
reward. However, after θ steps on f2 , the agent witnesses the increase and therefore has
no incentive to switch to the stable arm. The reward of playing the remaining s −θ + t1
steps on the striving arm is 1
2(s −θ + t1)2 , which is greater than t1. Thus, we have shown
that for each interweaved strategy, there is a non-interweaved one that accrues at least as
much reward.
As a result of this lemma, it suffices to study strategies that play f2 for a while and
then permanently switch to f1. Thus, we will extensively study this switch point, and it
will be an interesting quantity to study as a proxy for gritty and non-gritty strategies.
Morton and Paul discuss an “Evidential Threshold,” writing “In a given context, how
much evidence is required – that is, how compelling must the evidence be –before the
thinker comes to a conclusion about what to believe or revises her current beliefs?” [MP19].
In our proposed framework of analysis, the switch point reflects this evidential threshold.
The agent’s strategy can be summarized as “if I don’t see evidence that striving is going
to pay off until time s, I will give up.” The threshold s is different for different agents,
and so the policy the agent follows exactly corresponds to their evidential threshold as
described by Morton and Paul.
For a fixed switch point s , there are two “worst” cases – the first is when the arms
are such that playing the stable arm the whole time would provide the optimal reward,
and so the longer the agent spends exploring before switching, the worse the competitive
ratio gets. On the other hand, if the striving arm pays off right after the agent switches,
then staying on the arm just a little longer would have paid off, so this competitive ratio
is increasing with s . In order for our strategy to minimize overall regret, we pick s such
that the ratio is the same regardless of which extreme case we are in, i.e., we solve for s
when the two extreme cases are equal.
7.3.2

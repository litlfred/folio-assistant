---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-127-analyzing-the-subsidy-scheme
section_title: "Analyzing the Subsidy Scheme"
section_number: null
pages: 171-176
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We can model the state of a fixed group receiving a randomly chosen subsidy from the
distribution D using a random walk, as before. In Lemma 6.4.2, we describe that random
walk, following which in Definition 6.4.3 we define a related walk.
Proof of Lemma 6.4.2
Proof. First, as before, we can formalize this process as a random walk, where the location
on the random walk depends on the net difference between the number of people taking
the “positive” action for their group and the number taking the “negative” action. It is
clear that if an agent reveals their signal (which is “right” (both in terms of alignment
with world and in direction on the walk) with probability p) they take a step in the “right”
direction. Now, if the agent does not reveal their signal, there is no step taken on the
random walk, since the location on the random walk is given by the number of revealed A
signals less the number of revealed B signals. If the agent does not reveal their signal, then
the action they take is ascribed by an agent to the subsidy they received and therefore
does not affect the location on the random walk. We formalize this in the lemma before.
Lemma C.6.1. A step of size 1 is taken on the random walk if and only if the agent
revealed their signal.
If (and only if, per the lemma above) the agent playing at a given time reveals their
signal as a result of the government subsidy, they take a step on the random walk. Since
there could be a range of subsidies that are signal-revealing at a given location on the
random walk for a value of p , there may be multiple values the government could pick
that would cause signal-revealing. Let these values be {vj}m
j=1 . Then, αi := P
j Pvj [ ] .
Now, with probability αi , the signal is revealed and a step is taken, and with probability
1 −αi , the signal is not revealed and the walk stays in the same state. If the signal is
revealed, then as before, the walk proceeds from i to i + 1 with probability p and from i
to i −1 with probability 1 −p .
Remark 9. If a group for whom the correct action is A / right reaches +L > 2 , then
they are in the correct cascade for them. Similarly, if B / left is the correct action for a
group and they reach −L < −2 in the random walk, then they are in the correct cascade
for them.
156
We showed in the previous section in Lemma C.4.2 that L = 2 actually suffices for
pushing people into the cascade. However, in this setting, because the government provides
the signal-revealing subsidy even after one group reaches L = 2 , it may be possible to get
a “bad” string of signals that push a group back toward the pessimism trap. Thus, we
need to sustain it for longer. We show in subsequent lemmas exactly for how much longer
we need to apply it.
Next, we analyze the simplified random walk R (Lemmas C.6.2, C.6.3) and then show
that we can use the analysis of R to study Rgvt (Lemma C.6.4).
Lemma C.6.2. In random walk R as defined in Definition 6.4.3, the probability that when
starting at location i , the walk hits L before hitting −L is given by:
xi = P [walk hits L before hitting −L when starting at i]
=
2p −1
(1 −p)

1−p
p
−L
−

1−p
p
L
i
X
j=−L+1
1 −p
p
j
.
Thus, in order for x0 ≥1 −δ , i.e., for the probability of hitting the correct cascade before
the incorrect one when the walk starts from 0 to be high, we need L =
log(1/δ−1)
log(p/(1−p)) .
Proof. We can analyze this by means of a recurrence. For xi defined as in the lemma
statement, we have that:
xi = (1 −pmin) xi + pmin p xi+1 + pmin (1 −p) xi−1
⇔xi = p xi+1 + (1 −p) xi−1
⇔p (xi −xi+1) = (1 −p) (xi−1 −xi)
Now, we write down the boundary conditions: x−L = 0 and xL = 1 . Next, we solve the
dynamics:
Define yi := xi −xi−1 ⇒(1 −p) yi = p yi+1
(C.1)
Solution
yi = c
1 −p
p
i
(C.2)
xL −x−L = 1 =
L
X
i=−L+1
yi =
L
X
i=−L+1
c
1 −p
p
i
(C.3)
⇔c =
1
PL
i=−L+1

1−p
p
i =
1 −1−p
p

1−p
p
−L+1 
1 −

1−p
p
2L+2
(C.4)
=
2p−1
p

1−p
p
 
1−p
p
−L
−

1−p
p
L
(C.5)
157
Plugging this back into the definition of yi , we get:
xi = xi−1 +
2p −1
(1 −p)

1−p
p
−L
−

1−p
p
L
1 −p
p
i
(C.6)
Finally, let us incorporate the initial condition x−L = 0 . Then,
x−L+1 =
2p −1
(1 −p)

1−p
p
−L
−

1−p
p
L
1 −p
p
−L+1
,
and in general:
xi =
2p −1
(1 −p)

1−p
p
−L
−

1−p
p
L
i
X
j=−L+1
1 −p
p
j
.
Note that when i = L , indeed xL = 1 .
Finally, we compute x0 =
2p−1
(1−p)

1−p
p
−L
−

1−p
p
L P0
j=−L+1

1−p
p
j
and set this to be
at least 1 −δ so we can determine what the appropriate threshold L is. In particular:
x0 =
2p −1
(1 −p)

1−p
p
−L
−

1−p
p
L




1−p
p
−L+1
−

1−p
p

1 −

1−p
p




(C.7)
=

1−p
p
−L
−1

1−p
p
−L
−

1−p
p
L =
1
1 +

1−p
p
L
(C.8)
want
≥1 −δ .
(C.9)
Solving, we get L ≥
log(1/δ−1)
log(p/(1−p)) .
Lemma C.6.3. After T =
2L
pmin (2p−1) +
2 log(1/δ)
p2
min (2p−1)2 steps of this random walk, with proba-
bility at least 1 −δ, the walk will have moved at least L steps net to the right.
Proof. Let us define the outcome of step i in the following way:
Xi :=





+1
step right, i.e., w.p. pmin p
0
step right, i.e., w.p. 1 −pmin
−1
step right, i.e., w.p. pmin (1 −p)
.
We are interested in upper bounding P
hPT
i=1 Xi ≤L
i
. To do so, we will apply a Hoeffding
bound. In particular, we have that E [Xi] = −pmin + pmin p + pmin p = pmin(2 p −1) and
158
so E
hPT
i=1 Xi
i
= pmin T (2 p −1) . Applying the Hoeffding bound:
P
" T
X
i=1
Xi ≤E
" T
X
i=1
Xi
#
−
 
E
" T
X
i=1
Xi
#
−L
!#
≤exp
 
−2 (L −pmin T (2 p −1))2
T · 4
!
(C.10)
= exp
 
−2 (L −pmin T (2 p −1))2
4T
!
.
(C.11)
Finally, we can solve the following quadratic in T to show that the stated value of T
suffices:
4 log(1/δ) T ≤2L2 −4L pmin (2p −1) T + 2 p2
min T 2 (2p −1)2
(C.12)
T ≥max
−(−4L pmin (2p −1) −4 log(1/δ))
4 p2
min (2p −1)2
±
(C.13)
q
(−4L pmin (2p −1) −4 log(1/δ))2 −4(2 p2
min (2p −1)2)(2L2)
4 p2
min (2p −1)2

(C.14)
⇐T ≥2 (4L pmin (2p −1) + 4 log(1/δ))
4 p2
min (2p −1)2
(C.15)
=
2L
pmin (2p −1) +
2 log(1/δ)
p2
min (2p −1)2
(C.16)
We show that we can analyze Rgvt by analyzing the simpler-to-analyze R .
Lemma C.6.4. We can analyze the random walk Rgvt described in Lemma 6.4.2, i.e.,
the one reflecting the dynamics of the game in the presence of the described government
subsidy, by instead analyzing the random walk R given in Definition 6.4.3. In particular,
the probability xi = P [walk hits L before hitting −L when starting at i] is the same in
both random walks, R , Rgvt . Further, let TR be the number of steps needed to be taken in
R for the walk to hit L with high probability. Suppose TRgvt is the number of steps needed
to achieve the same in Rgvt. Then, TRgvt ≤TR .
Proof. We consider the two parts separately.
Probability Let us write the recurrence equations for each of the random walks. First,
for Rgvt:
xi = (1 −αi) xi + αi (1 −p) xi−1 + αi p xi+1 .
And for R :
xi = (1 −pmin) xi + pmin (1 −p) xi−1 + pmin p xi+1 .
Now, observe that subtracting the first term on the right hand side from both sides we
159
get, respectively:
αi xi = αi (1 −p) xi−1 + αi p xi+1
pmin xi = pmin (1 −p) xi−1 + pmin p xi+1 .
This can be simplified to:
xi = (1 −p) xi−1 + p xi+1
xi = (1 −p) xi−1 + p xi+1 .
These equations are the same, meaning that the dynamics are the same. If the boundary
conditions are the same, then the values will also be the same.
Time Required To Converge For this, we simply observe that the relationship
between αi in Rgvt and pmin in R is αi ≥pmin ∀i . Let us consider the instances where
a step is taken in the original walk Rgvt as compared to where steps are taken in the
analyzed walk R . Define Di := I [ step taken in R] . Define:
˜Di =





1
if Di = 1
1
w.p. αi−pmin
1−pmin if Di = 0
0
otherwise.
Note that ˜Di is 1 with probability αi and 0 with probability 1 −αi . Additionally, due
to the coupling, Tα := PT
i=1 ˜Di ≥PT
i=1 Di =: Tpmin . As a result, there are strictly more
steps taken in Rgvt than in the R . Conditioned on taking a step, the probabilities of right
and left steps are the same. Thus, for a threshold of interest Q , the probability of not
exceeding it after Tα steps is smaller than the probability of not exceeding it after Tpmin
steps.
Proof of Theorem 6.4.1
Finally, we present the proof of the main theorem, Theorem 6.4.1.
Proof. We start by fixing a group to look at.
We show that the subsidy behaves, as
before, as a random walk that group takes on the number line and show how long it
takes to achieve with high probability a sufficient condition for the walk to finish in an
up cascade. We then union bound over the failure probability and appropriately scale the
time required to get the stated result.
Thus, let us start by fixing a group. Suppose for this group that A is the correct
choice (“right” is the direction for an up cascade). All of our subseequent arguments hold
symmetrically in the case that B is the correct choice (“left” is the direction for an up
cascade). By Lemma 6.4.2, we have the description of a random walk Rgvt that models
the setting in Definition 6.4.1 with the government subsidy described in Definition 6.4.2.
Further, Lemma C.6.4 establishes that for the quantities of our interest, we can study R
defined in Definition 6.4.3 instead of Rgvt .
160
With this having been established, let us define a tolerance parameter δ0 := δ/(3k)
which represents the probability of a single failure for a single group. If there is probability
at most δ0 that the walk does not net L steps and probability at most δ0 that even if the
walk nets at least L steps, it hit −L first, then the total failure probability for this walk is
at most 2δ0 = δ/k . We want the group to take sufficiently many steps in the random walk
that it exceeds a threshold L , sending it into an up cascade. In the past, we considered
L = 2 because the government knew the correct action and only subsidized it, but now
that we’re subsidizing both actions, we need to protect against hitting a bad cascade before
hitting the correct one. By Lemma C.6.3, we have that T =
2L
pmin (2p−1) +
2 log(1/δ0)
p2
min(2p−1)2 steps
suffice for netting L steps to the right with probability at least 1 −δ0 = 1 −δ/(3k) .
Now, we do want to make sure the walk did not hit a down cascade before it hits
the up cascade. For this, we analyze the probability of hitting the down cascade first in
Lemma C.6.2. As before, we want the probability of failure to be at most δ0 , and so
applying Lemma C.6.2, L ≥log(1/δ0−1)
log(p/(1−p)) .
Thus, with probability at least 1 −2δ0 = 1 −2δ/(3k) , this group will end in an up
cascade after
2 log(1/δ0−1)
log(p/(1−p))
pmin (2p−1) +
2 log(1/δ0)
p2
min(2p−1)2 steps (i.e., agents from this group are seen) without
any negative side effects.
Next, we analyze how long it takes to see enough agents from this group with high prob-
ability. An agent is from group j with probability at least gmin , and so with probability
at least 1−δ0 , after 2T ⋆+2 log(1/δ0)
gmin
agents, we have seen agents from that group at least T ⋆
times. Thus, we have that with probability at least 1−δ/k , after
2


2 log(1/δ0−1)
log(p/(1−p))
pmin (2p−1) +
2 log(1/δ0)
p2
min(2p−1)2

+2 log(3k/δ)
gmin
steps, with high probability, for a fixed group, we have (1) seen enough agents from that
group to (2) see enough “correct” signals for that group and (3) not enter a bad cascade
first. Finally, we union bound over the k groups to get that with probability at least 1−δ ,
k times this number of steps suffices for all groups to reach positive cascades.
C.7

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-121-formulation-as-a-random-walk
section_title: "Formulation as a Random Walk"
section_number: null
pages: 165-168
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Calculating the posterior can be difficult depending on the tie-breaking rule, as agents
have to reverse engineer previous individuals’ thought processes. However, with the tie-
breaking rule we employ and our eventual subsidy, we can reformulate this process as a
one-dimensional random walk on the integers. We begin with a toy example for intuition.
Lemma C.4.1 (Asymmetric Simple Random Walk in -1 to 1). While the number of
choices for action A and action B in the history ¯Ht−1 differ by no more than 1, agent t
will follow their signal. Thus, the process is an asymmetric simple random walk in this
interval.
Proof. We will prove this through induction.
Our inductive hypothesis is that if the
previous t−1 agents acted according to their signal, and if the number of choices of action
150
A and B differ by at most one, then agent t will follow their signal. To begin, we establish
the base case. Consider the first agent. Note that the hypothesis that the previous t −1
agents acted according to their signal is vacuously true. Now, let us look at the two signal
options for the first agent to verify that they indeed follow their signal in each case. If the
first agent receives signal s1 = A, they will update their posterior, according to Eqn. 6.1
as:
P [EA|s1 = A, H0 = {}] =
P [s1 = A|EA] P [H0 = {}|EA]
P
w∈{A,B} P [s1 = A|Ew] P [H0 = {}|Ew]
Now, because H0 is always {}, we can set P [H0 = {}|EA] = P [H0 = {}|EB] = 1 and
simplify the above expression to:
P [EA|s1 = A, H0] =
P [s1 = A|EA]
P [s1 = A|EA] + P [s1 = A|EB] =
p
p + (1 −p) = p
Because p > 1
2, the first agent will choose action A in this case, thus following their
signal.
If, instead the agent receives signal B, they will update their posterior as:
P [EA|s1 = B, H0] =
P [s1 = B|EA]
P [s1 = B|EA] + P [s1 = B|EB] =
1 −p
1 −p + p = 1 −p
In this case, they will choose action B, again following their signal. From this, we
can say that the first agent’s action is identical to the action of their signal and so is
distributed as a Bernoulli random variable with success parameter p.
This satisfies the base case. Now, we proceed by induction. Suppose that the previous
t−1 agents acted according to their signal, i.e., Ht−1 = ¯Ht−1. Let |A| indicate the number
of choices for A observed among the first t−1 agents, and let |B| be the number of choices
for B among those agents. Then, if the tth agent gets signal A, their posterior is:
P [EA|st = A, Ht−1] =
p|A|+1(1 −p)|B|
p|A|+1(1 −p)|B| + p|B|(1 −p)|A|+1
If |A| = |B|, then the posterior is equal to p, and the agent follows their signal. If
|A| = |B| −1, the posterior is equal to 1
2, and the agent breaks the tie by following their
signal. Finally, if |A| = |B| + 1, the posterior is
p2
p2+(1−p)2 , which is greater than 1
2 for
p > 1
2.
Equivalently, if they get the signal B, the posterior is:
P [EA|st = B, Ht−1] =
p|A|(1 −p)|B|+1
p|A|(1 −p)|B|+1 + p|B|+1(1 −p)|A|
151
Lemma C.4.2 (Stopping Points at -2 or 2). A cascade will begin if the number of choices
for action A and action B in the history Ht−1 differ by 2.
Proof. To see this, assume that at time t, |A| −|B| ≥2 or |A| −|B| ≤−2. Consider the
first case. If agent t gets signal A, their posterior is
p
1 −p
|A|−|B|+1
≥
p
1 −p
3
≥1
and so they take action A. If they get signal B, their posterior is
p
1 −p
|A|−|B|−1
≥
p
1 −p ≥1
So, regardless of their signal, they choose action A. Thus, a cascade begins, because
this condition will be maintained for each subsequent agent. An equivalent analysis applies
to the second case.
Lemma C.4.3 (Probability of Wrong Cascade). The probability of an incorrect cascade
for p > 1
2 is

1−p
p
2
+

1−p
p
3
1 +

1−p
p

+

1−p
p
2
+

1−p
p
3 .
Proof. We can compute this probability via a recurrence. Consider a random walk on the
number line. Define Xi as the probability a walk starting at i reaches 2 before it reaches
-2. Then, we have that:
Xi = p Xi+1 + (1 −p) Xi−1
;
X2 = 1
;
X−2 = 0
We can solve this system as follows:
Yi := Xi −Xi−1
p Xi + (1 −p) Xi = p Xi+1 + (1 −p) Xi−1 ⇔(1 −p) Yi = p Yi+1
Yi = Y0
1 −p
p
i
2
X
i=−1
Yi = X2 −X−2 = 1
⇒
Y0 =
1
P2
i=−1

1−p
p
i
Xi = X−2 +
i
X
j=−1
Yj =
1
P2
j=−1

1−p
p
j
i
X
k=−1
1 −p
p
k
.
152
Simplifying this somewhat, we have that starting at 0:
P [up cascade] =
1 +

1−p
p

1 +

1−p
p

+

1−p
p
2
+

1−p
p
3
P [down cascade] =

1−p
p
2
+

1−p
p
3
1 +

1−p
p

+

1−p
p
2
+

1−p
p
3
Therefore, there is a substantial probability of an incorrect cascade, increasing as p
gets closer to 1
2.
Lemma C.4.4 (Expected Starting Time). In expectation, it will take
2
1−2p+2p2 agents for
a cascade to begin.
Proof. To compute this, let us consider the same random walk defined in Lemma C.4.3.
With respect to this random walk, let us now define Zi = Etime to ±2 starting from i [ ] . That
is, we are interested in the expected time it takes to converge to a cascade. We can write
the following equations and initial conditions (Z2 = 0; Z−2 = 0) and solve manually:
Zi = p (Zi+1 + 1) + (1 −p) (Zi−1 + 1) = 1 + p (Zi+1) + (1 −p) (Zi−1)
Z0 = 1 + p (Z1) + (1 −p) (Z−1)
;
Z1 = 1 + p Z2 + (1 −p) Z0 = 1 + (1 −p)Z0
Z−1 = 1 + p Z0 + (1 −p) Z−2 = 1 + p Z0
Z0 = 1 + p (1 + (1 −p)Z0) + (1 −p) (1 + p Z0) = 2 + 2 p (1 −p) Z0 =
2
1 −2 p (1 −p) .
C.5

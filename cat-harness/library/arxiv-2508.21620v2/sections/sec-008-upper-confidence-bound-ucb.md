---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-008-upper-confidence-bound-ucb
section_title: "Upper Confidence Bound (UCB)"
section_number: null
pages: 12-15
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Let us now consider the following decision rule (Auer, 2002): At each time 𝑡= 1, . . . ,𝑇, we pick
an action that maximizes the function
UCB𝑡(𝑎) = 𝜇𝑡(𝑎) +
√︁
(2 log𝑇)/𝑁𝑡(𝑎),
(3.3)
where 𝜇𝑡(𝑎) = 1/𝑁𝑡(𝑎) P𝑡
𝑖=1 𝑟𝑖(𝑎𝑖)I(𝑎𝑖= 𝑎) is the empirical mean estimate of 𝜇(𝑎) after 𝑡
rounds, and 𝑁𝑡(𝑎) = P𝑡
𝑖=1 I(𝑎𝑡= 𝑎) is the number of times the action 𝑎has been selected. The
algorithm is summarized in Algorithm 2.
Algorithm 2 UCB
Input: Time horizon 𝑇, set of 𝐾actions A
Output: Cumulative reward 𝑟total
1: 𝑟total = 0
2: for 𝑡= 1, . . . ,𝑇do
3:
Count 𝑁𝑡(𝑎) for each 𝑎∈A
4:
Compute 𝜇𝑡(𝑎) for each 𝑎∈A
5:
𝑎𝑡= argmax𝑎∈A 𝜇𝑡(𝑎) +
√︁
(2 log𝑇)/𝑁𝑡(𝑎)
6:
𝑟𝑡𝑎= do_action(𝑎𝑡)
7:
𝑟total = 𝑟total + 𝑟𝑡𝑎
8: end for
9: return 𝑟total
Intuitively, we maintain both our estimate of 𝜇in the form of 𝜇𝑡, and our “confidence”—not to
be confused with the definition of confidence in the Bayesian setting—about that estimate. This
“confidence” is essentially an error bar around 𝜇𝑡, the standard error around the sample mean.
11
3 Frequentist Bandits
If our estimate of an action is high and the error bar is wide, we will therefore tend to pick that
action (exploration). As 𝑡increases, the values of 𝑁𝑡will increase, and hence the error bars will
decrease. We can then be confident that our estimate 𝜇𝑡is very close to 𝜇and we can simply
pick the best action every time (exploitation).
Theorem 3.3. At each round 𝑡= 1, . . . ,𝑇, the UCB algorithm has expected regret of
E(𝑅𝑡) ≤O
√︁
𝐾𝑡log𝑇

with probability ≥1 −2𝐾
𝑇3 .
Thus, the UCB algorithm has no regret w.h.p.
Proof. Define 𝜀𝑡(𝑎) =
√︁
(2 log𝑇)/𝑁𝑡(𝑎). Suppose the event 𝐸= {| ˆ𝜇𝑡(𝑎) −𝜇(𝑎)| ≤𝜀𝑡(𝑎);∀𝑎∈
A, ∀𝑡= 1, . . . ,𝑇} holds. Let 𝑎∗and 𝑎𝑡be the (unknown) optimal arm and the selected arm at
time 𝑡, respectively. Since 𝑎𝑡is selected at time 𝑡, then by the algorithm, UCB𝑡(𝑎𝑡) ≥UCB𝑡(𝑎∗).
Since 𝐸holds, 𝜇(𝑎𝑡) + 𝜀𝑡(𝑎𝑡) ≥ˆ𝜇(𝑎𝑡). Moreover, by definition, UCB𝑡(𝑎∗) ≥𝜇(𝑎∗). Therefore,
𝜇(𝑎𝑡) + 2𝜀𝑡(𝑎𝑡) ≥ˆ𝜇(𝑎𝑡) + 𝜀𝑡(𝑎𝑡) = UCB𝑡(𝑎𝑡) ≥UCB𝑡(𝑎∗) ≥𝜇(𝑎∗).
Rearranging, we have
Δ𝑡(𝑎𝑡) := 𝜇(𝑎∗) −𝜇(𝑎𝑡) ≤2𝜀𝑡(𝑎𝑡) = 2
√︁
(2 log𝑇)/𝑁𝑡(𝑎𝑡).
We will use this bound to obtain the bound for E(𝑅𝑡).
Since we pick a single action at each time step, first we note that 𝑡= P
𝑎∈A 𝑁𝑡(𝑎). Moreover,
the expected total regret E(𝑅𝑡) can be decomposed over actions:
E(𝑅𝑡) =
𝑡
∑︁
𝑖=1
Δ𝑡(𝑎𝑖) =
∑︁
𝑎∈A
𝑁𝑡(𝑎)
∑︁
𝑗=1
Δ𝑡(𝑎)
=
∑︁
𝑎∈A
2
√︁
(2 log𝑇)/𝑁𝑡(𝑎)𝑁𝑡(𝑎)
= 2
√︁
(2 log𝑇)
∑︁
𝑎∈A
√︁
𝑁𝑡(𝑎).
Now, notice that √· is a concave function. By Jensen’s inequality, we can then bound the
average of √𝑁𝑡by (recall that |A| = 𝐾)
1
𝐾
∑︁
𝑎∈A
√︁
𝑁𝑡(𝑎) ≤
√︄
1
𝐾
∑︁
𝑎∈A
𝑁𝑡(𝑎) =
√︂
𝑡
𝐾.
This implies that P
𝑎∈A
√︁
𝑁𝑡(𝑎) ≤𝐾
√︁
𝑡/𝐾=
√
𝐾𝑡
Therefore, we can bound E(𝑅𝑡) by
E(𝑅𝑡) ≤2
√
2
√︁
log𝑇
√
𝐾𝑡= O
√︁
𝐾𝑡log𝑇

.
Taking 𝑡= 𝑇, we clearly see that E(𝑅𝑇) is sublinear. Thus, the UCB algorithm has no regret.
12
3 Frequentist Bandits
The last thing we need to show is the probability that the results above hold. I.e., we want to
show that 𝐸holds with high probability. By Hoeffding’s inequality and subsituting in 𝜀𝑡(𝑎), we
obtain P(| ˆ𝜇𝑡(𝑎) −𝜇(𝑎)| ≥𝜀𝑡(𝑎)) ≤2/𝑇4. Then, by the union bound over 𝑎and 𝑡, we obtain
P(𝐸𝑐) ≤(2𝐾𝑇)/𝑇4. Therefore, P(𝐸) ≥1 −2𝐾/𝑇3. That is, our analysis below will hold with
high probability.
□
13
Chapter 4

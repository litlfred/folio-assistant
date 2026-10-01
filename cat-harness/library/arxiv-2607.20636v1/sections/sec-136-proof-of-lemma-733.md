---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-136-proof-of-lemma-733
section_title: "Proof of Lemma 7.3.3"
section_number: null
pages: 181-182
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. For a strategy, let {ti}n
i=0 be the set of times at which the agent switches from one
arm to the other with t0 = 0. Then, [ti, ti+1] for even i are the intervals played on the stable
arm, and the remaining intervals are played on the striving arm. We argue that we can
convert any strategy that is not-minimally accumulating into a minimally-accumulating
strategy that accrues at least as much reward as the original non-minimally-accumulating
strategy.
Suppose the total amount of time spent on the stable arm f1 is T1 := P
i even(ti+1−ti) .
and the total time spent on striving arm f2 is T2 := P
i odd(ti+1−ti) , such that T1+T2 = T .
Recall θ , the threshold until which one must play f2 before it pays off. If T2 < θ , then
redefining the intervals such that the strategy becomes minimally-accumulating does not
change the total accumulated reward, since the reward accrued from an arm is only a
function of the time on that particular arm. Thus, the total reward is T1 regardless of the
order in which it is accrued.
Let us now consider the second case, T2 > θ . Now, let us break up the time spent
on arm f1 into the 1+γ
1−γ θ time that must happen prior to playing the striving arm for
166
θ time and the remaining T1 −1+γ
1−γ θ time.
(Due to the comfort restriction, we know
T1 −1+γ
1−γ θ ≥0 .) As argued previously, we can rearrange interval endpoints for the first
1+γ
1−γ θ time spent on f1 and θ time spent on f2 with no changes in overall reward. In
particular, we can rearrange it to be minimally accumulating. Now, for the remaining
T1 −1+γ
1−γ θ time, if we play it on the stable arm (at any time), we accrue R = T1 −1+γ
1−γ θ
reward. However, having satisfied the comfort requirements, if we instead use it at the end
of the game and on arm f2 , we instead gain reward (T2 −θ −R/2)R . If R/2 +T2 −θ > 1 ,
then this is strictly better. If not, we can still play this time on the stable arm. Thus, we
have constructed a minimally-accumulating strategy that accrues at least as much reward
as the original strategy.
D.3.3

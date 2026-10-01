---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-021-removing-dependence-on-having-to-know-t
section_title: "Removing Dependence on Having To Know T"
section_number: null
pages: 40-41
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Finally, we describe how to use a standard doubling trick to remove dependence on knowing
T, the time horizon, a priori. At a high level, we start with a guess, T ′ = T0 = 4k , pretend
that is all the time we have, and run the combined exploration-exploitation algorithm with
it. Then, if it turns out we have not run out of time, we set T ′ ←2 · T ′ and repeat the
same process. At a high level, our argument will show that if we have a “good” T ′ , i.e.,
one that is within a constant factor of the true T , then the reward received when running
T ′/2 steps of Algorithm 2 followed by T ′/2 steps of Algorithm 1 will be within a constant
factor of the reward received if we were to play until time T . Overall, in the exploration
phase, we use the algorithm given in Algorithm 2, but a key change is that in line 5, we
instead set U = 4 maxi ˆm(i)
U . We present the algorithm and result here and defer the proof
to Appendix A.1.
Algorithm 3 Unknown Time Wrapper
R ←0
Guess T ′ ←T0
while True do
Try:
Tpred = T ′/2 −k
ˆm ←modified Algorithm 2 for T ′/2 steps with Tpred as above
// in line 5 of Algorithm 2, U = 4 · maxi ˆm(i)
U
R ←R + reward from Algorithm 1 for T ′/2 −k steps
Except:
return R
T ′ ←2 · T ′
end while
Lemma 3.4.4. Suppose we run the procedure described in Algorithm 3. If T > 4k , then
the reward achieved is at least
OPTT
8192
√
k log(128k).
25
3.5

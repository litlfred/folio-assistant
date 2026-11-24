---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-100-doubling-trick-for-unknown-t
section_title: "Doubling Trick for Unknown T"
section_number: null
pages: 139-140
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We remove the need to know T by using the doubling schedule and exploration procedure
of [BR25]. At a high level, we start with a guess T0 = 4k, pretend this is the horizon, and
spend T ′/2 steps using the same adaptation of Algorithm 2 of [BR25] that they use to
estimate bm, the reward of the best arm, for the relevant time scale. After this, we spend
T ′/2 steps exploiting (running PTRRα) with τ ′ := T ′
2 −k and m =
bm
2·16α (we shrink ˆm to
ensure we don’t discard the best arm). If time remains after T ′ steps, we double T ′ and
repeat. This yields the below result:
Theorem B.2.15 (Unknown-T guarantee). Assume βI ∈(0, 1) and fix α ∈(βI, 1), γ =
α/(α + 1). If T > 4k, then the doubling trick above achieves
E[ALGT ] ≥
1
2048 · 16α(α + 1) log(128k) · OPTT
(k + 1)γ .
Proof. Consider i such that T ′ = 2i T0 is the last iteration for which an explore / exploit
cycle was completed. Define T ′′ := Pi
j=0 2jT0 = (2i+1 −1)T0. Then T ′′ < T ≤2T ′′ . We
will argue two things: first, we will show that spending T ′/2 time on the procedure for
estimating m provides a sufficiently good estimate for m for our purposes; second, we will
124
quantify the gap between spending T ′/2 collecting reward from the instance based on our
estimated m and T time spent on the optimal arm.
Let τ := T ′/2 −k. Let ˆm denote the estimated maximum value at horizon τ + k from
running the estimation procedure for time T ′/2 (from time T ′′ −T ′ to T ′′ −T ′/2). From
the analysis in [BR25], we know that 1
2 bm ≤f⋆(τ) ≤2 bm with probability at least
1
log(128k),
and that
T
τ =
T
T ′
2 −k ≤T
T ′
4
= 4 T
T ′′
T ′′
T ′ ≤4 · 2 · 2 = 16 .
Let m :=
ˆm
2·16α , and run PTRRα with m, τ for T ′
2 steps.
Since τ/T ≥1/16 and bm ≤2f⋆(τ) ≤2f⋆(T), we know that
m ≤2f⋆(T)
2 · 16α ≤f⋆(T)
 τ
T
α
,
and therefore that
m
 t
τ
α
≤f⋆(T)
 t
T
α
≤f⋆(T)
 t
T
βI
≤f⋆(t)
for all t ≤T. It follows that PTRRα again does not switch away from the best arm f∗.
Now, we proceed to the second part of our argument. Applying Lemma B.2.6 with
(τ ′, k′) = (τ, k) gives
E[exploit] ≥
mτ
2(α + 1)(k + 1)γ ,
γ =
α
α + 1.
Since m = bm/(2 · 16α) and τ/T ≥1/16, it follows that
E[exploit] ≥
bmτ
4(α + 1)16α(k + 1)γ ≥
bmT
64(α + 1)16α(k + 1)γ .
Since f⋆(T) ≤16f⋆(τ) ≤32 bm, it further follows that OPTT ≤f⋆(T)T ≤32 bmT, and
therefore that
E[exploit]
OPTT
≥
1
2048(α + 1)16α ·
1
(k + 1)γ .
Multiplying by the 1/ log(128k) selection probability gives
E[ALGT ] ≥
1
2048(α + 1)16α log(128k) · OPTT
(k + 1)γ .
B.3

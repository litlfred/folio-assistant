---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-113-proofs-for-results-in-section-442
section_title: "Proofs for results in Section 4.4.2"
section_number: null
pages: 157-158
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We prove the lemma used in Section 4.4.2 to justify the quantities Li, Ui used in Algo-
rithm 5.
Lemma B.5.3. For every arm i and every t ≤T, we have Li(t) ≤fi(T) ≤Ui(t).
Proof. By concavity, we know that γi(s) is non-increasing, and therefore that for any
x ≥t, we have
fi(x) −fi(t) =
x−1
X
s=t
(fi(s + 1) −fi(s)) ≤
x−1
X
s=t
γi(t) = (x −t)γi(t).
Setting x = T gives fi(T) ≤fi(t) + (T −t)γi(t) = Ui(t). By monotonicity, we likewise
know that Li(t) = fi(t) ≤Fi(T).
We include below a complete proof for Theorem 4.4.1.
Proof (of Theorem 4.4.1.)
Proof of 1. (certificate correctness). Suppose an instance I satisfies GCC(θ). Since △i(t)
is non-increasing for all i and Pk
i=1 hi(∆I/3) ≤θ, we know that there are at most θ
total pulls (across arms) such that △i(ti) > ∆I/3. Note that we can never have Li(ti) >
maxj̸=i Uj(tj) for some i̸ = i∗, as we know by concavity and monotonicity that Li(t) ≤
fi(T) ≤Ui(t), so this would imply fi∗(T) ≤Ui∗(ti∗) < Li(ti) ≤fi(T) (a contradiction).
Since B > θ and Stage 1 always pulls the arm i that maximizes (Ui −Li), it follows that
the algorithm will reach some point (namely t = θ) where △i(ti) ≤∆I/3 for all i. At this
point, for each j̸ = i⋆, we have
Uj(tj) ≤fj(T) + ∆I
3 ≤f∗(T) −∆I + ∆I
3 = f∗(T) −2∆I
3 .
Moreover, i∗satisfies
Li⋆(ti∗) ≥f∗(T) −∆I
3 .
It follows that Li⋆(ti∗) > maxj̸=i⋆Uj(tj), and therefore that the algorithm returns i∗in
Stage 1.
Proof of 2. (approximation fallback). Write g⋆(h) := maxi gi(h) = maxi fi(ti + h). Let
Trem := T −B, and let τ ′ = Trem −k.
Suppose m′ := (τ ′/T)f⋆(T).
Since g⋆(T) =
maxi fi(T) ≥f⋆(T), we know that
m′ = τ ′
T f⋆(T) ≤f⋆(T)
τ ′
T
α
≤g⋆(T)
τ ′
T
α
.
Using monotonicity and the fact that g⋆(T) ≤2f⋆(T), we also know that g⋆(τ ′) ≤
2f⋆(T) = 2(T/τ ′)m′, and therefore that
m′ ≥(τ ′/(2T))g⋆(τ ′).
Since B ≤T/2 and
T ≥4k, it follows that
1
8g⋆(τ ′) ≤m′ ≤g⋆(T)
τ ′
T
α
.
142
Run PTRRα for Trem steps with parameters m′ and τ ′. By Theorem 4.3.1, we know that
E

ALGTrem

≥
OPTres
Trem
Cαc2(k + 1)α/(1+α) ,
where OPTres
Trem denotes the optimal cumulative reward for {gi} over Trem rounds and
Cα = 2α+2(α + 1).
Now note that OPTres
Trem ≥1
2g⋆(Trem)Trem, and that the algorithm’s maximum single-pull
reward dominates its average reward (Facts B.1 and B.3 in the appendix of [BR25]). Let
ˆi denote the arm that achieves this maximum single-pull reward, and note that
E
h
max
t≤Trem rewardt
i
≥
1
Trem
E

ALGTrem

≥
g⋆(Trem)
2Cαc2(k + 1)α/(1+α) .
Since fˆi(T) ≥maxt≤Trem rewardt by monotonicity, we know that taking expectations
gives
E

fˆi(T)

≥
g⋆(Trem)
2Cαc2(k + 1)α/(1+α) .
Monotonicity and concavity give g⋆(Trem) ≥(Trem/T)f⋆(T) ≥1
2f⋆(T), as Trem ≥T/2.
Combining with c2 ≤8 from Step 1, it follows that
E

fˆi(T)

≥
1
2Cαc2(k + 1)α/(1+α) · 1
2f⋆(T) ≥
1
2α+7(α + 1)(k + 1)−α/(1+α)f⋆(T),
as desired.
B.5.4

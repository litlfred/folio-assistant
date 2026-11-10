---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-089-proof-of-lemma-344
section_title: "Proof of Lemma 3.4.4"
section_number: null
pages: 125-126
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. Let T ′′ = (2i−1)T0 be such that T ′′ ≤T ≤2T ′′ , which implies that the last T ′ with
which we we run Algorithms 2 and 1 is 2i−1T0. Note that T ′ ≤T ′′ ≤T ≤2T ′′ ≤4T ′ Then,
we consider what we gain when we spend T ′/2 exploring and T ′/2 exploiting. Our analysis
of the reward from Algorithm 1 will assume we start from 0 pulls in the exploitation phase,
but in practice we are already higher than that.
We show that the reward achieved running Algorithm 1 for T ′/2 steps is a constant
fraction of OPTT .
Each arm has been pulled T ′/(2k) times in the exploration phase.
We know that
f⋆(T ′) ∈[1
2 maxi ˆm(i)
L , maxi ˆm(i)
U ]. As before, we actually run Algorithm 1 with its parame-
ter set to T ′/2−k . Due to the diminishing returns property, we have that
f⋆(T ′)
f⋆(T ′/2−k)
f(T ′′)
f(T ′)
f⋆(T)
f⋆(T ′′) ≤
T ′
T ′/2−k
T ′′
T ′
T
T ′′ ≤4·2·2 = 16 . Thus, f⋆(T) ≤2f⋆(T ′′) ≤4f⋆(T ′) ≤4 maxi ˆm(i)
U , and c2 = 16.
Now, the extent of the interval is 128k , so the probability of choosing ˆm that is within a
constant factor of f⋆(T ′/2 −k) is
1
log 128k . Now, we simply compute the reward achieved
by the algorithm by applying Lemma 3.3.3. The algorithm plays for T ′/2 −k steps, while
OPT plays for T steps. In particular:
ALGT ′/2 = V
T ′
2 −k, k

≥OPTT ′/2−k
2c2
1
√
k
≥
 T ′
2 −k
T ′
!2 OPTT ′
2c2
1
√
k
≥
1
2 −1
4
2 OPTT ′
2c2
1
√
k
≥1
16
T ′2
T 2
OPTT
2c2
1
√
k
≥
1
16 · 16
OPTT
2c2
1
√
k
.
Plugging in the computed value for c2 and considering the probability of choosing the
correct ˆm , we get ALGT ′/2 ≥OPT/(8192 ·
√
k log(128 k)) .
110
A.2

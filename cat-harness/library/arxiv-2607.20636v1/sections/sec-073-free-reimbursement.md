---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-073-free-reimbursement
section_title: "Free Reimbursement"
section_number: null
pages: 103-104
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this model, an agent with a support network gets reimbursed for free each time they
taking a striving step. This is analogous to having a benefactor who financially supports
the agent as much as needed to prevent their net reward from being negative. In this case,
the effective arms for an agent with such unconditional support are now:
ˆf1(t) = 1 ∀t
ˆf2(t) =
(
0
t < θ
t −θ
t ≥θ .
88
Thus, the analysis is as before (Lemma 7.3.2 with α, ˜α = 1), and the agent will spend
T −
√
2T time on the striving arm before switching to the stable arm. Remarkably, the
duration of time after which the agent without a safety net and the agent with uncondi-
tional support “give up” is the same! However, due to the safety net, the agent with it
can explore the striving arm for twice as long. In particular, if θ ∈[T−
√
2T
2
, T −
√
2T] ,
then the latter agent gets 1
2(T −θ)2 ≥1
2 · 2T = T reward, while one without the safety
net only gets
√
2T.
In the Appendix, we extend this to a model where the benefactor only promises support
for a fixed amount of time. In that case also, a similar qualitative result holds – agents
with and without support “give up” on striving at the same absolute time but the agent
with the financial support gets to explore for a multiplicative factor longer. Note also
that by mapping this onto the discomfort tolerance perspective, we can see that in a
world where the agent must maintain a positive discomfort tolerance but the agent lacks
financial support, they must spend less time exploring, whereas if they have financial
support, they can explore longer.
7.4.3

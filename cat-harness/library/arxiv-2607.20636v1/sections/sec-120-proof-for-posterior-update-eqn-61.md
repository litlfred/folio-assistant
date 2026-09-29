---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-120-proof-for-posterior-update-eqn-61
section_title: "Proof for Posterior Update (Eqn. 6.1)"
section_number: null
pages: 165-165
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. First, applying Bayes’ theorem and given the conditional independence of st and
¯Ht−1 when conditioned on the best action, we have:
P

EA|st, ¯Ht−1

= P [st|EA] P
 ¯Ht−1|EA

P [EA]
P

st, ¯Ht−1

Expanding the denominator using the law of total probability:
P

st, ¯Ht−1

= P [EA] P

st, ¯Ht−1|EA

+ P [EB] P

st, ¯Ht−1|EB

cond. indep. ⇒
= P [EA] P [st|EA] P
 ¯Ht−1|EA

+ P [EB] P [st|EB] P
 ¯Ht−1|EB

Finally, because we assume a uniform prior over which action is correct, we have
P [EA] = P [EB] and can thus cancel out all of those terms.
C.4

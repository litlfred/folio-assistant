---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-072-no-safety-net
section_title: "No Safety Net"
section_number: null
pages: 103-103
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Now, since an agent without a safety net must alternate between f1 and f2 , the competitive
ratio maximizing strategy is computed as follows: first, if f2 never increases, the agent
incurs the competitive ratio on the left below, and if f2 increases right after the agent
switches, they receive the competitive ratio on the right.
(1 −1) · s
2 + T −s
T
=
(1 −1) · s
2 + T −s
(1 −1) · s
2 + 1
2(T −s)2 .
(7.2)
⇒s = T −
√
2T .
(7.3)
The duration of time after which the switch happens is T −
√
2T , but the proportion
of that time actually spend exploring the striving arm is half that, namely T−
√
2T
2
. Thus,
if θ > T−
√
2T
2
, this agent will not be able to reap the benefits of striving.
7.4.2

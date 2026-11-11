---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-135-proof-of-lemma-732
section_title: "Proof of Lemma 7.3.2"
section_number: null
pages: 181-181
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. Recall our previous argument that all deterministic strategies boil down to playing
f2 for s steps and then switching to f1. With that in mind, there are two extremes of
what could happen to the competitive ratio, one of which decreases with the longer spent
on f2, and the other of which increases with time spent on f2 . Thus, we compute them
and equalize:
competitive ratio if never increase = T −s
T
(D.1)
compeititve ratio if increase right after switch =
T −s
˜α
2 (T −s)2 .
(D.2)
equalizing, T −s
T
=
T −s
˜α
2 (T −s)2
(D.3)
s = T −
r
2T
˜α .
(D.4)
D.3.2

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-009-formal-preliminaries
section_title: "Formal Preliminaries"
section_number: null
pages: 25-25
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We follow the problem specification in [PNGK23]. In particular, each instance consists of
k arms, where each arm i has an associated monotone increasing reward function fi . The
reward from pulling arm i for the tth time is fi(t) . These functions are not known to the
algorithm in advance; the algorithm only gets to know the current reward by interacting
with the arm. Further, the argument t of the function is not the time at which the arm is
picked, but rather the number of times the arm has been played. Formally:
Definition 2.2.1. An instance I ∈I of the improving multi-armed bandits problem con-
sists of k arms, each of which has associated with it a reward function fi that is nonde-
creasing as a function of ti , which is the number of times that arm has been pulled so
far.
2.2.1

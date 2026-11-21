---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-006-33-methodology
section_title: "Methodology"
section_number: 3.3
pages: 3-4
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
Without changing the model parameters, the provider optimizes
a defensive training loss on the embeddings of newly added De-
fensiveTokens. Our defense first creates 𝑛(5 is recommended as
studied later) randomly-initialized embeddings 𝑡= (𝑡1,𝑡2, ...,𝑡𝑛) ∈
𝑡∈R𝑛×𝑒, each 𝑡𝑖with the same dimension 𝑒as tokens in the model
vocabulary. When security is needed, a system developer prepends
DefensiveTokens before the original LLM input 𝑥∈R𝑘×𝑒(𝑘is the
input text token length), i.e., [𝑡;𝑥], for the LLM to do inference. We
apply gradient descent updates to 𝑡using the StruQ [3] loss, i.e.,
LDefensiveToken
𝑡
(𝑥,𝑦) = −log 𝑝𝜃,𝑡(𝑦| [𝑡;𝑥]).
(1)
We optimize Eq. (1) using the defensive instruction tuning dataset
suggested in StruQ, that is, we keep half of the samples unchanged,
and attack the remaining samples with two prompt injection vari-
ants in equal probabilities. This constructed dataset is shown to be
effective in maintaining utility while teaching the LLM to ignore
injections when there is one. Algorithm 1 summarizes our scheme.
Built from Chen et al. [3], we adopt one more trick in [5] to use the
undefended LLM to generate responses as training labels. As in Line
1 of Algorithm 1, we use (𝑥, 𝑓𝜃(𝑥)), instead of (𝑥,𝑦), to generate
the defensive training set. This trick has been shown crucial to
maintain utility by preserving the model’s output style, and we also
apply it to all training-time defense baselines for a fair comparison.
AISec ’25, October 13–17, 2025, Taipei, Taiwan
Sizhe Chen et al.
Algorithm 1 DefensiveToken Optimization
Input: A performant LLM parameterized by 𝜃, the number of de-
fensive tokens𝑛, an instruction tuning dataset 𝐷= [(𝑥1,𝑦1), ...]
Output: Defensive token embeddings 𝑡
1: Following [3], build a defensive instruction tuning dataset 𝐷′
from the self-labeled dataset (𝑥, 𝑓𝜃(𝑥)), where 𝑥∈𝐷
2: 𝑡←N (0, 𝐼𝑛×𝑒)
3: for batch (𝑥,𝑦) ∈𝐷′ do
4:
Update 𝑡with gradients from the loss Eq. (1)
5: end for
6: return 𝑡
3.4

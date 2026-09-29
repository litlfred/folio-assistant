---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-064-our-contributions
section_title: "Our Contributions"
section_number: null
pages: 95-95
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this work, we propose studying grit in the improving multi-armed bandits framework.
We develop an instance that allows us to satisfactorily investigate the impact of grit as
a characteristic the agent has, and we show that the instance we propose is the simplest
instance in which the strategy is non-trivial. In order to understand strategies resulting
from grit, which as discussed above is rational, in this model, we must formalize what we
mean by “rational,” and we do so by appealing to two notions of rationality well-studied
in computer science. In particular, we first consider the competitive ratio, a standard
notion in the analysis of online algorithms, which is optimized when a strategy minimizes
multiplicative regret in hindsight; we also study a Bayesian notion of rationality in which
an agent has a prior that helps quantify their uncertainty about the future, which they
update to a posterior based on evidence from their environment.
Between these two
notions, we study how gritty behavior is reflected in both forward- and backward- looking
formalizations of rationality.
With the model and notions of rationality in hand, we study how grit affects an
agent’s strategy and how that in turn affects their outcomes. When grit is related to the
optimistic outlook of an agent, we can quantitatively derive cases in which grit helps and
hurts the agent, showing that an excess of grit harms the agent by causing them to net
less reward than their less-gritty counterparts. When grit is reflected in how willing an
agent is to tolerate discomfort, we conclude that though agents who require comfort can
minimize their multiplicative regret in hindsight pretty easily, agents who can tolerate more
discomfort can explore for longer. This section culminates with studying how financial
support changes agents’ behavior, essentially showing that financial support allows agents
to expand their exploration horizon while allowing them to still receive comparable reward
to their less gritty counterparts. Finally, we investigate similar questions in the Bayesian
setting, and we find that grit when framed as uncertainty tolerance has a similar effect on
an agent’s policy, namely that more grit causes an agent to strive for longer.

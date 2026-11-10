---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Large language models (LLMs) embedded in
multi-turn agentic harnesses are reshaping soft-
ware engineering (SWE), but routing every task
to a frontier model is wasteful when many issues
admit cheap fixes. Existing LLM routers operate
on the task description alone, which inherits an
information-theoretic Bayes-error floor in agentic
settings: a similar issue can hide either a localized
typo or a multi-module refactor, and the prompt
does not separate the two. We introduce SWE-
Router, a value-based temporal approach that
lets a cheap model run for a few exploratory turns
and reads the resulting partial trajectory before de-
ciding whether to continue cheaply or to escalate
to an expensive model.
We provide a Bayes-
optimality theorem showing that conditioning on
the partial trajectory never harms routing and is
strictly better whenever exploration is informative.
Across the LLM pairs of weak and strong models
spanning
the
contemporary
cost–capability
frontier, we show that SWE-Router greatly
improves the cost efficiency of SWE tasks, while
maintaining the majority of the performances
of the stronger model. We additionally release
a multi-LLM trajectory dataset which allows
reproduction of our trajectory-level routing.

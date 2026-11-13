---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-084-general-vs-specific
section_title: "General vs Specific"
section_number: null
pages: 112-113
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Next, let us consider how the thesis addressed the emergent theme of what we gain and
what we lose by studying problems abstractly. The work presented in Chapter 3 is the
most abstract in the thesis. Chapter 4 shows how to make it more practical by adapting to
structure, but overall the framework remains quite abstract. Then, the social epistemol-
ogy chapters (Chapters 6 and 7) study concrete problems and therefore look at relatively
narrow settings. The methods of this thesis remain in the theoretical realm (with occa-
sional experiments on stylized or offline real-world data), and so the thesis does not explore
problems that are increasingly practical and nuanced, and it does not get to the full ex-
tent of real-world complexity. However, even at these three points along the continuum of
abstract to real-world, we can learn several useful lessons.
First, the obvious point: nothing comes for free. As we get more concrete, we nec-
essarily lose generality. As we get more abstract, we necessarily lose specificity. In the
most general case, we could handle a rather strong adversary. Going from worst-case to
beyond worst-case guarantees for IMAB, we were able to adapt to structure available in
the setting, but we had to witness that structure, either via access to offline samples or
through stronger assumptions. In going from these works to the work on grit, we could
suddenly do much better than depending on the general algorithms. Further, that instan-
tiation of the IMAB problem allowed us to evince the interplay between a very particular
structure of the instance and very particular behaviors of agents. Thus, hearkening back
to our argument in Chapter 5, it is crucial that we formalize our theoretical problems at
the level of specificity at which we wish to solve them. It is often of theoretical interest to
characterize as general a version of the problem as possible. It is often practically most
useful to solve rather particular settings.
Related to that, this thesis also shows that fixing complexity in certain aspects of a
problem can allow for exploring complexity in other aspects. In the first half of the thesis,
we assume an agent that has the singular goal of optimizing their competitive ratio. Then,
we are able to allow for rich complexity in the kinds of instances they might see, and we
show how even if instances are chosen adversarially, the agent can succeed to a reasonable
degree. On the other hand, in the second half, we assume that the agents have a relatively
well-specified decision problem in front of them. In both cases, there are only two options
they must decide between, and there is some uncertainty inherent to these options. Now,
we are able to explore how complexity in social networks or in behavioral traits affect the
decision between these two options. It would have been a lot more challenging to explore
all these sources of complexity at once. While there is value to studying how sources of
complexity interact, and there are certainly cases where compounding complexity behaves
quite differently to the sum of their parts, there is significant epistemic value to deriving
insight from simple, isolated models. We also argue this in Chapter 5.
97
8.3

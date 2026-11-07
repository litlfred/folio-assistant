---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-043-what-models-can-and-cannot-do
section_title: "What Models Can and Cannot Do"
section_number: null
pages: 73-75
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
“Science is a human tool. It is a remarkably powerful tool, and it is surely
our most important epistemic tool. Once we properly appreciate the aims of
science and the contexts in which those aims are pursued, features of science
that appear to be shortcomings are instead revealed to be strengths. ” [Pot17,
pg. 22]
Now we turn our attention to an equally important question: what can models not do?
It is important to explore the limitations of theoretical models to temper our optimism
9If we can pose explanation as intervention (i.e., devise an experiment to intervene on the explanatory
mechanism), then explanation also allows for this criterion.
58
about what models can do. That way, we can use them toward their intended purposes,
not for more or for less.
The first caveat to our optimism has been stated already: models can only really be
evaluated with respect to a particular epistemic purpose. When developing a model, it is
important to be clear about what we want it to be able to do, both at the level of the
overall goal and in terms of the specific real-world phenomenon we aim to study. On the
one hand, this is disappointing because we would like to have a grand unified theory of
everything we touch. On the other hand, it is freeing, because by accepting the limitations
of the model, we can use it to its fullest in its legitimate setting.
In our development, we have focused on realistic models, or models that reflect the
real world. There are situations in which we develop what seem like completely unrealistic
models, making seemingly absurd assumptions. However, those assumptions can evince
structure in a problem that gets to the heart of what is difficult about a situation. This is
a specialty of theoretical computer science; a familiar example is assuming the availability
of oracles. An oracle is an object that is able to receive queries of a certain type and return
the perfect answer to the query for free in terms of computational cost. For instance, in
machine learning theory, often works assume access to empirical risk minimization (ERM)
oracles. We know that in many cases, solving the ERM problem is computationally hard.
Yet, it is often valuable to assume access to an ERM oracle. If an otherwise-intractable
problem is computationally feasible given access to an ERM oracle, we know that the
difficulty must lie in ERM.
More generally, identifying the right “oracles” for a problem can help us isolate where
the difficulty lies. Returning to our discussion of representation, an interesting and pow-
erful aspect of the theoretical computer science approach is that we study encapsulation
itself. We spend significant time constructing various oracles and understanding complexi-
ties of problems under these oracles. Once we have found oracles under which the problem
is (usually polynomially) tractable, we have identified the source of difficulty. The process
allows us to make wildly unrealistic assumptions via encapsulation while still resulting in
very useful models. On a more abstract level, TCS’s focus on studying encapsulation itself
is a novel modeling perspective not covered by standard frameworks thus far.
Could we hope for powerful theoretical models that solve many epistemic purposes in
parallel? Possibly, though I am neither optimistic about finding such models nor convinced
they are necessary. Several years ago, I worked on deep learning theory. My dream was
that when I was sixty and had grey hair, I would prove the grand theorem that tells us
why neural networks generalize. Now, at my current age and with more grey hair than I
expected to have at this point, I no longer dream of this. The cynical reader might ask
if I have given up on theory ever catching up to practice. No, not at all. I have simply
broadened my view of what it means to model complex real-world phenomena. For most
problems in the world for which theoretical models have provided insight, they are far
from the only tools used to study the problem. I now firmly believe that “understanding”
is a much messier prospect than what stylized and rigorous models can hope to provide.
At best, our theoretical models will work in conjunction with experimental, statistical,
and qualitative analysis. Paraphrasing something I heard once at a discussion regarding
the directions in which to steer deep learning theory, “no one talks of a unified theory
of a dishwasher. Why should we expect there to be one for deep learning?” Particularly
when models are deployed in social settings, with the intent of informing decisions that
59
have massive impacts on individuals, we must have an abundance of evidence in favor
of our intended actions from a vast range of epistemic tools. This perspective is quite
related to the one taken by proponents of the multiple-models idealization framework
[EGW14]. Especially when it comes to selecting potential interventions, it could be wise
to develop a collection of models, each isolating particular aspects of the target. Then,
we can develop interventions and select those which are successful in multiple of these
models.
One limitation of this approach is that it might not allow for studying how
different aspects of the system interact with one another. However, it would still help us
understand the interactions between the intervention and various aspects of the target10.
Potochnik addresses something related to this tension, writing “rampant and unchecked
idealization does not mean unprincipled idealization.
Idealizations reflect researchers’
interests, and they serve those interests in the face of specifiable cognitive, computational,
and other limitations” [Pot17, pg. 59].
At worst, theoretical models are cute exercises for our own self-satisfaction. This is
roughly the position taken by Ariel Rubinstein in his book, Economic Fables [Rub12]. He
writes:
If the models we develop in yellow notepads or on blackboards constitute a
basis for predicting human behavior, it would be miraculous in my eyes. There
are no miracles in economics, but there are wonders. In my studies in the
Department of Mathematics in Jerusalem, I learned to see wonders in the
world of formalities. I sometimes also see them in economic theory. I approach
economics as someone with a sense of curiosity who is trying to understand the
logic of human interaction a bit better. This may not be much, but perhaps
it is not so little either.
Indeed, we do not need our models to predict the grandest of human, social, or natural
outcomes. I will be satisfied if we can provide slightly more conceptual clarity and inject
slightly more human ingenuity into our pursuit of truth.
5.1.7

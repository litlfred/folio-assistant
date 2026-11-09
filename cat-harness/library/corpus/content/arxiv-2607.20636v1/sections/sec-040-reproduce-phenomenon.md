---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-040-reproduce-phenomenon
section_title: "Reproduce Phenomenon"
section_number: null
pages: 65-67
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The most basic purpose of a model is to reproduce a phenomenon observed in the world. In
the natural sciences, this observation would arise in the natural world. However, in general
such an observation could exist at any level of abstraction, including in constructed objects.
The model is consistent with observations as long as there are some initial conditions for
which the real world outcome and the model outcome match.
Models that achieve this goal allow us to hold a phenomenon in our head, or at least in
a compact way with a small number of formal definitions and specified equations. We then
can strip away all the complexity and nuance of the real world to tell a simple but self-
contained story about what is happening. Such a mathematical characterization induces
a short description that suffices for isolating exactly what it is we wish to study. This
is useful in its own right, even if subsequent goals (explanation and intervention) are not
satisfied; such a model proposes a sufficient set of conditions under which the phenomenon
of interest occurs, which is valuable even without establishing necessity of these conditions.
Models that are capable of predicting behavior are related; reproduction is “prediction” of
a known circumstance, while prediction is more generally associated with new but related
circumstances.
Catherine Elgin, in [Elg17] (as quoted in [FH25]), writes that understanding a setting
means to have:
an epistemic commitment to a comprehensive, systematically linked body of
information that is grounded in fact, is duly responsive to reasons or evidence,
and enables nontrivial inference, argument, and perhaps action regarding the
topic the information pertains to.
Our description of a model that reproduces a phenomenon maps well onto Elgin’s
framework. In particular, our model is grounded in fact as it is able to reproduce observa-
tions. It is “responsive to reasons or evidence” as its details can be adapted to better fit
new evidence. Finally, “enabl[ing] nontrivial inference” corresponds to prediction, which
is, as discussed previously, an extension of the reproduction goal. The intents of “argu-
ment” and “action” are higher-order epistemic purposes that we discuss in the rest of our
argument in Sections 5.1.4 and 5.1.5.
A few years ago, for a number of different reasons2, I decided to take a graduate statistical
mechanics class. I frequently found myself puzzled by approximations that came as second
nature to the physicists (i.e., everyone else) in the classroom. The math that we did in the
1It is important to already note the following. The model set out to explore whether segregation could
result from pure preferences and confirmed that it was possible.
This ought not to be interpreted as
“segregation in real cities does result purely from preferences.” The purpose of this model was to explore
whether such a phenomenon could exist, and the model only shows that it could exist.
2the primary practical reason was that I was to attend a summer school on applying statistical mechanics
techniques to analyzing deep learning phenomena, but I also felt that I finally had the mathematical
maturity to attempt another physics class after a failed attempt to double major in physics during my
undergraduate studies.
50
course often felt, to me, pretty far from math and pretty close to magic. As I bristled up
against the epistemology of this field that had previously eluded me, but which I was now
committed to develop a stronger understanding of, I spent significant time asking basic
questions to the professor. At that point in my career, I had finally developed a reasonable
understanding for how theoretical computer science framed and solved problems. In an
attempt to build up a parallel, albeit significantly less deep, understanding of other such
fields, I asked the professor one day, “what do you think is the point of theory in your
field?” “Theory is what makes physics human,” they replied. I argue that the same can be
said here for theoretical models. A good theoretical model should highlight the key aspects
of a setting and a phenomenon and marry them in such a way that humans can interpret
and analyze them easily. Paring down the complexity of the real world and focusing on
specific concepts of interest allows us to deepen our engagement with and understanding
of what we aim to study. It bears noting here that “making human” necessitates the
specification of a user (referring back to Parker’s adequacy framework [Par20]), since
what is interpretable by people with differing backgrounds can differ greatly.
What This Implies for Evaluation of Model
Let us briefly reflect on what this framing implies for evaluating models. At the most basic
level, if a model does not align with observations from which it is developed, then it is not
a good model. Of course, “aligning with observations” is itself somewhat subtle, as there
may be issues such as noise or measurement error. Thus, perhaps a better way to phrase
this criteria is to say that we require our models to align closely with observations and in
cases where they do not, offer explanations for why not. In Weisberg’s terms[Wei07], these
are our dynamic fidelity criteria. Angela Potochnik formulates a closely related criterion
at the level of individual posits within a model: “A posit is epistemically acceptable when
its divergence from truth is insignificant, taking into account (a) the posit’s role in the
representation and (b) the epistemic purpose to which that representation is put” [Pot17,
pg. 100]. Overall, it is necessary for a good model to satisfy this question but this claim
does not identify conditions that are sufficient to meet to be deemed a good model.
Further, per Parker’s development [Par20], we must also ensure that the model must
be appropriate for not only reproduction of the phenomenon but also for the user, method-
ology, and background circumstances. In our development, the models we devise are most
likely to be accessible to fellow theoretical computer scientists, and if we wish them to be
useful to other users, we must devise them accordingly. Models meant to reproduce phe-
nomena but not intended for deployment in action-oriented pipelines are more safe from
methodology and background circumstance considerations. These points become more
stark in Section 5.1.5, where we discuss models that propose interventions.
This goal is the weakest of the three we discuss, since we could, in theory, build a
model to reflect nearly any kind of behavior.
However, constraining our model to be
mathematically-sound and simple protects against “overfitting” the real world. So far,
the discussed evaluation conditions leave open a critical question about prediction or
generalization. Namely, what does the model say about situations that weren’t “baked”
into it? If the model happens to capture other phenomena that occur in the setting, and
not just the phenomenon it was designed for, then the model is more robust3.
3We use the term “robust” informally, but an interested reader may refer to [Wei18] for a discussion of
51
5.1.4

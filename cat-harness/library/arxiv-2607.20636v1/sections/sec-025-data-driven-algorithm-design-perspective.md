---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-025-data-driven-algorithm-design-perspective
section_title: "Data-Driven Algorithm Design Perspective"
section_number: null
pages: 45-46
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In Sections 4.3.3 and 4.4.3, we take a data-driven algorithm design perspective, i.e., we
show that we can use samples from a distribution over instances to adapt to the setting
at hand and get better guarantees. First, we describe the context and motivation for this
perspective.
Framework.
Suppose that we are in a setting where we must train and deploy a new
machine learning model for a prediction problem each month. Each month, we must select
hyperparameters and then train a deployable model with those hyperparameters. How can
we leverage historical data to solve the hyperparameter selection problem? We neither
want to assume that the best model on a given day is the best model on another day, nor
even that the best hyperparameters for one day are the best hyperparameters for another
day. Instead, let us simply assume that the algorithm we use for hyperparameter selection
should be similar across days, and we wish to learn the best such algorithm. Now suppose
we have historical data from, January to June, and we wish to use that offline data to
learn which hyperparameter selection algorithm is most appropriate to deploy in July.
Further, assume we can inspect the available data completely, i.e., for each model and hy-
perparameter setting trained in January through June, we have access to the full learning
30
curves. Then, our goal will be to learn a good algorithm from a family of algorithms. In
this work, we identify relevant families of algorithms to solve the problem of identifying
the best bandit algorithm for future hyperparameter tuning and study what happens when
we choose an algorithm from this family by using empirical risk minimization (ERM) with
respect to the offline instances. Finally, with this “best” algorithm identified, we deploy
it on future hyperparameter tuning problems. We conclude that if future instances are
drawn from the same distribution as the training instances, then in expectation over the
distribution, we will do well on the future instances.
Now, we formally define the preliminaries for our study of the improving multi-armed
bandits problem in the data-driven algorithm design framework following prior work on
stochastic bandits [SS25].
We consider loss functions of an algorithm in an algorithm
family on an instance, defining l(I,α) as the loss of the algorithm with the parameters
fixed to α ∈P on instance I . We also define the dual of a loss function.
Definition 4.2.1. A loss function ℓ: I×P →R is piecewise-H-bounded if it is piecewise-
constant and has a bounded range [0, H]. We fix the instance and consider the loss on a
fixed instance as a function of the algorithm. Since the algorithm arises from a parame-
terized family, the loss is a function of the parameter vector. In particular, the dual of the
loss function is given by: lI
T (α) = ℓT (I,α) .
Finally, we formally define the problem we study.
Definition 4.2.2 (Hyperparameter Transfer Setting). Suppose we have a distribution D
over I , the space of instances I of the improving multi-armed bandits problem as defined in
Definition 2.2.1. Consider a family of algorithms parameterized by a vector of parameters
α ∈P. Finally, consider a piecewise-H-bounded loss, l. We achieve sample complexity
N(ϵ, δ) in the Hyperparameter Transfer Setting if, for any ϵ, δ ∈(0, 1), given N(ϵ, δ)
instances sampled iid from D , we identify ˆα such that with probability 1 −δ,

EI∼D [lT (I, ˆα)] −min
α∈P EI∼D [lT (I,α)]

 < ϵ .
(4.2)
4.3

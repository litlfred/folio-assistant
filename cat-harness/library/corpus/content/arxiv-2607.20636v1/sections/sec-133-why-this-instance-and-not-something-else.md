---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-133-why-this-instance-and-not-something-else
section_title: "Why This Instance and Not Something Else?"
section_number: null
pages: 180-181
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The instance defined in Equation 7.1 reflects settings where grit pays off eventually but
even then not immediately, i.e., there is only a gradual increase of reward even after
t = θ . This captures certain situations we may be interested in – for instance, consider
a computer science theory PhD program, where the first several years are spent taking
classes to bolster one’s mathematical skills, following which there is still a ramp up period
as the student gets accustomed to doing research.
Thus, it is natural to suppose the
early years of PhD candidacy yield some research progress, while the later years yield
significantly more. On the other hand, there are many natural cases in which once the
payoff starts, it reaches its complete potential immediately; a natural example of this is
when well-digging or searching for oil. In these cases, a bandit arm formulation more like
the following may be more reasonable:
f1(t) = 1 ∀t
f2(t) =
(
0
t < θ
m
t ≥θ .
If we aim to maximize the competitive ratio, we consider two extreme worst cases:
first, one in which the agent spent s time on the striving arm but instead should have
spent all their time on the stable arm; second, one in which the agent spent s time on
the striving arm to no avail but would’ve witnessed the increase on the striving arm if
they’d stuck around infinitesimally longer. In this case, the former is (T −s)/T , which is
decreasing with s , while the latter is (T −s)/(m(T −s)) = 1/m , which is non-increasing.
This implies that as long as the agent switches to the stable arm before s = (1 −1/m)T ,
they achieve competitive ratio at least 1/m . Thus, achieving the optimal competitive ratio
is trivial and there is no strategy to the game. Owing to this, we study a slightly more
complicated setting – the instance in which f2 increases linearly once it starts paying off.
In general, the non-trivial instances are ones in which the first competitive ratio ex-
treme case is decreasing with s and the second competitive ratio extreme case is increasing
with s . If we define F2 :=
R
f2 , we find F2 needs to be increasing with s in order to find
165
a sensible switch point that balances the worse cases, i.e.:
T −s
T
=
T −s
F2(T −s) ⇒s = T −F −1
2 (T) ⇒CR = F −1
2 (T)
T
.
We also note that the interleaving results are specific to a deterministic, noise-free f1 ;
if the stable arm had noisy payoffs with an unknown mean value, then the agent would
want to perform a small amount of interleaving in order to better understand the tradeoff.
D.3

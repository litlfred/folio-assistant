---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-005-other-useful-inequalities
section_title: "Other Useful Inequalities"
section_number: null
pages: 8-10
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
In theoretical analysis, concentration inequalities are often paired with other inequalities. Here,
we shall see some of the commonly used inequalities. The simplest is the union bound.
Theorem 2.14 (Union Bound). Let (𝐴𝑖)𝑛
𝑖=1 be a sequence of random events. Then,
P
 𝑛[
𝑖=1
𝐴𝑖
!
≤
𝑛
∑︁
𝑖=1
P(𝐴𝑖).
(2.12)
Example 2.15. Suppose the probability of a student getting a perfect 100 grade is at most 0.001.
Denote 𝐴𝑖to be the event a student 𝑖gets grade 100. Then the probability of at least one student
obtaining the perfect grade in a class of size 50 is
P
 12
[
𝑖=1
𝐴𝑖
!
≤
50
∑︁
𝑖=1
P(𝐴𝑖) ≤
50
∑︁
𝑖=1
0.001 = 0.05.
That is, there is at most 5% chance/relative frequency that a student will get 100 in this setting.
Another useful inequality is Jensen’s inequality which allows us to swap an expectation
operator with a convex/concave function.
7
2 Concentration Inequalities
Theorem 2.16 (Jensen’s Inequality). Let 𝑋be a random variable taking values in R𝑛and
let 𝑓: R𝑛→R be a convex or concave function. Then,
(i) if 𝑓is convex: 𝑓(E(𝑋)) ≤E( 𝑓(𝑋)),
(ii) if 𝑓is concave: 𝑓(E(𝑋)) ≥E( 𝑓(𝑋)).
Moreover, both inequalities also hold for empirical means.
8
Chapter 3

---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-018-computing-range-for-a-fixed-arm
section_title: "Computing Range for a Fixed Arm"
section_number: null
pages: 38-38
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Here, we describe how we compute the range in which the maximum lies for a fixed arm,
i.e., we compute upper and lower bounds on fi(T) based on an exploration phase on fi .
Lemma 3.4.1. The procedure detailed in lines 1-3 of Algorithm 2 provides, for a fixed
arm with reward function f, a range R := [ ˆmL, ˆmU] such that f(T) ∈R and ˆmU ≤2k ˆmL .
Proof. We use the diminishing returns property to show both parts. First, by the fact
that the reward functions are increasing, it is clear that f(T) ≥f(T/(2k)) . Then, due to
the diminishing returns property:
f(T) = f
 T
2k

+
T−T
2k
X
n=1

f
 T
2k + n

−f
 T
2k + n −1

(3.9)
≤f
 T
2k

+

T −T
2k
 
f
 T
2k + 1

−f
 T
2k

(3.10)
≤f
 T
2k

+

T −T
2k
 
f
 T
2k

−f
 T
2k −1

.
(3.11)
Next, we show that ˆmU ≤2k ˆmL, which follows immediately from the diminishing
returns property. In particular, ˆmU = f( T
2k) + (f( T
2k) −f( T
2k −1))(T −T
2k) ≤f( T
2k) +
2k
T f( T
2k)(T −T
2k) = f( T
2k) + (2k −1)f( T
2k) = 2k ˆmL.
3.4.2

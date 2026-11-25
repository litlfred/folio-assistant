---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-139-calculations-for-interplay-of-grit-and-trust-fun
section_title: "Calculations For Interplay of Grit and Trust Fund"
section_number: null
pages: 183-184
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Now, we look at what happens when the rate of increase of the arm is unknown so some
amount of grit plays into the decision of when to switch, but there is also a cost to striving
and net reward is never allowed to be negative. Formally, at each time step, the agent
chooses between:
f1(t) = 1 ∀t
f2(t) =
(
−1
t < θ
α(t −θ)
t ≥θ .
As before, an agent has a guess ˜α of how fast they think the increase will happen.
Let us first consider someone without a trust fund and guess ˜α. For them, the factors to
balance are:
(1 −1) · s + T −s
T
=
(1 −1) · s + T −s
(1 −1) · s + ˜α
2 (T −s)2
(D.12)
T −s
T
=
T −s
˜α
2 (T −s)2
(D.13)
which gives switching point s = T −
q
2T
˜α
and T
2 −
q
T
2˜α time spent on the striving
168
arm. However, an agent with a fixed large safety net (say, R = T) can explore for longer,
trading off:
R −s + T −s
R + T
=
R −s + T −s
R −s + ˜α
2 (T −s)2
(D.14)
s = T + 1
˜α −
r
4T
˜α + 1
˜α .
(D.15)
In this case, the switching point is as above, and the time spent on the striving arm is
the same.

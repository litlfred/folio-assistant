---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-019-upper-and-lower-bounds-on-final-value-of-best-ar
section_title: "Upper and Lower Bounds on Final Value of Best Arm From Exploration"
section_number: null
pages: 38-39
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
ploration
Now, for each arm, we have a range within which its maximum must lie. Next, we combine
these bounds to get a relatively small interval in which we can be sure f⋆(T) lies.
23
Lemma 3.4.2. Define L := 1
2 maxi ˆm(i)
L and U := maxi ˆm(i)
U . Then, f⋆(T) ∈[L, U] , and
U
L ≤4k.
Proof. First, observe that by diminishing returns, we have that:
f⋆(T) T ≥
T
X
t=1
f⋆(t) = max
i
T
X
t=1
fi(t) ≥
T
X
t=1
fp(t)
where p := arg max
i
fi
 T
2k

(3.12)
≥fp
 T
2k
 T
2 = ˆm(p)
L
T
2 ⇔f⋆(T) ≥ˆm(p)
L
2
= L .
(3.13)
Next, since f⋆(T) ≤f⋆( T
2k)+(T −T
2k)(f⋆( T
2k)−f⋆( T
2k −1)) (due to diminishing returns),
we also have that f⋆(T) ≤maxi f(i)( T
2k)+(T −T
2k)(f(i)( T
2k)−f(i)( T
2k −1)) = maxi ˆm(i)
U = U .
Now that we have that m ∈[L, U] , we verify the size of the interval. In particular, for
some index i′ we have U = ˆm(i′)
U
≤2k ˆm(i′)
L
≤4kL, where the first inequality follows from
Lemma 3.4.1.
3.4.3

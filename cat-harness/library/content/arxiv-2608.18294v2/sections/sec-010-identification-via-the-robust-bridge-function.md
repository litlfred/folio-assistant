---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-010-identification-via-the-robust-bridge-function
section_title: "Identification via the Robust Bridge Function"
section_number: null
pages: 12-14
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Given the identified conditional classification rate η∗
j,a( eD), we now construct a tailored bridge function
to obtain an unbiased downstream moment function by building on the recent literature in causal
inference (Zhou and Tchetgen Tchetgen, 2024; Guo et al., 2026). We first define a single-proxy bridge
as
Mj( eD; η∗) =
X(j) −η∗
j,0( eD)
η∗
j,1( eD) −η∗
j,0( eD)
,
which by construction satisfies E[Mj( eD; η∗) | X∗, eD] = X∗. Assumption 3.1 further implies that, for
every nonempty set of distinct labels S,
E

Y
j∈S
Mj( eD; η∗)

X∗, eD

=
Y
j∈S
E
h
Mj( eD; η∗) | X∗, eD
i
= (X∗)|S| = X∗,
where the final equality follows because X∗∈{0, 1}. Thus, many functions of imperfect labels are
valid bridges. Consider a class of polynomial bridge functions:
H( e
X, eD; η∗) :=
X
S∈S
ωS
Y
j∈S
Mj( eD; η∗)
(3.6)
where S is a collection of nonempty subsets of {1, . . . , J} and ωS is the coefficient assigned to the
corresponding polynomial term. Any member of this class preserves the unbiasedness for X∗whenever
P
S∈S ωS = 1.
To obtain desirable statistical properties within this class, we combine multiple proxies in a
way that is symmetric between labels and Neyman orthogonal (Robins, Rotnitzky and Zhao, 1994;
Chernozhukov et al., 2018) so that it is locally robust to the first-stage estimation error for the
conditional classification rate η∗
j,a(d). Define the average pair and triple bridges as
H2( e
X, eD; η∗) :=
J
2
−1 X
j1<j2
Mj1( eD; η∗)Mj2( eD; η∗),
H3( e
X, eD; η∗) :=
J
3
−1
X
j1<j2<j3
Mj1( eD; η∗)Mj2( eD; η∗)Mj3( eD; η∗).
One example of a symmetric robust bridge function is written as follows.
HR( e
X, eD; η∗) = 3H2( e
X, eD; η∗) −2H3( e
X, eD; η∗).
(3.7)
For a symmetric combination c2H2+c3H3, the unbiasedness of the bridge function requires c2+c3 = 1,
while the Neyman orthogonality (i.e., cancellation of the first-order bridge error) under X∗= 1
requires 2c2 + 3c3 = 0, yielding c2 = 3 and c3 = −2 as a unique set of weights. Under X∗= 0, the
pair and triple terms are already at least second order and achieve the Neyman orthogonality. Thus,
while a single-proxy bridge is enough for identifying the downstream moment, at least three distinct
proxies are needed for the Neyman orthogonality and the resulting robustness to the first-stage
estimation error.
For J = 3, equation (3.7) becomes HR = M1M2 + M1M3 + M2M3 −2M1M2M3. In the binary
latent dependent variable setting, this bridge coincides with the construction first proposed by Guo
et al. (2026), who also extend this to causal inference with finite-support hidden dependent variables.
Theoretically, we generalize the existing results to more than three proxies, examine efficiency gains
12
from additional proxies, and develop a general downstream moment framework covering both latent
independent- and dependent-variable settings. This is important as researchers can often construct
many proxies from LLMs in the modern applications of AI-generated data. Below, we focus on a
robust bridge function with pair and triple products for numerical stability and the sake of clear
presentation. However, we emphasize that our method and proofs are applicable to a more general
class of bridge functions that use higher-order interaction terms of single-proxy bridge functions
(equation (3.6)).
We now formally state the unbiasedness and local robustness of the symmetric bridge function.
Proposition 3.1 (Unbiasedness and local robustness of the symmetric robust bridge function). We
assume that imperfect measurements {X(j)}J
j=1 are relevant, i.e., for some constant c∆> 0,
min
1≤j≤J

η∗
j,1( eD) −η∗
j,0( eD)

 ≥c∆
a.s.
Under Assumption 3.1,
E
h
HR( e
X, eD; η∗) | X∗, eD
i
= X∗.
(3.8)
Moreover, consider cross-fitted estimates of the single-label bridges c
Mj and let the error term
ej,a( eDi) = E
h
c
Mij( eDi; bη(−k(i))) | X∗
i = a, eDi, I−k(i)
i
−a,
for a ∈{0, 1},
where I−k(i) is the data excluding the fold k(i) that unit i belongs to, and c
Mij is constructed by the
conditional classification rate bη(−k(i)) estimated only using I−k(i). Conditional on the training sample
I−k, the fitted robust bridge only contains the second- or third-order bias.
E[ bHR( e
X, eD; bη(−k)) | X∗= 1, eD, I−k] −1
= −3
J
2
−1 X
j1<j2
ej1,1( eD)ej2,1( eD) −2
J
3
−1
X
j1<j2<j3
ej1,1( eD)ej2,1( eD)ej3,1( eD),
E[ bHR( e
X, eD; bη(−k)) | X∗= 0, eD, I−k]
= 3
J
2
−1 X
j1<j2
ej1,0( eD)ej2,0( eD) −2
J
3
−1
X
j1<j2<j3
ej1,0( eD)ej2,0( eD)ej3,0( eD).
Consequently, the conditional bridge error contains no term that is linear in a single first-stage error.
The proof is provided in Appendix A.1. As shown above, the coefficients 3 and −2 preserve the un-
biasedness of the bridge function and eliminate first-order bridge error: at X∗= 1, 3(2/J)−2(3/J) =
0, while at X∗= 0, no linear term arises because singleton products are excluded. Therefore, if each
estimated conditional classification rate model converges in L2(P) at rate δn and the downstream
moment contrast is uniformly bounded as assumed in Theorem 3.2, the resulting population remain-
der of the bridge-based moment function is of order Op(δ2
n), rather than Op(δn). This second-order
remainder underlies the asymptotic inference results in the next subsection.
Finally, we can now substitute the robust bridge into the binary decomposition of the full-data
moment equation to obtain an unbiased downstream moment function.
ψDMM( e
X, eD; β, η∗) = {1 −HR( e
X, eD; η∗)}ψF (Y, 0, W; β) + HR( e
X, eD; η∗)ψF (Y, 1, W; β).
13
Theorem 3.1 (Identification of the downstream parameter). Suppose the conditions of Result 1 hold,
and suppose that the class contrasts of all proxies used in the robust bridge are bounded away from
zero. Suppose also that the oracle downstream moment in equation (2.1) has the unique solution β∗.
Then the robust bridge is identified from the observed-data law and, for every β,
E[ψDMM( e
X, eD; β, η∗)] = E[ψF (Y, X∗, W; β)]
where η∗(·) denotes the true conditional classification rate function. Consequently, β∗is identified
from the observed-data law as the unique solution to
E[ψDMM( e
X, eD; β, η∗)] = 0.
Proof. By Result 1, η∗is identified from the observed-data law. The class-contrast condition therefore
makes the robust bridge HR well defined and identified. By iterated expectation and equation (3.8),
E[ψDMM( e
X, eD; β, η∗)] = E
h
ψF (Y, 0, W; β) + E[HR( e
X, eD; η∗) | X∗, eD]{ψF (Y, 1, W; β) −ψF (Y, 0, W; β)}
i
= E

(1 −X∗)ψF (Y, 0, W; β) + X∗ψF (Y, 1, W; β)

= E

ψF (Y, X∗, W; β)

,
which completes the proof.
3.3

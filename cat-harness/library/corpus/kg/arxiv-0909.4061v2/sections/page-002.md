---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
2
HALKO, MARTINSSON, AND TROPP
highly accurate and provably correct manner.
The decompositional approach to matrix computation remains fundamental, but
developments in computer hardware and the emergence of new applications in the
information sciences have rendered the classical algorithms for this task inadequate
in many situations:
• A salient feature of modern applications, especially in data mining, is that
the matrices are stupendously big. Classical algorithms are not always well
adapted to solving the type of large-scale problems that now arise.
• In the information sciences, it is common that data are missing or inaccurate.
Classical algorithms are designed to produce highly accurate matrix decompo-
sitions, but it seems proﬂigate to spend extra computational resources when
the imprecision of the data inherently limits the resolution of the output.
• Data transfer now plays a major role in the computational cost of numerical
algorithms. Techniques that require few passes over the data may be substan-
tially faster in practice, even if they require as many—or more—ﬂoating-point
operations.
• As the structure of computer processors continues to evolve, it becomes in-
creasingly important for numerical algorithms to adapt to a range of novel
architectures, such as graphics processing units.
The purpose of this paper is make the case that randomized algorithms pro-
vide a powerful tool for constructing approximate matrix factorizations. These tech-
niques are simple and eﬀective, sometimes impressively so.
Compared with stan-
dard deterministic algorithms, the randomized methods are often faster and—perhaps
surprisingly—more robust. Furthermore, they can produce factorizations that are ac-
curate to any speciﬁed tolerance above machine precision, which allows the user to
trade accuracy for speed if desired. We present numerical evidence that these algo-
rithms succeed for real computational problems.
In short, our goal is to demonstrate how randomized methods interact with classi-
cal techniques to yield eﬀective, modern algorithms supported by detailed theoretical
guarantees. We have made a special eﬀort to help practitioners identify situations
where randomized techniques may outperform established methods.
Throughout this article, we provide detailed citations to previous work on ran-
domized techniques for computing low-rank approximations. The primary sources
that inform our presentation include [17, 46,58, 91, 105, 112,113, 118,137].
Remark 1.1. Our experience suggests that many practitioners of scientiﬁc com-
puting view randomized algorithms as a desperate and ﬁnal resort. Let us address
this concern immediately. Classical Monte Carlo methods are highly sensitive to the
random number generator and typically produce output with low and uncertain ac-
curacy. In contrast, the algorithms discussed herein are relatively insensitive to the
quality of randomness and produce highly accurate results. The probability of failure
is a user-speciﬁed parameter that can be rendered negligible (say, less than 10−15)
with a nominal impact on the computational resources required.
1.1. Approximation by low-rank matrices. The roster of standard matrix
decompositions includes the pivoted QR factorization, the eigenvalue decomposition,
and the singular value decomposition (SVD), all of which expose the (numerical) range
of a matrix. Truncated versions of these factorizations are often used to express a

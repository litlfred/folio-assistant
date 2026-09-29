---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
arXiv:0909.4061v2  [math.NA]  14 Dec 2010
FINDING STRUCTURE WITH RANDOMNESS:
PROBABILISTIC ALGORITHMS FOR CONSTRUCTING
APPROXIMATE MATRIX DECOMPOSITIONS
N. HALKO†, P. G. MARTINSSON†, AND J. A. TROPP‡
Abstract.
Low-rank matrix approximations, such as the truncated singular value decompo-
sition and the rank-revealing QR decomposition, play a central role in data analysis and scientiﬁc
computing. This work surveys and extends recent research which demonstrates that randomization
oﬀers a powerful tool for performing low-rank matrix approximation. These techniques exploit mod-
ern computational architectures more fully than classical methods and open the possibility of dealing
with truly massive data sets.
This paper presents a modular framework for constructing randomized algorithms that compute
partial matrix decompositions.
These methods use random sampling to identify a subspace that
captures most of the action of a matrix. The input matrix is then compressed—either explicitly or
implicitly—to this subspace, and the reduced matrix is manipulated deterministically to obtain the
desired low-rank factorization. In many cases, this approach beats its classical competitors in terms
of accuracy, speed, and robustness. These claims are supported by extensive numerical experiments
and a detailed error analysis.
The speciﬁc beneﬁts of randomized techniques depend on the computational environment. Con-
sider the model problem of ﬁnding the k dominant components of the singular value decomposition
of an m × n matrix.
(i) For a dense input matrix, randomized algorithms require O(mn log(k))
ﬂoating-point operations (ﬂops) in contrast with O(mnk) for classical algorithms. (ii) For a sparse
input matrix, the ﬂop count matches classical Krylov subspace methods, but the randomized ap-
proach is more robust and can easily be reorganized to exploit multi-processor architectures. (iii) For
a matrix that is too large to ﬁt in fast memory, the randomized techniques require only a constant
number of passes over the data, as opposed to O(k) passes for classical algorithms. In fact, it is
sometimes possible to perform matrix approximation with a single pass over the data.
Key words.
Dimension reduction, eigenvalue decomposition, interpolative decomposition,
Johnson–Lindenstrauss lemma, matrix approximation, parallel algorithm, pass-eﬃcient algorithm,
principal component analysis, randomized algorithm, random matrix, rank-revealing QR factoriza-
tion, singular value decomposition, streaming algorithm.
AMS subject classiﬁcations. [MSC2010] Primary: 65F30. Secondary: 68W20, 60B20.
Part I: Introduction
1. Overview. On a well-known list of the “Top 10 Algorithms” that have in-
ﬂuenced the practice of science and engineering during the 20th century [40], we ﬁnd
an entry that is not really an algorithm: the idea of using matrix factorizations to
accomplish basic tasks in numerical linear algebra. In the accompanying article [127],
Stewart explains that
The underlying principle of the decompositional approach to matrix
computation is that it is not the business of the matrix algorith-
micists to solve particular problems but to construct computational
platforms from which a variety of problems can be solved.
Stewart goes on to argue that this point of view has had many fruitful consequences,
including the development of robust software for performing these factorizations in a
†Department of Applied Mathematics, University of Colorado at Boulder, Boulder, CO 80309-
0526. Supported by NSF awards #0748488 and #0610097.
‡Computing & Mathematical Sciences, California Institute of Technology, MC 305-16, Pasadena,
CA 91125-5000. Supported by ONR award #N000140810883.
1

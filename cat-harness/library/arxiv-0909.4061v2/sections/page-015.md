---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-015
section_title: "Page 15"
pages: 15-15
pdf_page: 15
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
15
rithms require fewer random samples from the matrix and use fewer computational
resources than compressive sampling reconstruction algorithms.
2.2. Origins. This section attempts to identify some of the major threads of
research that ultimately led to the development of the randomized techniques we
discuss in this paper.
2.2.1. Random embeddings. The ﬁeld of random embeddings is a major pre-
cursor to randomized matrix approximation. In a celebrated 1984 paper [74], Johnson
and Lindenstrauss showed that the pairwise distances among a collection of N points
in a Euclidean space are approximately maintained when the points are mapped
randomly to a Euclidean space of dimension O(log N). In other words, random em-
beddings preserve Euclidean geometry. Shortly afterward, Bourgain showed that ap-
propriate random low-dimensional embeddings preserve the geometry of point sets in
ﬁnite-dimensional ℓ1 spaces [15].
These observations suggest that we might be able to solve some computational
problems of a geometric nature more eﬃciently by translating them into a lower-
dimensional space and solving them there. This idea was cultivated by the theoretical
computer science community beginning in the late 1980s, with research ﬂowering in
the late 1990s. In particular, nearest-neighbor search can beneﬁt from dimension-
reduction techniques [73, 78, 80]. The papers [57, 104] were apparently the ﬁrst to
apply this approach to linear algebra.
Around the same time, researchers became interested in simplifying the form
of dimension reduction maps and improving the computational cost of applying the
map. Several researchers developed reﬁned results on the performance of a Gaussian
matrix as a linear dimension reduction map [32, 73, 93]. Achlioptas demonstrated that
discrete random matrices would serve nearly as well [1]. In 2006, Ailon and Chazelle
proposed the fast Johnson–Lindenstrauss transform [3], which combines the speed of
the FFT with the favorable embedding properties of a Gaussian matrix. Subsequent
reﬁnements appear in [4, 87]. Sarl´os then imported these techniques to study several
problems in numerical linear algebra, which has led to some of the fastest algorithms
currently available [88, 137].
2.2.2. Data streams. Muthukrishnan argues that a distinguishing feature of
modern data is the manner in which it is presented to us. The sheer volume of infor-
mation and the speed at which it must be processed tax our ability to transmit the
data elsewhere, to compute complicated functions on the data, or to store a substan-
tial part of the data [100, §3]. As a result, computer scientists have started to develop
algorithms that can address familiar computational problems under these novel con-
straints. The data stream phenomenon is one of the primary justiﬁcations cited by [45]
for developing pass-eﬃcient methods for numerical linear algebra problems, and it is
also the focus of the recent treatment [29].
One of the methods for dealing with massive data sets is to maintain sketches,
which are small summaries that allow functions of interest to be calculated. In the
simplest case, a sketch is simply a random projection of the data, but it might be a
more sophisticated object [100, §5.1]. The idea of sketching can be traced to the work
of Alon et al. [5, 6].
2.2.3. Numerical linear algebra. Classically, the ﬁeld of numerical linear al-
gebra has focused on developing deterministic algorithms that produce highly ac-
curate matrix approximations with provable guarantees. Nevertheless, randomized
techniques have appeared in several environments.

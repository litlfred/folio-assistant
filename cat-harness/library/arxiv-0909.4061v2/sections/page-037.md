---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-037
section_title: "Page 37"
pages: 37-37
pdf_page: 37
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
37
as Lanczos [61, p. 473] or Arnoldi [61, p. 499] are inherently unstable. To obtain nu-
merical robustness, we must incorporate sophisticated modiﬁcations such as restarts,
reorthogonalization procedures, etc. Constructing a high-quality implementation is
suﬃciently hard that the authors of a popular book on “numerical recipes” qualify
their treatment of spectral computations as follows [109, p. 567]:
You have probably gathered by now that the solution of eigensystems
is a fairly complicated business. It is. It is one of the few subjects
covered in this book for which we do not recommend that you avoid
canned routines.
On the contrary, the purpose of this chapter is
precisely to give you some appreciation of what is going on inside
such canned routines, so that you can make intelligent choices about
using them, and intelligent diagnoses when something goes wrong.
Randomized sampling does not eliminate the diﬃculties referred to in this quotation;
however it reduces the task of computing a partial spectral decomposition of a very
large matrix to the task of computing a full decomposition of a small dense matrix.
(For example, in Algorithm 5.1, the input matrix A is large and B is small.) The latter
task is much better understood and is eminently suitable for using canned routines.
Random sampling schemes interact with the large matrix only through matrix–matrix
products, which can easily be implemented by a user in a manner appropriate to the
application and to the available hardware.
The comparison is further complicated by the fact that there is signiﬁcant overlap
between the two sets of ideas.
Algorithm 4.3 is conceptually similar to a “block
Lanczos method” [61, p. 485] with a random starting matrix. Indeed, we believe that
there are signiﬁcant opportunities for cross-fertilization in this area. Hybrid schemes
that combine the best ideas from both ﬁelds may perform very well.
6.3. General matrices stored in slow memory or streamed. The tradi-
tional metric for numerical algorithms is the number of ﬂoating-point operations they
require. When the data does not ﬁt in fast memory, however, the computational time
is often dominated by the cost of memory access. In this setting, a more appropri-
ate measure of algorithmic performance is pass-eﬃciency, which counts how many
times the data needs to be cycled through fast memory. Flop counts become largely
irrelevant.
All the classical matrix factorization techniques that we discuss in §3.2—including
dense SVD, rank-revealing QR, Krylov methods, and so forth—require at least k
passes over the the matrix, which is prohibitively expensive for huge data matrices. A
desire to reduce the pass count of matrix approximation algorithms served as one of
the early motivations for developing randomized schemes [46, 58, 105]. Detailed recent
work appears in [29].
For many matrices, randomized techniques can produce an accurate approxima-
tion using just one pass over the data. For Hermitian matrices, we obtain a single-pass
algorithm by combining Algorithm 4.1, which constructs an approximate basis, with
Algorithm 5.6, which produces an eigenvalue decomposition without any additional
access to the matrix. Section 5.5 describes the analogous technique for general ma-
trices.
For the huge matrices that arise in applications such as data mining, it is com-
mon that the singular spectrum decays slowly. Relevant applications include image
processing (see §§7.2–7.3 for numerical examples), statistical data analysis, and net-
work monitoring. To compute approximate factorizations in these environments, it is

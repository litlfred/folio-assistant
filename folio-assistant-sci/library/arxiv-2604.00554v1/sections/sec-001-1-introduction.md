---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Introduction
Printed mathematical literature has a long history, with records
dating back several centuries. Among the most comprehensive re-
sources in the field, zbMATH Open (1868 – present) serves as a
critical abstracting and reviewing service in pure and applied math-
ematics [21]. It offers a vast collection of abstracts, reviews, and
summaries of mathematical research articles, making it an indis-
pensable tool for researchers in mathematics and related disciplines.
As of April 2024, zbMATH Open includes over 4.8 million entries,
consisting of abstracts, reviews, and summaries of mathematical
research papers. Throughout this paper, we refer to these entries
(without metadata) as documents.
However, approximately 831,000 documents in zbMATH Open
exist only in scanned volumes (e.g., Figure 1), some of which date
back to the 19th century. These scanned documents were digitized
from typeset records [2] and include essential metadata such as
titles in LaTeX, publication source, year of publication, and page
numbers. Although the scanned volumes allow mathematicians to
read individual documents, they are not searchable or suitable for
text mining. Mathematical content, such as LaTeX representations
of text, formulas, and symbols, is essential to enabling machine
processing of mathematical concepts. This, in turn, benefits ap-
plications like neural networks and Math Information Retrieval
(MathIR) systems [7, 8, 13, 14], which are critical to improving the
efficiency and accuracy of searches for related mathematical con-
cepts and to assisting in various research processes. For example,
MathIR systems allow for "linking 𝑃(𝛼,𝛽)
𝑛
(𝑥) with ‘Jacobi polyno-
mial’" [7]. Beyond entity linking, these systems support a range of
applications, including plagiarism detection, search engines, and
recommendation systems. Therefore, converting scanned images
to machine-readable formats is crucial to enhance accessibility and
enable advanced data processing.
Beck et al. [2] conducted an initial study on converting scanned
zbMATH Open documents to LaTeX and splitting them for further
use. They identified two major challenges: first, scanned pages often
feature text in varying styles, heights, and line spacings, and type-
setting techniques change over time [31]. Any solution to handle
these data must be adaptable to these variations. Second, documents
may span multiple scanned pages or multiple documents may ap-
pear on a single page (e.g., Figure 1). These challenges highlight the
need for specialized methods to accurately split documents. Several
studies [33, 34, 40] have explored document data extraction, employ-
ing techniques such as ChatGPT and regular expressions. Recent
advancements in Large Language Models (LLMs) offer promising
results in document splitting tasks. However, these approaches
have not yet been applied to the task of splitting zbMATH Open
documents. This work aims to address the challenge of accurately
extracting LaTeX documents from scanned zbMATH Open volumes.
arXiv:2604.00554v1  [cs.DL]  1 Apr 2026
Pluzhnikov et al.
(a) First scanned page
(b) Second scanned page
Figure 1: Illustration of two scanned pages from zbMATH
Open, showcasing the end of one document (blue), four
complete documents (red), and the start of another (green).
https://zbmath.org/?q=an%3A0001.12001.
The goal of this research is to split the Optical Character Recog-
nition (OCR) output (LaTeX representation of scanned documents)
from the zbMATH Open volumes and associate the resulting output
with the metadata of the corresponding documents in the zbMATH
Open database.
This paper makes the following key contributions. It introduces

---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-002-source-dataset
section_title: "Source Dataset"
section_number: null
pages: 2-2
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
We queried the TIBKAT service to restrict its
metadata to records containing abstracts and
GND subject indexing.
The query is fully
reproducible via this persistent search link.
It
returned 189,665 records at the time of dataset
creation. The TIB open-access catalog spans nine
media types: Book (136,434), Thesis (31,859),
Conference (12,212), Report (6,711), Article
(2,080), Collection (188), AudioVisualDocument
(167), Periodical (57), and Chapter (11), detailed
in Appendix A. Using the langdetect3 Python
library, we identified 48 languages. The top five
were German (108,637), English (76,735), French
(1,741), Indonesian (945), and Spanish (311).4
For the official shared task corpus, we retained
only records in German and English and excluded
the four least represented media types, resulting
in a dataset of 123,589 records. The excluded
data is available as supplementary data.
The
final shared task dataset is available at: https:
//github.com/jd-coderepos/llms4subjects/
tree/main/shared-task-datasets.
3.1

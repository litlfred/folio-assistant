---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-021-7-computer-vision-based-baseline
section_title: "Computer vision-based baseline"
section_number: 7
pages: 7-7
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Computer vision-based baseline
Given the success of computer vision models in document splitting
tasks, we selected a CV-based approach as a baseline. When using
such approaches, an important aspect is the ability of the model
to distinguish different parts of the document. More precisely, the
model should be able to determine a title from plain text. The pro-
portion of correctly identified titles among all actual titles serves
as an upper bound for the accuracy of the entire CV-based docu-
ment splitting method. This is because titles are used to define the
boundaries of the document of interest (as there may be no text
relating to the document at all on the given page).
In this research, we used a state-of-the-art Document Image
Transforme (DIT) model [18] for document layout analysis, evalu-
ating its performance on the test dataset. To do this, we modified
the original code, leaving only the "title" label (originally there was
"text", "title", "list", "table", and "figure"). An example of the model
output can be seen in Figure 6.
Figure 6: CV model output on a page with 3 titles, of which 1
was recognized.

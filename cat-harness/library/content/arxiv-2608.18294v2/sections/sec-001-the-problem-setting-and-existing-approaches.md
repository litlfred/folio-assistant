---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-001-the-problem-setting-and-existing-approaches
section_title: "The Problem Setting and Existing Approaches"
section_number: null
pages: 5-6
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Scholars often use machine or human annotations to measure key variables of interest that they want
to analyze in downstream analysis. However, as recent papers theoretically and empirically show,
5
ignoring measurement errors in the annotation step can bias downstream inference, even when the
accuracy of the annotation step is high, e.g., more than 90%. For clarity of presentation, we first focus
on settings where an error-prone variable is a binary independent variable in downstream analysis. In
Section 4, we generalize our method to settings where an error-prone variable is a general categorical
variable that is either an independent or dependent variable.
2.1

---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-018-85-prompting
section_title: "Prompting"
section_number: 8.5
pages: 20-20
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Prompting
Prompt-based methods have been successfully applied to sentence-level few-shot learning tasks such as in NER tasks
[19]. Instead of replacing the language model head with the classifier head, prompt-based approaches induce the
prediction from the language model by constructing a template. By re-using the masked language model objective,
prompt-based approaches alleviate the problem of pre-training and fine-tuning discrepancy (caused by their different
training objectives), as well as benefit the few-shot performance. Furthermore, to avoid the time-consuming issues of
searching for appropriate templates, a template-free approach [69], which re-used the language model head and leads
the model to predict label words through an Entity-oriented objective, was also introduced. However, few efforts have
been made to apply these methods to the token-level learning tasks and ATE in specific. Therefore, we believe that
there is still room for improvement in this direction.

---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-004-2-related-work
section_title: "Related Work"
section_number: 2
pages: 2-3
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Related Work
Several studies have explored the use of regular expressions to
extract content from OCR-processed documents. For instance, Pitou
et al. [27] utilize regular expressions to categorize elements within
scanned invoices processed via OCR, identifying details such as
account numbers, dates, and amounts. They report a recall of 35.88%
and a precision of 50.46%. Similarly, Pandey et al. [24] employ
regular expressions to extract content from a variety of document
types after applying OCR. They achieve accuracies of 97%, 71.87%,
and 78.95% for different document types.
In other studies, computer vision (CV)-based methods focus on
identifying key elements within an image, such as "Text" or "Title",
for further use with OCR tools. Li et al. [19] apply the Faster-RCNN
model [29] to detect the locations of cells within tables. Patil et al.
[25] employ the U-Net architecture [30] to identify areas containing
relevant text before applying the OCR engine. In the application
phase, the F1 score achieved is reported as 99.9%. Furthermore, Zhu
et al. [44] test several models for layout segmentation of newspaper
articles. The best performance in terms of the mean Intersection
over Union (IoU) metric, which is 70.02, is achieved using the Seg-
mentation Transformer model [41]. According to the Hugging Face
documentation1, the state-of-the-art model for document layout
analysis is the Document Image Transformer (DiT) [18]. This model
can classify document elements such as "Text" and "Title". By lever-
aging advanced architectures like Mask R-CNN [9] and Cascade
R-CNN [5], and trained on the comprehensive PubLayNet dataset
[43], DiT processes document images with multiple levels of detail.
In our study, we utilize DiT to compare its performance with our
proposed method.
1https://huggingface.co/docs/transformers/model_doc/dit
LLM-supported document separation for printed reviews from zbMATH Open
Neural network techniques, designed for natural language pro-
cessing (NLP), have also been applied to extract text from OCR-
processed documents. Palm et al. [23] describe the use of the LSTM
model [10] on sequential N-grams of text derived from OCR-processed
invoices, achieving an average F1 score of 89% on seen invoice tem-
plates and 84% on unseen templates. In another study, Kruse et al.
[16] combine OCR with the BERT model to extract definitions from
scanned documents, classifying sentences with an F1 score of 79%.
Zhiwei et al. [20] use GPT-3.5 to extract content from historical doc-
uments with different structures after OCR processing, reporting
an accuracy of 100%. Similarly, Perot et al. [26] use the same model
for information extraction from OCR-processed documents, obtain-
ing a Micro-F1 score of 63.86% on a mixed template of registration
forms.
These studies highlight the potential of using generative LLMs
for document splitting and content extraction. The successful ap-
plication of LLMs in related tasks provides a strong baseline for
our work, particularly for the task of splitting documents. The use
of non-generative methods, such as assigning labels to input se-
quence elements [1, 16], is an alternative approach but requires
significantly more manual effort, as all tokens in the input text must
be marked. In contrast, generative models offer the advantage of

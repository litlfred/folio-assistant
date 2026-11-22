---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-026-84-error-detection-hypotheses
section_title: "Error detection hypotheses"
section_number: 8.4
pages: 8-9
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Error detection hypotheses
In addition to analyzing specific types of errors, we tested two
hypotheses to identify potential indicators of errors in the document
splitting process. These hypotheses focus on aspects of OCR quality
and the probabilistic nature of Transformers-based Large Language
Models, aiming to establish methods for error detection. The fine-
tuned CalmExperiment-7B-slerp model, as the best of the "base"
models, was used in all experiments below.
Hypothesis 1: OCR confidence rate as an indicator of error
likelihood.
The first hypothesis considered the relationship between the
accuracy of the OCR and the likelihood of errors in generative
LLM outputs. Specifically, we hypothesized that the confidence
rate, which is the "estimated confidence of output quality" provided
by the OCR system (Mathpix) could be a useful predictor of split-
ting accuracy. The idea was that OCR quality, as indicated by lower
confidence scores, may correlate with worse document splitting
outcomes and could signal a higher likelihood of errors. However,
our findings indicated that the Mathpix confidence rate did not
consistently predict error-prone segments. In practice, error rates
did not differ significantly between high- and low-confidence OCR
outputs. Of the 18 documents processed with errors, 8 were located
on pages with confidence rates above the average on all 478 doc-
ument pages. At the same time, among the 10 documents located
on pages with the lowest confidence rate, only one was processed
with an error. This result suggests that OCR confidence alone is not
sufficient to reliably forecast issues in the generative LLM-based
document splitting method.
Hypothesis 2: token probabilities as a predictor of segmen-
tation inaccuracy [35].
The second hypothesis explored the potential of using token
probabilities as indicators of segmentation accuracy. Since LLMs
operate on probabilistic predictions, each generated token is as-
signed a probability that reflects the model’s confidence in its choice.
We hypothesized that lower token probabilities across a sequence
might signal lower confidence and, consequently, a higher likeli-
hood of errors in document segmentation. To test this hypothesis,
we modified the code of the LLaMA-Factory tool and collected the
probability value of each output token of each output. We calculated
the probability of the first token, the average probability of the first
five (if exist) tokens, and the average probability of all tokens in
the output sequence as possible quality metrics. This method did
not work as well. For all 18 documents processed with error, no
probability took values other than 1.0 more than 2 times. At the
same time, among the 10 documents with the lowest values of each
of the probabilities, there were also not even 5 processed with error.
The evaluation of these two hypotheses provided valuable in-
formation on the limitations of error detection strategies for the
OCR-integrated generative LLM-based document splitting process.
Although initial assumptions suggested that OCR confidence scores
and token probability metrics might serve as reliable indicators of
errors of the suggested approach, our findings did not fully support
either as standalone predictors.
LLM-supported document separation for printed reviews from zbMATH Open
8.5
Obtaining start and end indexes of
documents.
To obtain the start and end indexes of documents, we searched for
an exact match of the document text, as provided by our best ap-
proach (Majority Voting), within the 𝐿𝑎𝑇𝑒𝑋𝑐𝑜𝑛𝑡𝑒𝑛𝑡. If a match was
found, we recorded the start and end indexes of the occurrence. If
Majority Voting returned "not reviewed.", we noted this response. If
neither of the above conditions was met, we considered the attempt
unsuccessful.
To increase the success rate of this approach, we removed spaces
from both texts we were working with (later restoring the original
start and end indexes of the match). This was done because the
OCR system was making errors by inserting extra spaces in the
text. LLMs correct these errors, but this affected exact matches.
Applying this approach on the test dataset, we obtained indexes
or "not reviewed." for 433 documents - 90.6% of the whole test
dataset. The accuracy metric among them reached a value of 98.4%.
Thus, the overall accuracy on the entire test dataset was 89.1%. This
method did not propose exact matches in the source text for all
the texts of the documents whose processing produced hallucina-
tions. Thus, although it works on fewer documents, it achieves high
accuracy on those it does work on and filters out cases of halluci-
nations. In cases where it is preferable to have fewer documents,
but with higher accuracy on the available ones, this becomes a key
factor. Also, it allows one to get the text of the document from the
OCR output without any modifications. Most of the unsuccessful
attempts happened because of metadata deletion by LLMs.

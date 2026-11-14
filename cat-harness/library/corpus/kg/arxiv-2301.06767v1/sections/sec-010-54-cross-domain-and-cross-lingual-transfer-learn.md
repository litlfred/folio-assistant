---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-010-54-cross-domain-and-cross-lingual-transfer-learn
section_title: "Cross-domain and cross-lingual transfer learning"
section_number: 5.4
pages: 14-15
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Cross-domain and cross-lingual transfer learning
Current research on term extraction deals with two major issues: (1) the data collection for a specific field of expertise
or domain is often non-existent or small, and (2) the available well-annotated corpora are scarce, especially for lesser-
known languages (e.g., Slavic languages). To address the former issue, [63] proposed to combine specialized and general
domain word embeddings to increase the training corpora. However, this technique is hard to apply for most ATE
tasks, since it still requires a “reasonable” amount of domain-specific manually annotated data, which is scarce (i.e., the
second issue). To solve both problems, cross-domain and cross-lingual approaches have been recently introduced.
5.4.1
Cross-domain learning. Zero-shot and few-shot learning recently gained in popularity as advanced approaches
to solve the scarcity of available annotated corpora. They rely on transferring knowledge the model obtains from a
well-resourced domain/language with plenty of annotated data to a less-resourced domain/language with scarce or
no data. This way, cross-domain learning can also be used as a way of checking the generalization capabilities (and
therefore usefulness) of the model, i.e., how successfully the knowledge that the model obtains on one domain can be
applied to the arbitrary new unseen domains.
[45] was the first to propose to fine-tune several Transformer-based language models and to test them in a cross-
domain scenario. In all the scenarios, two domains were used for training, one for validation, and one for testing. The
authors proposed two evaluation settings: 1) fixing the training data sets while varying BERT models to test different
model versions, and 2) fixing the models while varying the training data sets to test the success of different cross-domain
transfers. The results suggested that while cross-domain learning for ATE is possible, the models are still domain
sensitive, and a careful choice of training datasets is necessary to achieve competitive performance.
[58] used the same cross-domain setting with the same corpora, and experimented with three different Transformer-
based term extraction models operating on sentence level: a language model for token classification; one for sequence
classification; and innovative use of sequence to sequence (seq2seq), which learns to reduce sentences to terms. [98]
tested the same cross-domain setting on a less-resourced language, Slovenian (RSDO5 corpus), using a multilingual
model. They showcased a generalization of cross-domain transfer learning also on Slovenian. Finally, [97] employed
several Transformer-based multilingual and monolingual model ensembles in a cross-domain setting on both the
ACTER and RSDO5 dataset, further improving the results of both previous studies and confirming the success of the
cross-domain transfer.
5.4.2
Cross-lingual learning. Similarly to cross-domain learning, cross-lingual learning is based on transferring knowl-
edge obtained by the model from annotated data in a high-resourced language to the input data in a less-resourced
language. We examine how well the ATE model performs without the language-specific training corpus and how good
the knowledge transfer between different languages is.
[45] tested several multilingual fine-tuned Transformer language models in a zero-shot cross-lingual setting. They did
so by fine-tuning the model on the ATE task in one or several languages, and by testing them on a new target language,
14
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
on which the model was not fine-tuned. The results indicate a successful transfer, which led to achieving competitive
results on the ACTER dataset and opening a new promising direction in ATE. [58, 97] further extended this work with
a new benchmark language model, namely XLMR [14], testing its performance in a cross-lingual setting and using the
sequence labeling approach. The results re-confirmed the potential of transferring knowledge from rich-resourced to
less-resourced languages in the field of ATE since this technique allows us to beat the previous state-of-the-art methods
on the ACTER dataset.

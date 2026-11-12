---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-009-53-multilingual-learning
section_title: "Multilingual learning"
section_number: 5.3
pages: 13-14
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Multilingual learning
Recently, a new research direction in ATE aims to conduct term extraction in a multilingual setting, testing the
hypothesis that multilingual information can help during the monolingual extraction phase.
Multilingual term extraction can be performed on parallel or comparable corpora. According to [74]’s definition,
a comparable corpus is composed of monolingual data collected from different languages using the same sampling
techniques. Meanwhile, a parallel corpus is one that is composed of source texts and their translations in one or more
different languages. While the comparable corpora are not translations, they do share some vocabulary (e.g., cognates)
due to the fact that they cover the same topic. This can be exploited to extract equivalent terms found in parallel corpora,
usually by leveraging term alignment approaches.
Regarding parallel corpora, [34] proposed to divide the methods into two groups: “align-extract” and “extract-align”,
depending on whether monolingual candidate terms are extracted first, or whether the alignment is performed first.
Several tools have been proposed (e.g., the TExSIS tool [71]) for bilingual automatic term extraction from parallel
corpora. The TExSIS tool extracts word alignments with GIZA++ [79] and applies the rule-based chunking [70] with
alignment progress and additional statistical (termhood) filtering to extract the candidate terms. Besides GIZA++,
some of the most popular methods for the alignment [47] are Moses phrases tables [54], Awesome Align neural word
alignment [28], and ASTrED aligned syntactic tree edit distance [99], to mention a few.
Despite the significant efforts that have been made to create multilingual corpora that cover more than one domain,
parallel multilingual datasets have been rarely created for less-resourced specialized domains. This is due to the fact
that the creation of these datasets tends to be error-prone, labor-intensive, and time-expensive, and was also criticized
in the past for subjectiveness. Instead, most of the multilingual corpora are comparable, and multilingual language
models are commonly used for term extraction on these corpora. An example of this kind of approach is HAMLET [88].
13
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
[88] proposed six different settings, in which they used 5-fold cross-validation to train and test on a single corpus (one
domain, one language), single language (all domains, one language), or all corpora (all domains, all languages), with or
without POS patterns. [98] leveraged the multilingual setup by fine-tuning the model using training datasets from all
the languages in the ACTER corpora (English, French, and Dutch) and the Slovenian RSDO5 corpus, and then applying
the model to the test sets of all languages. By doing so, they examined whether adding more data from other languages
to the training set that matches the target language in the testing set improves the predictive performance of the model.

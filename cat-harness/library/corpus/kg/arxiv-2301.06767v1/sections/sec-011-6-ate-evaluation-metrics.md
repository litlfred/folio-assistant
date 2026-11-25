---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-011-6-ate-evaluation-metrics
section_title: "ATE evaluation metrics"
section_number: 6
pages: 15-17
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
ATE EVALUATION METRICS
ATE models usually provide a list of candidate terms from the given domain-specific corpus as the final output, and it is
important to define the correct methods and metrics to evaluate the quality of this output. There are several variations
among the evaluation methods, including both intrinsic and extrinsic mechanisms. The extrinsic methods assess the
quality of the extracting system by measuring the improvement in the performance of another system or application
that uses the results of term extraction as described in [102]. Meanwhile, the intrinsic ones measure the quality of term
extractor by evaluating some intrinsic properties, which is independent of their intended planned use. We can classify
the direct evaluation approaches into two main aspects: the evaluation methodology and the scope of the results [110]
as shown in Figure 4. While the evaluation methodology focuses on whether the evaluation is performed by human
judges, or whether it is a dictionary-based or gold standard based, the scope of results answers the question of whether
we evaluate the entire results, parts of the results, or the top-k results. Due to this variety in evaluation types, the
performance of different approaches is often not directly comparable.
Regarding the evaluation methods, in the initial studies about ATE, having a human judge was one of the first
approaches to evaluate how well the candidate terms were extracted. [49] evaluated their system by asking a domain
expert (i.e., a terminologist) to judge whether the extracted candidates were domain-specific terms.
In order to reduce the human effort, the dictionary-based evaluation was proposed either in the form of a list or as a
dictionary of the pre-defined criteria to map with the extracted terms. [51] took advantage of statistical features, e.g.,
termhood and unithood, for evaluation. [61] applied five pre-evaluation criteria from the basic design evaluation to
present how the results are shown in the candidate lists. [71] identified the terms with linguistic preprocessing steps
and matched the candidate terms to a pre-defined dictionary of POS patterns.
Another popular approach is based on reference term lists, or the so-called gold standard corpora, which can be
an adaptation of a pre-existing list, a sample (seed terms), or the list of all the terms in the corpus. The pre-existing
term list [27, 105] is not collected directly from the training corpora but is an already existing and community-wide
terminology. Thus, the term extraction approaches using the corpora with this gold standard often evaluate how
many candidate terms were actual terms but failed to measure how many terms in the text were correctly extracted.
Meanwhile, the approach of considering a sample as the gold standard [9, 67] took advantage of a web crawler to
collect the domain-specific texts (e.g., TTC project). The crawler took a list of domain-specific words, the so-called
seed terms, as input, and as outputs, the texts found on the Web in the domain of interest. The seed terms are usually
term representative of the domain for which we want to retrieve the web documents. To resolve the existing issues of
the two mentioned types, the list of all the terms in the corpus [53, 87] was used as a gold standard where the list was
annotated directly from the corpora. This became a benchmark for manual annotation in term extraction until now. If
this gold standard corpus is used, the final evaluation score is usually obtained by calculating Precision (i.e., how many
candidate terms were actual terms), Recall (i.e., how many terms in the text were correctly extracted), and F1-score (i.e.,
15
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
Fig. 4. The overview of different evaluation metrics in ATE task.
the harmony mean of Precision and Recall) for the obtained list of term candidates. We will specify these metrics when
discussing the evaluation from different scopes of results.
Finally, besides the performance of the ATE system in terms of the evaluation metrics described above, some claim
that other factors, such as the consistency of the predicted candidate terms, are also important. For example, [90]
proposed that the measures of a model’s quality should also concern reliability, efficiency, maintainability, usability,
and portability.
Regarding the scope of results, the most common ATE evaluation approach is to compare the candidate term lists
obtained by the system against the list of terms extracted by human annotators (i.e., the so-called gold standard corpus
[14, 53, 87, 88, 97]). This is done by calculating Precision (i.e., how many candidate terms are actually terms, see Equation
1), Recall (i.e., how many terms in the text were correctly extracted, see Equation 2), and F1-score (i.e., the harmonic
mean between Precision and Recall, see Equation 3).
𝑃𝑟𝑒𝑐𝑖𝑠𝑖𝑜𝑛= 𝑁𝑢𝑚𝑏𝑒𝑟𝑜𝑓𝑐𝑜𝑟𝑟𝑒𝑐𝑡𝑙𝑦𝑡𝑒𝑟𝑚𝑠
𝐴𝑙𝑙𝑡ℎ𝑒𝑐𝑎𝑛𝑑𝑖𝑑𝑎𝑡𝑒𝑡𝑒𝑟𝑚𝑠
=
𝑇𝑟𝑢𝑒𝑃𝑜𝑠𝑖𝑡𝑖𝑣𝑒𝑠
𝑇𝑟𝑢𝑒𝑃𝑜𝑠𝑖𝑡𝑖𝑣𝑒𝑠+ 𝐹𝑎𝑙𝑠𝑒𝑃𝑜𝑠𝑖𝑡𝑖𝑣𝑒
(1)
𝑅𝑒𝑐𝑎𝑙𝑙= 𝑁𝑢𝑚𝑏𝑒𝑟𝑜𝑓𝑐𝑜𝑟𝑟𝑒𝑐𝑡𝑙𝑦𝑡𝑒𝑟𝑚𝑠
𝐴𝑙𝑙𝑡𝑒𝑟𝑚𝑠𝑖𝑛𝑡ℎ𝑒𝑐𝑜𝑟𝑝𝑢𝑠
=
𝑇𝑟𝑢𝑒𝑃𝑜𝑠𝑖𝑡𝑖𝑣𝑒𝑠
𝑇𝑟𝑢𝑒𝑃𝑜𝑠𝑖𝑡𝑖𝑣𝑒𝑠+ 𝐹𝑎𝑙𝑠𝑒𝑁𝑒𝑔𝑎𝑡𝑖𝑣𝑒
(2)
𝐹1 −𝑠𝑐𝑜𝑟𝑒= 2 · 𝑃𝑟𝑒𝑐𝑖𝑠𝑖𝑜𝑛· 𝑅𝑒𝑐𝑎𝑙𝑙
𝑃𝑟𝑒𝑐𝑖𝑠𝑖𝑜𝑛+ 𝑅𝑒𝑐𝑎𝑙𝑙
(3)
Several ATE systems use the same evaluation approach as the Keyword Extraction task, i.e., they choose top-k best
candidate terms for evaluation (top-100 candidate terms [46, 57], top-300 candidate terms [101], top-500 candidate
16
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
terms [21]). [71] and [111] evaluated the best-k candidate terms by using a variable k. Most of these studies employed
Precision for evaluation of the best-k terms [29, 41, 71, 91, 111].
One notable insight which emerged from our literature review is that the number of studies using just Precision is
higher than the number of studies that evaluate the system according to all three evaluation criteria (i.e., Precision,
Recall, and F1-score). This is due to the relative lack of available gold standard data in the past. However, thanks to
the more recent effort of constructing and manually annotating domain-specific datasets for ATE, most of the current
systems employed on contemporary benchmark datasets (e.g., ACTER) are evaluated according to all three metrics
[87, 88].

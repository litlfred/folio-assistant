---
doc_id: arxiv-2512.09874v3
doc_title: "Benchmarking Document Parsers on Mathematical Formula Extraction from PDFs"
section_id: sec-000-document
section_title: "Document"
section_number: null
pages: 1-16
source_pdf: 2512.09874v3.pdf
source_sha256: 64a6fa7bd984c394
toc_source: outline
---
Benchmarking Document Parsers on
Mathematical Formula Extraction from PDFs
Pius Horn1[0009−0004−1911−1138] and Janis Keuper1,2[0000−0002−1327−1243]
1 Institute for Machine Learning and Analytics (IMLA), Oﬀenburg University,
Oﬀenburg, Germany pius.horn@hs-offenburg.de
2 University of Mannheim, Mannheim, Germany
Abstract. Correctly parsing mathematical formulas from PDFs is crit-
ical for training large language models and building scientiﬁc knowledge
bases from academic literature, yet existing benchmarks either exclude
formulas entirely or lack semantically-aware evaluation metrics. We in-
troduce a benchmarking framework centered on synthetically generated
PDFs with precise LaTeX ground truth, enabling systematic control over
layout, formulas, and content characteristics. For evaluation, we apply
LLM-as-a-judge to assess semantic equivalence of parsed formulas, cap-
turing mathematical meaning beyond surface-level notation diﬀerences.
We validate this approach through a human study (250 formula pairs,
750 ratings from 30 evaluators), showing a Pearson correlation of r=0.78
with human judgment, compared to r=0.34 for character-level match-
ing (CDM) and r≈0 for text similarity. Our robust two-stage matching
pipeline combining LLM-based extraction with fuzzy validation reliably
aligns parsed formulas with ground truth despite format inconsisten-
cies across parsers. Evaluating 20+ contemporary PDF parsers across
100 synthetic documents with 2,000+ formulas reveals signiﬁcant per-
formance disparities, providing actionable guidance for practitioners se-
lecting parsers for downstream applications.
Keywords: PDF Document Parsing · Mathematical Formula Extrac-
tion · LLM-based Evaluation · OCR Benchmarking.
1
Introduction
Text extraction from PDFs is critical for training LLMs and building scientiﬁc
knowledge bases. Major training datasets rely heavily on parsed PDFs: S2ORC
contains 8.1 million PDF-parsed papers (using Grobid [20]) versus only 1.5 mil-
lion with LaTeX sources [19], forming the foundation of scientiﬁc components
in corpora like Dolma [36]. However, parsing quality signiﬁcantly impacts down-
stream performance [35]. Creating a scientiﬁc corpus from 625K papers required
over 5,000 A100 GPU hours solely for correcting PDF parsing errors [16], without
even evaluating formula accuracy. Moreover, parsing limitations have left 80% of
papers from major publishers such as ACM absent from widely-used corpora like
PILE and S2ORC [35]. Beyond LLM training, robust PDF parsing would enable
arXiv:2512.09874v3  [cs.CV]  22 Aug 2026

2
P. Horn and J. Keuper
better knowledge base construction, RAG systems, and semantic search [44],
and could make scientiﬁc content accessible to assistive technologies given that
only 3.2% of scholarly PDFs meet accessibility standards [12]. Despite this im-
pact, systematic evaluation of PDF parsers for mathematical formula extraction
remains understudied.
The diﬃculty of PDF parsing stems from fundamental design characteristics
of the format. PDFs were designed primarily for visual presentation and print-
ing, not semantic content representation. Most PDF documents are untagged and
lack basic high-level logical structural information [6], making content extrac-
tion and reuse particularly challenging. Mathematical formulas are particularly
challenging due to their extensive symbol sets, two-dimensional structure where
spatial positioning conveys meaning (superscripts, subscripts, fractions), and the
need to convert visual arrangements into structured formats like LaTeX [44].
Consequently, no publicly available PDF parser can consistently convert docu-
ments into plain text without errors, especially for mathematical content.
To address this need, a growing number of approaches exist for converting
PDFs to text [44], ranging from classic rule-based parsers to general-purpose
vision-language models (VLMs) and specialized document OCR models. These
approaches diﬀer in model size (aﬀecting hardware requirements and runtime),
accessibility (open versus closed models), and architectural design (rule-based
versus vision-based). Comparative studies have shown that parsing quality varies
signiﬁcantly across diﬀerent document types and content characteristics [1], with
formulas and symbolic expressions posing particular challenges. The choice of
parser is therefore critical for applications such as LLM training and scientiﬁc
knowledge extraction.
Despite the critical importance of parser selection for downstream applica-
tions, systematic benchmarking of PDF parsers for mathematical content ex-
traction remains lacking. This paper addresses this gap through the following
key contributions:
– We introduce a synthetic PDF generation approach with precise ground
truth, overcoming limitations of manually annotated or source-derived bench-
marks.
– We develop an LLM-based matching pipeline that reliably aligns parsed
formulas with ground truth despite parser output inconsistencies.
– We pioneer LLM-as-a-judge for formula evaluation, demonstrating through
human validation on 250 formula pairs (750 ratings from 30 evaluators) that
it captures semantic equivalence more eﬀectively than traditional metrics.
– We provide an open benchmark comprising two datasets: 100 synthetic PDFs
with 2,000+ formulas for evaluation, and the wikipedia-latex-formulas-319k
dataset for formula generation.
– We establish a public leaderboard evaluating 20+ contemporary document
parsers, revealing signiﬁcant performance disparities and providing crucial
guidance for practitioners.
Applying this framework establishes a semantically-aware, reproducible evalua-
tion methodology for mathematical content extraction from PDFs.

Benchmarking Document Parsers on Formula Extraction
3
2
Related Work
2.1
PDF Parsing Benchmarks
Existing PDF parsing benchmarks face systematic limitations in evaluating math-
ematical content. Benchmarks derived from structured sources (e.g., TEX sources
from arXiv [5], XML-to-PDF matching from PubMed [46,45]) achieve large scale
but explicitly exclude formulas, as mathematical content interferes with auto-
mated matching algorithms.
Manually annotated benchmarks oﬀer broader document coverage but vary-
ing formula evaluation capabilities. OmniDocBench [26] (1,355 pages) evaluates
display formulas using image-based character-level comparison, yet must ex-
clude inline formulas as variability in parser output formats renders regex-based
matching to ground truth unreliable. The olmOCR-Bench [29] employs binary
unit tests requiring pixel-perfect rendering equivalence—a strict criterion that
may penalize visually similar yet semantically correct formulas. DocLayNet [28]
(80,863 pages) fragments formulas into ﬁne-grained segments unsuitable for com-
plete extraction evaluation [1], while the OmniAI OCR Benchmark [24] excludes
formulas entirely.
In summary, existing benchmarks face a fundamental trade-oﬀ: structured-
source benchmarks achieve scale but exclude formulas, while manually annotated
benchmarks include formulas but lack semantic evaluation metrics. Our frame-
work addresses this gap through synthetic PDFs with precise ground truth and
semantically-aware assessment.
2.2
Formula Parsing Evaluation Metrics
Evaluating parsed mathematical expressions is a critical challenge in document
parsing. Several datasets provide handwritten mathematical formulas paired
with ground truths in LaTeX and MathML [13,4,42,43,2]. While PDF formulas
are machine-rendered rather than handwritten, the core challenge remains: eﬀec-
tively evaluating parsed formulas against ground truth. A fundamental challenge
is that LaTeX and MathML do not enforce unique representations—semantically
equivalent formulas can be expressed syntactically diﬀerently. This has motivated
three main categories: text-based, tree-based, and image-based metrics.
Text-based metrics such as Levenshtein edit distance [14] and BLEU [27]
have been widely adopted to assess formula parsing accuracy [37,26,9,39].
Tree-based metrics convert LaTeX or MathML into structural represen-
tations for comparison. However, direct tree comparison can be biased due
to this representational ambiguity. More sophisticated structural metrics like
EMERS [34] and unbiased evaluation approaches [3] address this through graph
edit distances or normalized intermediate trees, yet remain sensitive to repre-
sentation ambiguity.
Image-based approaches render both predicted and ground truth formu-
las as images and compute edit distances between vertical slices of the rendered
images [9,39]. However, this approach exhibits signiﬁcant limitations: a single

4
P. Horn and J. Keuper
missing character causes all subsequent positions to be ﬂagged as mismatched,
and extraneous formatting characters can produce large image diﬀerences despite
semantically correct content [37]. The IMEGE metric [3] performs pixel-level
matching between rendered images using a bidirectional image comparison algo-
rithm, permitting small image distortions to account for shifted sub-expressions.
While this addresses non-canonical LaTeX representations, it remains sensitive
to diﬀerences in symbol sizes and visual artifacts.
Finally, CDM (Character Detection Matching) [37] addresses representation
ambiguity through image-based character-level matching rather than direct La-
TeX comparison (see Section 4.3).
3
Methodology
The fundamental idea behind our parser benchmark is to generate synthetic
PDFs, an approach not yet explored in the scientiﬁc literature for PDF parser
evaluation. This approach oﬀers the distinct advantage of having the ground
truth readily available. Furthermore, it provides signiﬁcant ﬂexibility, as both
the PDF’s layout and its content can be precisely controlled. This allows for the
creation of PDFs tailored to ensure that parsing results can be reliably compared
against the ground truth sections using a matching algorithm. Our methodology,
illustrated in Figure 1, consists of three main components: (1) a formula dataset
extracted from Wikipedia, (2) synthetic benchmark PDFs generated with precise
ground truth, and (3) an evaluation pipeline that matches and assesses parsed
formulas.3
3.1
Formula Dataset: Wikipedia Extraction
As the benchmark aims to evaluate the capability of PDF parsers to extract
formulas, the initial step involves creating a dataset composed of formulas. We
sourced this dataset from the English Wikipedia, leveraging the Wikimedia En-
terprise API to access HTML dumps. Wikipedia’s use of LaTeX for rendering
mathematical expressions facilitated the systematic extraction of all embedded
LaTeX formulas. To reﬁne this collection, we ﬁltered formulas using a visual
complexity score computed by counting the total number of LaTeX commands,
letters, digits, operators, brackets, punctuation marks, subscripts, and super-
scripts in each formula. We retained only formulas with scores exceeding eight
to exclude trivial expressions such as “α”, “x2 + 1”, or “R”, and removed du-
plicates. This ﬁltering step, which reduced the dataset by approximately half,
yielded the ﬁnal wikipedia-latex-formulas-319k dataset4, which we contribute as
part of this work and which serves as the data pool from which formulas are
randomly sampled for benchmark PDF generation.
3 Benchmark
framework,
parser
implementations,
and
setup
instructions:
https://github.com/phorn1/pdf-parse-bench
4 https://huggingface.co/datasets/piushorn/wikipedia-latex-formulas-319k

Benchmarking Document Parsers on Formula Extraction
5
Fig. 1. Overview of the three main components of the benchmarking framework.
The formula dataset component extracts and processes mathematical formulas from
Wikipedia to create the wikipedia-latex-formulas-319k collection. The benchmark
dataset component generates synthetic PDFs with precise ground truth by randomly
combining sampled formulas from this dataset with text segments and inline formu-
las using randomly composed LaTeX templates. The evaluation pipeline component
matches parsed text against ground truth using two-stage LLM-based matching and
evaluates all formula pairs.

6
P. Horn and J. Keuper
3.2
Benchmark Dataset: Synthetic PDFs with Ground Truth
Each benchmark PDF is generated by ﬁrst creating a LaTeX template with
randomized layout conﬁgurations, including document class (“article”, “report”,
“book”, etc.), font family, page margins, font size, line spacing, paragraph inden-
tation, and column layout (single or two-column with varying spacing). Subse-
quently, we populate the template with content through an iterative compilation
process designed to produce densely ﬁlled single-page documents.
At each iteration, we randomly select and append one of three content block
types: (1) plain text snippets, (2) text snippets with embedded inline formu-
las, or (3) standalone display formulas. All formulas are randomly sampled from
the wikipedia-latex-formulas-319k dataset. For inline formulas, we enforce a con-
straint that they do not exceed a height of 10 points, as taller formulas would
distort line spacing and compromise visual appearance; formula heights are ver-
iﬁed through compilation before inclusion. Text content is generated using the
Faker library5 in one of four randomly selected languages (English, German,
French, or Spanish) to introduce linguistic diversity.
After appending each content block, we compile the document with pdﬂatex
to detect formatting issues such as content overﬂow or signiﬁcant typesetting
warnings. If compilation reveals such issues, the most recently added block is
replaced with a new randomly selected block. This iterative process continues
until adding further content would exceed the single-page limit.
3.3
Evaluation Pipeline: Formula Matching and Metrics
Challenges in Formula Matching. Establishing a reliable mapping between
ground truth content and parsed output presents signiﬁcant challenges due to
substantial variations in parser output formats. While parsers typically delimit
formulas with standard LaTeX markers such as $$, $, \[, \], \(, or \), the
consistency of this behavior varies considerably across diﬀerent parsing tools.
We observed several systematic issues that complicate automated matching:
First, parsers frequently emit formulas without proper delimiters, particularly
for simple expressions such as “a + b” that can be represented without explicit
LaTeX syntax. Second, multi-column layouts introduce ordering inconsistencies,
as some parsers process content row-wise rather than column-wise, disrupting
the expected sequential arrangement of formulas. Third, parsers sometimes omit
formulas entirely or merge multiple consecutive ground truth formulas into a
single LaTeX environment in the parsed output.
These variations pose critical challenges for rule-based matching approaches
such as those employed by OmniDocBench [26]. Such methods inevitably pro-
duce matching errors, particularly when evaluating parsers with lower output
quality where formula ordering changes, formulas are omitted, or delimiters are
missing. To address these limitations, we develop a more robust matching strat-
egy that can handle the inherent variability in parser outputs.
5 https://github.com/joke2k/faker

Benchmarking Document Parsers on Formula Extraction
7
Robust Two-Stage LLM-Based Matching To address the matching chal-
lenges outlined above, we developed a robust two-stage approach that combines
LLM-based semantic matching with deterministic fuzzy matching validation,
following the principle of turning unstable models into stable systems.
Stage 1: LLM-Based Formula Extraction. We employ GPT-5-mini to extract for-
mulas from the parsed markdown, which we found to provide reliable extraction
quality at modest computational cost. The model receives the ordered ground
truth formulas and the parsed output, and is instructed to identify each match
while maintaining sequential order and extracting formulas verbatim. The struc-
tured output returns a JSON array with extracted formulas (or empty strings if
missing) and ﬂags indicating grouped formulas that require subsequent splitting.
Stage 2: Fuzzy Matching Validation. While the LLM reliably identiﬁes the cor-
rect formula matches, its extractions frequently diﬀer textually from the actual
parsed content due to whitespace variations and minor transcription errors. We
validate each extraction using deterministic fuzzy matching: after attempting
exact substring matching, we normalize both strings by removing whitespace
and backslashes, then use sliding window Levenshtein distance [14] to locate the
best match in the original text. Matches are accepted if within a threshold edit
distance ratio. For formulas that fail validation, we perform a retry with the
remaining text after successful matches have been removed, allowing the LLM
to focus on problematic cases.
This two-stage approach with retry mechanism combines LLM semantic un-
derstanding with deterministic precision, achieving robust formula matching de-
spite format inconsistencies, missing delimiters, and ordering changes that would
break rule-based matching.
4
Assessment of Formula Evaluation Approaches
Evaluating extracted formulas requires metrics that reliably compare parsed
output against ground truth. Beyond commonly considered text similarity met-
rics (BLEU [27], Levenshtein [14]), we examine CDM [37]. We omit pixel-level
metrics (MSE, SSIM, IMEGE), as even slight character misalignments result
in signiﬁcant penalties [37], and olmOCR-Bench’s [29] binary evaluation requir-
ing identical rendering—both overly strict given that semantically equivalent
formulas (a/b vs. a
b , a b vs. ab, ¯x vs. x) render diﬀerently yet convey identical
meaning. In addition to these established metrics, we introduce LLM-as-a-judge
for semantic formula assessment.6
4.1
Human Evaluation as Reference Standard
To establish a reliable reference for evaluating formula extraction quality, we
conducted a human study in which participants assessed rendered formula pairs
6 Code,
data,
and
human
ratings
for
the
metric
study:
https://github.com/phorn1/formula-metric-study

8
P. Horn and J. Keuper
against ground truth for correctness, completeness, and semantic equivalence.
The evaluation dataset comprised 250 pairs of ground truth and parsed formulas
(parsed using Mistral), excluding pairs where both CDM and LLM-as-a-judge
assigned perfect scores, to focus on challenging cases. Thirty participants (PhD
and computer science students) each evaluated 25 pairs on a 0–10 scale, with
each pair assessed by three independent raters; scores were averaged to establish
robust human judgments.
Human evaluation inherently involves subjectivity, as evaluators may inter-
pret correctness or semantic equivalence diﬀerently. To illustrate this variabil-
ity, we identiﬁed examples where raters assigned substantially diﬀerent scores,
demonstrating that scoring is particularly subjective for partially incorrect for-
mulas:
All formula comparison images were generated using the oﬃcial CDM tool,
where green indicates correctly matched symbols and red indicates errors.
Despite this variability, we consider human evaluation a suitable reference
standard for our purposes, as it captures what we prioritize in parser output: cor-
rectness, completeness, and semantic equivalence. The aggregated human judg-
ments thus provide a meaningful basis for validating how well automated metrics
align with these criteria.
4.2
Text-Based Metrics: Inadequacy for Formula Evaluation
Classical text similarity metrics (Normalized Levenshtein Distance, BLEU tok-
enized for LATEX codes) prove inadequate for formula evaluation due to two key
issues: (1) Format Variability—parsers return formulas in LATEX, MathML,
or Unicode plaintext, preventing direct comparison; and (2) Representational
Non-Uniqueness—semantically equivalent formulas have multiple valid rep-
resentations. For instance, \frac{1}{2}, \frac12, and {1 \over 2} all render
as 1
2. Figure 2 conﬁrms no correlation exists between these metrics and human
scores, rendering them unsuitable for formula parsing evaluation.
4.3
CDM: Capabilities and Systematic Limitations
CDM [37] addresses LaTeX representation ambiguity by rendering each formula
token in a unique color, detecting character bounding boxes via image process-
ing, and performing bipartite matching (Hungarian algorithm) based on token
identity, spatial proximity, and sequential order to compute character-level pre-
cision, recall, and F1-score.

Benchmarking Document Parsers on Formula Extraction
9
0
1
2
3
4
5
6
7
8
9
10
Human Scores
0
1
2
3
4
5
6
7
8
9
10
BLEU Score (×10, (ounded)
1
2
2
2
3
1
2
2
2
1
2
1
1
1
6
6
1
1
5
1
4
2
2
1
4
4
6
3
1
2
3
7
2
5
2
2
1
1
2
6
4
4
4
1
3
4
7
1
1
2
11
6
7
4
5
4
3
1
3
3
3
6
3
1
9
6
9
1
1
2
4
1
3
2
7
1
1
1
1
1
1
3
1
1
Corr: 0.014
MAE: 3.072
RMSE: 3.903
BLEU Sco(e (×10, (ounded) ,) Human Sco(e)
(Size = Point Count)
Perfect Agreement
0
1
2
3
4
5
6
7
8
9
10
Human Sco(e)
0
1
2
3
4
5
6
7
8
9
10
Le,en)htein Simila(ity (×10, (ounded)
1
2
1
3
1
3
1
1
2
5
5
1
2
1
1
2
2
2
3
6
6
1
2
4
1
1
2
2
5
7
4
11
3
2
3
7
9
8
4
9
5
5
2
4
2
6
9
4
2
7
5
9
3
5
6
5
6
5
2
1
4
7
1
1
2
2
1
1
2
Corr: -0.155
MAE: 3.056
RMSE: 3.638
Le,en)htein Simila(ity (×10, (ounded) ,) Human Sco(e)
(Size = Point Count)
Perfect Agreement
0
1
2
3
4
5
6
7
8
9
10
Human Sco(e)
0
1
2
3
4
5
6
7
8
9
10
CDM Sco(e) (×10, (ounded)
1
1
1
1
1
1
1
1
1
1
2
1
1
1
3
2
1
3
1
1
1
2
3
1
5
7
5
8
11
9
3
13
5
7
3
6
6
11
16
12
11
9
13
12
1
2
7
11
24
Corr: 0.338
MAE: 2.692
RMSE: 3.517
CDM Sco(e) (×10, (ounded) ,) Human Sco(e)
(Size = Point Count)
Perfect Agreement
0
1
2
3
4
5
6
7
8
9
10
Human Sco(e)
0
1
2
3
4
5
6
7
8
9
10
 pt-5-mini as a Jud e
1
1
1
1
1
3
4
3
6
2
9
12
9
9
11
11
3
7
1
1
2
3
1
1
3
3
1
1
1
1
1
1
1
1
5
5
1
1
3
1
2
1
2
1
1
3
2
2
2
1
1
1
2
2
1
4
1
3
2
6
12
23
42
Corr: 0.776
MAE: 1.696
RMSE: 2.400
 pt-5-mini as a Jud e vs Human Scores
(Size = Point Count)
Perfect Agreement
0
1
2
3
4
5
6
7
8
9
10
Human Sco(e)
0
1
2
3
4
5
6
7
8
9
10
 pt-5 a) a Jud e
1
1
1
4
2
1
1
1
7
9
6
10
7
4
3
2
1
4
5
5
6
8
7
8
2
1
1
4
3
1
1
1
1
1
1
4
6
4
4
1
1
2
1
3
1
4
3
1
2
1
2
2
7
5
12
1
1
3
7
17
34
Corr: 0.779
MAE: 1.556
RMSE: 2.203
 pt-5 a) a Jud e v) Human Sco(e)
(Size = Point Count)
Perfect Agreement
0
1
2
3
4
5
6
7
8
9
10
Human Sco(e)
0
1
2
3
4
5
6
7
8
9
10
mi)t(al-medium-2508 a) a Jud e
1
2
2
1
1
4
2
3
3
1
3
8
6
3
5
2
1
1
2
2
5
4
6
1
1
1
2
2
1
3
3
1
2
3
4
9
6
4
3
2
1
4
7
1
2
5
5
6
17
1
2
5
Corr: 0.774
MAE: 1.506
RMSE: 1.915
mi)t(al-medium-2508 a) a Jud e v) Human Sco(e)
(Size = Point Count)
Perfect Agreement
Fig. 2. Correlation of Automated Metrics with Human Evaluations

10
P. Horn and J. Keuper
While CDM successfully identiﬁes most incorrect or mispositioned symbols,
we observe systematic limitations. CDM produces false positives through (1) per-
fect scores despite structural errors in positional relationships (superscripts/sub-
scripts), and (2) incorrect matching of semantically distinct symbols:
Conversely, CDM produces false negatives in two scenarios: First, when
parsers output Unicode symbols instead of LaTeX commands, which CDM can-
not process. Rule-based tools such as pypdf and pymupdf4llm output Uni-
code symbols exclusively, while some vision-based parsers such as dots.ocr and
Nanonets-OCR-s do so frequently. Second, though rare, CDM fails to recognize
some semantically equivalent LaTeX symbol variants as identical, as shown in
the examples below:
In our human study, CDM demonstrates substantially higher correlation with
human scores than simple text similarity metrics, yet exhibits notably lower cor-
relation than LLM-as-a-judge approaches (Figure 2). This discrepancy likely
arises from two factors: First, CDM treats all character-level errors uniformly,
whereas not all incorrect symbols are equally severe. Second, errors that fun-
damentally alter a formula’s semantic meaning are more strongly penalized by
both human and LLM judges, while CDM’s character-matching approach cannot
distinguish semantically critical errors from minor notation variations.
4.4
LLM-as-a-Judge for Semantic Formula Assessment
We argue that the primary goal when evaluating formulas extracted by PDF
parsers should be to determine whether the semantic meaning of the original
formula in the PDF has been correctly preserved. To address the limitations
of traditional metrics in capturing semantic nuance, we investigated the use of
Large Language Models (LLMs) as evaluators—a technique known as “LLM as
a Judge” that has demonstrated eﬀectiveness across diverse domains [15]. To
the best of our knowledge, this is the ﬁrst application of such an approach for
formula similarity assessment in this context.
We evaluated ﬁve contemporary LLM models (GPT-5, GPT-5-mini, GPT-
5-nano, Gemini-2.5-Flash, and Mistral-Medium-2508), prompting them to score
formula pairs on a 0–10 scale based on correctness, completeness, and semantic
equivalence. As shown in Figure 2, all models exhibited substantially higher Pear-
son correlations with human scores (0.69–0.78) than CDM or text-based metrics,

Benchmarking Document Parsers on Formula Extraction
11
with GPT-5 and GPT-5-mini achieving the strongest correlations (0.78). We se-
lected GPT-5-mini as our evaluation model given its competitive performance
and cost-eﬀectiveness. Although LLM evaluation is not infallible—occasionally
assigning imperfect scores to identically rendered formulas—its correlation with
human judgment (0.78) substantially exceeds that of CDM (0.34), making it a
more suitable metric for evaluating mathematical formula extraction.
5
Experiments and Results
To systematically evaluate parser performance, we generated 100 synthetic PDF
pages using our PDF generation framework, containing 1,411 inline and 641
display formulas. We selected a broad range of parsers, including specialized
OCR models such as DeepSeek-OCR [41], dots.ocr [33], GOT-OCR2.0 [40],
Mathpix [21], MinerU [38], MonkeyOCR [17], Nanonets-OCR-s [23], Mistral
OCR [22], olmOCR [29], PaddleOCR-VL [7], and the modular PP-StructureV3
pipeline [8]. We also evaluated the scientiﬁc document parsers Grobid [20] and
LlamaParse [18], alongside general-purpose multimodal models including Gem-
ini 2.5 Flash and Pro [10], Gemini 3 [11], Qwen3-VL [32], and GPT-5, GPT-
5-mini, and GPT-5-nano [25]. Additionally, we included two rule-based parsers,
pypdf [31] and pymupdf4llm [30], which extract text from the PDF text layer
and cannot process image-based documents.
Processing all 100 pages through each parser yielded over 2,000 formula pairs
per parser, providing robust performance metrics. The evaluation pipeline oper-
ates on standard CPU hardware, with total GPT-5-mini API costs below $10 for
matching and evaluating all 20+ parsers combined, ensuring broad accessibility
and reproducibility. To facilitate reproducibility and enable detailed analysis, we
provide comprehensive documentation: (1) the pdf-parse-bench repository con-
tains implementations and setup instructions for all evaluated parsers, including
exact versions, prompts, and conﬁguration parameters used in our benchmark;
(2) all parsing outputs and evaluation artifacts (matching results, LLM ratings)
are released on Zenodo.7 Table 1 presents the benchmark results, revealing sig-
niﬁcant performance disparities across parsers.
6
Discussion
The benchmark reveals signiﬁcant performance disparities: state-of-the-art vision-
language models (Qwen3-VL, Gemini 3 Pro) and specialized document OCR sys-
tems (PaddleOCR-VL, Mathpix) achieve scores exceeding 9.6, while traditional
rule-based parsers and general-purpose VLMs without document specialization
perform considerably weaker. The leaderboard is dominated by recent 2025 mod-
els, suggesting rapid progress in this domain. However, even parsers with high
overall scores occasionally produce severe parsing errors, though such failures
become increasingly rare among top-performing systems.
7 https://doi.org/10.5281/zenodo.17806191

12
P. Horn and J. Keuper
Table 1. Benchmark results comparing parser performance on mathematical formula
extraction. Score is the average LLM-as-a-Judge rating (0–10 scale) across all formulas,
combining inline and display formulas. Separate scores for inline/display formulas and
CDM metrics are available on the project GitHub page. Params/Cost shows active
parameters for open-source models or API pricing for commercial services (as of De-
cember 2025); note that pricing models vary (per token vs. per page). Inference shows
deployment options.
Rank Parser
Score Params/Cost
Inference
1 Qwen3-VL-235B-A22B-Instruct [32] 9.76
22B
GPU/API
2 Gemini 3 Pro [11]
9.75
$2.00/12.00 M tok
API
3 PaddleOCR-VL [7]
9.65
0.9B
CPU/GPU
4 Mathpix [21]
9.64
$0.005/page
API
5 dots.ocr [33]
9.43
1.7B
GPU
6 PP-StructureV3 [8]
9.34
<0.3B
CPU/GPU
7 Nanonets-OCR-s [23]
9.31
4B
GPU
8 Gemini 2.5 Pro [10]
9.28
$1.25/10.00 M tok
API
9 MonkeyOCR-pro-3B [17]
9.25
3B
GPU
10 MinerU2.5 [38]
9.17
1.2B
CPU/GPU/API
11 olmOCR-2-7B-1025-FP8 [29]
8.94
7B
GPU
12 Gemini 2.5 Flash [10]
8.78
$0.15/0.60 M tok
API
13 Mistral OCR [22]
8.66
$0.001/page
API
14 DeepSeek-OCR [41]
8.55
0.6B
GPU
15 LlamaParse [18]
8.14
$0.09/page
API
16 GPT-5 nano [25]
7.79
$0.05/0.40 M tok
API
17 PyPDF [31]
7.69
—/Free
CPU
18 GOT-OCR2.0 [40]
7.38
0.58B
CPU/GPU
19 PyMuPDF4LLM [30]
6.67
—/Free
CPU
20 GPT-5 mini [25]
6.61
$0.25/2.00 M tok
API
21 GROBID [20]
5.70
—/Free
CPU
Our evaluation methodology demonstrates that semantic assessment captures
formula quality more eﬀectively than traditional metrics. The strong correlation
between LLM-as-a-judge and human judgment validates this approach as suit-
able for evaluating mathematical content extraction, addressing the limitations
of character-level matching which treats all errors uniformly without considering
semantic impact.
Limitations. Synthetic PDFs may not capture all real-world document di-
versity (scanned documents, historical papers, publisher-speciﬁc artifacts), and
our evaluation focuses exclusively on formulas without assessing text, tables, or
complex layouts. While LLM-as-a-judge substantially outperforms traditional
metrics, it is not infallible, occasionally assigning imperfect scores to correct
formulas or missing subtle semantic errors. Additionally, it requires proprietary
models, though evaluation costs remain minimal.
Future Work. The synthetic generation and LLM-based evaluation method-
ology provides a scalable foundation for extending evaluation to additional doc-

Benchmarking Document Parsers on Formula Extraction
13
ument elements (tables, ﬁgures, etc.) while maintaining precise ground truth
control and semantic-aware assessment.
Acknowledgements This work has been supported by the German Federal
Ministry of Research, Technology, and Space (BMFTR) in the program “For-
schung an Fachhochschulen in Kooperation mit Unternehmen (FH-Kooperativ)”
within the joint project LLMpraxis under grant 13FH622KX2.
References
1. Adhikari, N.S., Agarwal, S.: A comparative study of pdf parsing tools across diverse
document categories. arXiv preprint (2025)
2. Aguilar, F.D., Hirata, N.S.: ExpressMatch: A system for creating ground-truthed
datasets of online mathematical expressions. In: Proceedings of the 10th IAPR
International Workshop on Document Analysis Systems (DAS). pp. 155–159 (2012)
3. Alvaro, F., Sánchez, J.A., Benedi, J.M.: Unbiased evaluation of handwritten math-
ematical expression recognition. In: Proceedings of the International Conference on
Frontiers in Handwriting Recognition (ICFHR). pp. 181–186 (2012)
4. Awal, A.M.A.M., Mouchère, H., Viard-Gaudin, C.: Towards handwritten mathe-
matical expressions recognition. In: Proceedings of the 10th International Confer-
ence on Document Analysis and Recognition (ICDAR). pp. 1046–1050 (2009)
5. Bast, H., Korzen, C.: A benchmark and evaluation for text extraction from pdf.
In: Proceedings of the ACM/IEEE Joint Conference on Digital Libraries (JCDL).
pp. 1–10 (2017)
6. Chao, H., Fan, J.: Layout and content extraction for PDF documents. In: Proceed-
ings of the 6th International Workshop on Document Analysis Systems (DAS). pp.
213–224 (2004)
7. Cui, C., Sun, T., Liang, S., Gao, T., Zhang, Z., Liu, J., Wang, X., Zhou, C., Liu, H.,
Lin, M., Zhang, Y., Zhang, Y., Zheng, H., Zhang, J., Zhang, J., Liu, Y., Yu, D., Ma,
Y.: Paddleocr-vl: Boosting multilingual document parsing via a 0.9b ultra-compact
vision-language model. arXiv preprint (2025)
8. Cui, C., Sun, T., Lin, M., Gao, T., Zhang, Y., Liu, J., Wang, X., Zhang, Z., Zhou,
C., Liu, H., Zhang, Y., Lv, W., Huang, K., Zhang, Y., Zhang, J., Zhang, J., Liu,
Y., Yu, D., Ma, Y.: Paddleocr 3.0 technical report. arXiv preprint (2025)
9. Deng, Y., Kanervisto, A., Ling, J., Rush, A.M.: Image-to-markup generation with
coarse-to-ﬁne attention. In: Proceedings of the 34th International Conference on
Machine Learning (ICML). vol. 70, pp. 980–989 (2017)
10. Gemini Team, Google DeepMind: Gemini 2.5: Pushing the frontier with advanced
reasoning, multimodality, long context, and next generation agentic capabilities.
arXiv preprint (2025)
11. Google DeepMind: Gemini 3: Introducing the latest gemini ai model from google.
https://blog.google/products/gemini/gemini-3/ (2025), accessed: 2025-12-01
12. Kumar, A., Wang, L.L.: Uncovering the new accessibility crisis in scholarly PDFs:
Publishing model and platform changes contribute to declining scholarly document
accessibility in the last decade. In: Proceedings of the 26th International ACM
SIGACCESS Conference on Computers and Accessibility (ASSETS) (2024)
13. Labahn, G., Lank, E., MacLean, S., Marzouk, M., Tausky, D.: MathBrush: A
system for doing math on pen-based devices. In: Proceedings of the Eighth IAPR
International Workshop on Document Analysis Systems (DAS). pp. 599–606 (2008)

14
P. Horn and J. Keuper
14. Levenshtein, V.I.: Binary codes capable of correcting deletions, insertions, and
reversals. Soviet Physics Doklady 10(8), 707–710 (1966)
15. Li, H., Dong, Q., Chen, J., Su, H., Zhou, Y., Ai, Q., Ye, Z., Liu, Y.: Llms-as-judges:
A comprehensive survey on llm-based evaluation methods. arXiv preprint (2024)
16. Li, S., Huang, J., Zhuang, J., Shi, Y., Cai, X., Xu, M., Wang, X., Zhang, L., Ke, G.,
Cai, H.: Scilitllm: How to adapt llms for scientiﬁc literature understanding. In: Pro-
ceedings of the Thirteenth International Conference on Learning Representations
(ICLR) (2025)
17. Liu, Y., Yuan, X., Zhang, H., Gao, Z., Zhu, B., Peng, X., Lin, Z., Liu, Q., Jin,
L., Bai, X.: Monkeyocr: Document parsing with a structure-recognition-relation
triplet paradigm. arXiv preprint (2025)
18. LlamaIndex:
LlamaParse:
Genai-native
document
parsing
platform.
https://www.llamaindex.ai/llamaparse (2024), accessed: 2025-12-01
19. Lo, K., Wang, L.L., Neumann, M., Kinney, R., Weld, D.: S2ORC: The semantic
scholar open research corpus. In: Proceedings of the 58th Annual Meeting of the
Association for Computational Linguistics (ACL). pp. 4969–4983 (2020)
20. Lopez, P.: Grobid: Combining automatic bibliographic data recognition and term
extraction for scholarship publications. In: Proceedings of the 13th European Con-
ference on Research and Advanced Technology for Digital Libraries (ECDL). pp.
473–474 (2009)
21. Mathpix, Inc.: Mathpix: Document conversion for stem. https://mathpix.com
(2025), accessed: 2025-11-28
22. Mistral AI: Mistral OCR 25.05: Next-generation document understanding model.
https://mistral.ai/news/mistral-ocr (2025), accessed: 2025-11-28
23. Nano Net Technologies Inc.: Nanonets-OCR-s: Image-to-markdown ocr model.
Hugging
Face
Model,
https://huggingface.co/nanonets/Nanonets-OCR-s
(2025), accessed: 2025-11-28
24. OmniAI Technology, Inc.: Omni OCR Benchmark. Hugging Face Dataset,
https://huggingface.co/datasets/getomni-ai/ocr-benchmark
(2025),
ac-
cessed: 2025-11-17
25. OpenAI:
GPT-5:
Openai’s
next
generation
language
model.
https://openai.com/index/introducing-gpt-5/
(2025),
accessed:
2025-12-
01
26. Ouyang, L., Qu, Y., Zhou, H., Zhu, J., Zhang, R., Lin, Q., Wang, B., Zhao, Z.,
Jiang, M., Zhao, X., Shi, J., Wu, F., Chu, P., Liu, M., Li, Z., Xu, C., Zhang, B., Shi,
B., Tu, Z., He, C.: Omnidocbench: Benchmarking diverse pdf document parsing
with comprehensive annotations. In: Proceedings of the IEEE/CVF Conference on
Computer Vision and Pattern Recognition (CVPR). pp. 24838–24848 (2025)
27. Papineni, K., Roukos, S., Ward, T., Zhu, W.J.: BLEU: A method for automatic
evaluation of machine translation. In: Proceedings of the 40th Annual Meeting of
the Association for Computational Linguistics (ACL). pp. 311–318 (2002)
28. Pﬁtzmann, B., Auer, C., Dolﬁ, M., Nassar, A.S., Staar, P.: Doclaynet: A large
human-annotated dataset for document-layout analysis. In: Proceedings of the 28th
ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD). pp.
3743–3751 (2022)
29. Poznanski, J., Soldaini, L., Lo, K.: olmocr 2: Unit test rewards for document ocr.
arXiv preprint (2025)
30. PyMuPDF Contributors: PyMuPDF4LLM: Pdf extraction for large language mod-
els. GitHub repository, https://github.com/pymupdf/PyMuPDF4LLM (2025), ac-
cessed: 2025-12-01

Benchmarking Document Parsers on Formula Extraction
15
31. pypdf Contributors: pypdf: A pure-python pdf library. GitHub repository,
https://github.com/py-pdf/pypdf (2025), accessed: 2025-12-01
32. Qwen Team: Qwen3-vl technical report. arXiv preprint (2025)
33. RedNote HiLab: dots.ocr: Multilingual document layout parsing. GitHub reposi-
tory, https://github.com/rednote-hilab/dots.ocr (2025), accessed: 2025-11-28
34. Sain, K., Dasgupta, A., Garain, U.: EMERS: A tree matching-based performance
evaluation of mathematical expression recognition systems. International Journal
on Document Analysis and Recognition (IJDAR) 14(1), 75–85 (2011)
35. Siebenschuh, C., Hippe, K., Gokdemir, O., Brace, A., Khan, A.M., Hossain, K.,
Babuji, Y., Chia, N., Vishwanath, V., Ramanathan, A., et al.: Adaparse: An adap-
tive parallel pdf parsing and resource scaling engine. In: Proceedings of the 8th
Annual Conference on Machine Learning and Systems (MLSys) (2025)
36. Soldaini, L., Kinney, R., Bhagia, A., Schwenk, D., Atkinson, D., Authur, R., Bogin,
B., Chandu, K., Dumas, J., Elazar, Y., Hofmann, V., Jha, A., Kumar, S., Lucy, L.,
Lyu, X., Lambert, N., Magnusson, I., Morrison, J., Muennighoﬀ, N., Naik, A., Nam,
C., Peters, M., Ravichander, A., Richardson, K., Shen, Z., Strubell, E., Subramani,
N., Tafjord, O., Walsh, E., Zettlemoyer, L., Smith, N., Hajishirzi, H., Beltagy, I.,
Groeneveld, D., Dodge, J., Lo, K.: Dolma: an open corpus of three trillion tokens for
language model pretraining research. In: Proceedings of the 62nd Annual Meeting
of the Association for Computational Linguistics (ACL). pp. 15725–15788 (2024)
37. Wang, B., Wu, F., Ouyang, L., Gu, Z., Zhang, R., Xia, R., Shi, B., Zhang, B., He,
C.: Image over text: Transforming formula recognition evaluation with character
detection matching. In: Proceedings of the IEEE/CVF Conference on Computer
Vision and Pattern Recognition (CVPR). pp. 19681–19690 (2025)
38. Wang, B., Xu, C., Zhao, X., Ouyang, L., Wu, F., Zhao, Z., Xu, R., Liu, K., Qu, Y.,
Shang, F., Zhang, B., Wei, L., Sui, Z., Li, W., Shi, B., Qiao, Y., Lin, D., He, C.:
Mineru: An open-source solution for precise document content extraction. arXiv
preprint (2024)
39. Wang, Z., Liu, J.C.: Translating math formula images to LaTeX sequences us-
ing deep neural networks with sequence-level training. International Journal on
Document Analysis and Recognition (IJDAR) 24(1), 63–75 (2021)
40. Wei, H., Kong, L., Chen, J., Zhao, L., Sun, Z., Zhang, J., Peng, C., Shen, Y., Mao,
X., Xu, Z., et al.: General ocr theory: Towards ocr-2.0 via a uniﬁed end-to-end
model. arXiv preprint (2024)
41. Wei, H., Sun, Y., Li, Y.: Deepseek-ocr: Contexts optical compression. arXiv
preprint (2025)
42. Xie, Y., Mouchère, H., Simistira Liwicki, F., Rakesh, S., Saini, R., Nakagawa, M.,
Nguyen, C.T., Truong, T.N.: ICDAR 2023 CROHME: Competition on recognition
of handwritten mathematical expressions. In: Proceedings of the 17th International
Conference on Document Analysis and Recognition (ICDAR). pp. 553–565 (2023)
43. Yuan, Y., Liu, X., Dikubab, W., Liu, H., Ji, Z., Wu, Z., Bai, X.: Syntax-aware
network for handwritten mathematical expression recognition. In: Proceedings of
the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR).
pp. 4543–4552 (2022)
44. Zhang, Q., Wang, B., Huang, V.S.J., Zhang, J., Wang, Z., Liang, H., He, C.,
Zhang, W.: Document parsing unveiled: Techniques, challenges, and prospects for
structured information extraction. arXiv preprint (2025)
45. Zhong, X., ShaﬁeiBavani, E., Jimeno Yepes, A.: Image-based table recognition:
Data, model, and evaluation. In: Proceedings of the European Conference on Com-
puter Vision (ECCV). pp. 564–580 (2020)

16
P. Horn and J. Keuper
46. Zhong, X., Tang, J., Yepes, A.J.: Publaynet: Largest dataset ever for document lay-
out analysis. In: Proceedings of the International Conference on Document Analysis
and Recognition (ICDAR). pp. 1015–1022 (2019)

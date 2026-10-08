---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-024-discussion
section_title: "Discussion"
section_number: null
pages: 26-33
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
In this paper, we proposed debiased inference with multiple imperfect measurements (DMM), a
framework to conduct valid downstream inference without gold-standard labels. Under the condi-
tional independence assumption given the latent variable and any observed features of annotation
tasks, such as annotation difficulty, captured by text embeddings, DMM identifies the conditional
classification rate model required for valid downstream inference. Importantly, individual measure-
ments may remain systematically biased, differ substantially in accuracy, and exhibit error rates
that vary across units.
By allowing the (mis)classification rate model to depend on input- and
annotation-level information, our framework makes the conditional independence assumption more
26
DMM
DSL (500 expert labels)
Naive: Llama−4 0−shot
(F1: 0.949)
Naive: GPT−4 5−shot
(F1: 0.942)
Naive: GPT−4.1 5−shot
(F1: 0.944)
Expert−label benchmark
−2.5
−2.0
−1.5
−1.0
−0.5
0.0
Prefecture−wrongdoing coefficient
Points and 95% confidence intervals
(a) Full−sample estimates
0.978
0.572
0.154
0.430
0.862
0.981
DMM
DSL (500 expert labels)
Naive: Llama−4 0−shot
(F1: 0.949)
Naive: GPT−4 5−shot
(F1: 0.942)
Naive: GPT−4.1 5−shot
(F1: 0.944)
Expert−label benchmark
0
.25
.50
.75
.95
Fixed−target coverage
Intervals covering the fixed expert target
(b) Empirical coverage
Figure 2: Pan and Chen (2018) empirical estimates and coverage. Panel (a) reports coefficient
estimates and 95% confidence intervals; the dashed line marks the full-sample expert-label bench-
mark. DMM uses no gold-standard labels, whereas DSL uses 500. Panel (b) reports the proportion
of intervals covering the fixed expert benchmark over 500 bootstrap resamples.
plausible and its substantive implications more transparent. We also provide practical guidance for
designing measurement procedures that support this assumption and for assessing its plausibility in
applied settings.
Our main methodological contribution is to connect the multiple measurement model to general
downstream analyses covering both settings in which the latent variable is either an independent or a
dependent variable. We construct a robust bridge whose conditional expectation recovers the latent
indicator and use it to reproduce the oracle full-data moment function. By carefully designing how
the multiple measurements are combined within the bridge, we show that the resulting construction
is robust to misspecification of any one label-specific nuisance model. Combined with cross-fitting,
this yields a consistent and asymptotically normal estimator under standard product-rate conditions,
allowing the nuisance estimators to converge at slow nonparametric rates n−1/4 while preserving root-
n inference for the downstream parameter. We also discuss extensions to multicategory variables
under the corresponding rank conditions.
Our method accommodates any number of imperfect measurements, from as few as three to
much larger collections, allowing researchers to adapt the measurement design to different annota-
tion budgets and settings. The framework also clarifies how the number and quality of the available
measurements affect statistical precision. Adding sufficiently informative measurements can reduce
the measurement-induced component of the asymptotic variance, bringing DMM closer in efficiency
to the oracle estimator. However, precision does not improve mechanically with the number of mea-
surements: low-quality measurements can yield unstable bridges and offset the gains from averaging
over a larger collection.
We present simulation and empirical validation studies to demonstrate the performance of DMM.
Using Monte Carlo simulations calibrated to data from Fowler et al. (2021), we show that DMM
exhibits small bias and achieves nominal coverage across different numbers of labels, whereas naive
estimators directly using imperfect labels remain biased and exhibit undercoverage even when indi-
vidual proxies have high F1 scores. The empirical validation study based on Pan and Chen (2018)
provides a complementary illustration using real LLM annotations. DMM produces an estimate and
27
confidence interval close to the oracle benchmark without using expert labels in settings where the
conditional independence assumption is not guaranteed to hold, as in many applications.
The main limitation of DMM is that it requires the conditional independence assumption about
measurement errors, even though we made it much more plausible than the classical counterpart by
allowing for a rich conditioning set. Conditional independence is not guaranteed by high classification
accuracy and may be violated when annotations interact with omitted features of the input. We
therefore devote substantial attention to how these concerns can be mitigated and assessed in practice.
In Section 5, we discuss designing measurement systems with diverse annotators (either human or
machine), conditioning on input- and annotation-level information that may explain common errors,
and examining subset stability and other observable implications of the fitted measurement model.
When a limited validation sample is available, it can additionally be used to assess the conditional
independence assumption and to combine DMM with the design-based bias correction of DSL.
More broadly, DMM and validation-based approaches should be viewed as complementary strate-
gies. DMM is particularly useful when multiple measurements are expected to have reasonably high
accuracy while they still have non-random, nonclassical measurement errors. Even when measure-
ment errors are small, unless corrected carefully with DMM, they can induce substantial bias and
invalidate downstream inference. Bias-correction methods using validation data, such as DSL and
PPI, are preferable when gold-standard labels can be collected, and the conditional independence
assumption is less credible even after conditioning on rich annotation-level variables.
28
References
Allman, Elizabeth S., Catherine Matias and John A. Rhodes. 2009. “Identifiability of Parameters in
Latent Structure Models with Many Observed Variables.” The Annals of Statistics 37(6A):3099–
3132.
Anandkumar, Animashree, Rong Ge, Daniel Hsu, Sham M Kakade and Matus Telgarsky. 2014.
“Tensor decompositions for learning latent variable models.” Journal of Machine Learning Research
15(1):2773–2832.
Angelopoulos, Anastasios N, John C Duchi and Tijana Zrnic. 2023. “PPI++: Efficient prediction-
powered inference.” arXiv preprint arXiv:2311.01453 .
Angelopoulos, Anastasios N, Stephen Bates, Clara Fannjiang, Michael I. Jordan and Tijana Zrnic.
2023. “Prediction-powered inference.” Science 382(6671):669–674.
Battaglia, Laura, Timothy Christensen, Stephen Hansen and Szymon Sacher. 2024. “Inference for
Regression with Variables Generated by AI or Machine Learning.” arXiv preprint arXiv:2402.15585
.
Baumann, Joachim, Paul Röttger, Aleksandra Urman, Albert Wendsjö, Flor Miriam Plaza-del Arco,
Johannes B Gruber and Dirk Hovy. 2025.
“Large Language Model Hacking: Quantifying the
Hidden Risks of Using LLMs for Text Annotation.” arXiv preprint arXiv:2509.08825 .
Bonhomme, Stéphane, Koen Jochmans and Jean-Marc Robin. 2016. “Estimating multivariate latent-
structure models.” The Annals of Statistics 44(2):540–563.
Bouyamourn, Adam and Arthur Spirling. 2026. “Interpretable Aggregation of Correlated LLM Anno-
tations.” Manuscript presented at the 2026 Annual Meeting of the Society for Political Methodology.
Buja, Andreas, Lawrence Brown, Richard Berk, Edward George, Emil Pitkin, Mikhail Traskin, Kai
Zhang and Linda Zhao. 2019. “Models as Approximations I.” Statistical Science 34(4):523–544.
Carlson, Jacob and Melissa Dell. 2025. “A Unifying Framework for Robust and Efficient Inference
with Unstructured Data.” arXiv preprint arXiv:2505.00282 .
Carroll, J Douglas and Jih-Jie Chang. 1970. “Analysis of individual differences in multidimensional
scaling via an N-way generalization of “Eckart-Young” decomposition.” Psychometrika 35(3):283–
319.
Chaudhuri, Kamalika, Sham M. Kakade, Karen Livescu and Karthik Sridharan. 2009. Multi-view
clustering via canonical correlation analysis. In Proceedings of the 26th Annual International Con-
ference on Machine Learning. pp. 129–136.
Chen, Xiaohong, Ashesh Rambachan and Elie Tamer. 2026.
“Partial Identification from LLM
Prompts.” arXiv preprint arXiv:2606.15031 .
Chen, Xiaohong and Demian Pouzo. 2012. “Estimation of nonparametric conditional moment models
with possibly nonsmooth generalized residuals.” Econometrica 80(1):277–321.
Chen, Xiaohong, Han Hong and Alessandro Tarozzi. 2008.
“Semiparametric Efficiency in GMM
Models with Auxiliary Data.” Annals of Statistics .
29
Chen, Xiaohong, Han Hong and Denis Nekipelov. 2011. “Nonlinear models of measurement errors.”
Journal of Economic Literature 49(4):901–937.
Chen, Yi-Hau and Hung Chen. 2000. “A Unified Approach to Regression Analysis under Double-
Sampling Designs.” Journal of the Royal Statistical Society: Series B (Statistical Methodology)
62(3):449–460.
Chernozhukov, Victor, Denis Chetverikov, Mert Demirer, Esther Duflo, Christian Hansen, Whitney
Newey and James Robins. 2018. “Double/Debiased Machine Learning for Treatment and Structural
Parameters.” Econometrics Journal 21:C1 – C68.
Chernozhukov, Victor, Juan Carlos Escanciano, Hidehiko Ichimura, Whitney K Newey and James M
Robins. 2022. “Locally robust semiparametric estimation.” Econometrica 90(4):1501–1535.
Dawid, Alexander Philip and Allan M Skene. 1979. “Maximum likelihood estimation of observer
error-rates using the EM algorithm.” Journal of the Royal Statistical Society: Series C (Applied
Statistics) 28(1):20–28.
Dempster, Arthur P, Nan M Laird and Donald B Rubin. 1977. “Maximum likelihood from incom-
plete data via the EM algorithm.” Journal of the Royal Statistical Society: Series B (Statistical
Methodology) 39(1):1–38.
Egami, Naoki and Eric J Tchetgen Tchetgen. 2024. “Identification and Estimation of Causal Peer
Effects Using Double Negative Controls for Unmeasured Network Confounding.” Journal of the
Royal Statistical Society Series B: Statistical Methodology 86(2):487–511.
Egami, Naoki, Musashi Hinck, Brandon M Stewart and Hanying Wei. 2026. “Using large language
model annotations for the social sciences: A general framework of using predicted variables in
downstream analyses.” American Journal of Political Science .
Egami, Naoki, Musashi Hinck, Brandon Stewart and Hanying Wei. 2023. “Using imperfect surrogates
for downstream inference: Design-based supervised learning for social science applications of large
language models.” Advances in Neural Information Processing Systems 36:68589–68601.
Fowler, Erika Franklin, Michael M. Franz, Gregory J. Martin, Zachary Peskowitz and Travis N. Rid-
out. 2021. “Political Advertising Online and Offline.” American Political Science Review 115(1):130–
149.
Gilardi, Fabrizio, Meysam Alizadeh and Maël Kubli. 2023. “ChatGPT Outperforms Crowd Workers
for Text-Annotation Tasks.” Proceedings of the National Academy of Sciences 120(30):e2305016120.
Goodman, Leo A. 1974. “Exploratory latent structure analysis using both identifiable and unidenti-
fiable models.” Biometrika 61(2):215–231.
Guo, Helen, AmirEmad Ghassami, Ilya Shpitser and Elizabeth L Ogburn. 2026. “Proximal Causal
Inference for Hidden Outcomes.” arXiv preprint arXiv:2605.09849 .
Hall, Peter and Xiao-Hua Zhou. 2003. “Nonparametric estimation of component distributions in a
multivariate mixture.” The Annals of Statistics 31(1):201–224.
Halterman, Andrew and Katherine A Keith. 2026. “Codebook LLMs: Evaluating LLMs as Measure-
ment Tools for Political Science Concepts.” Political Analysis 34(2):188–204.
30
Hansen, Stephen, Peter John Lambert, Nicholas Bloom, Steven J Davis, Raffaella Sadun and Bledi
Taska. 2023. Remote Work across Jobs, Companies, and Space. Technical report National Bureau
of Economic Research.
Harshman, Richard A. 1970. “Foundations of the PARAFAC procedure: Models and conditions for
an “explanatory” multi-modal factor analysis.” UCLA working papers in phonetics 16(1):84.
Hu, Yingyao. 2008. “Identification and estimation of nonlinear models with misclassification error
using instrumental variables: A general solution.” Journal of Econometrics 144(1):27–61.
Hu, Yingyao and Susanne M Schennach. 2008.
“Instrumental variable treatment of nonclassical
measurement error models.” Econometrica 76(1):195–216.
Katsumata, Hiroto and Soichiro Yamauchi. 2023. “Statistical Analysis with Machine Learning Pre-
dicted Variables.” Working Paper .
Kim, Elliot, Avi Garg, Kenny Peng and Nikhil Garg. 2025. “Correlated Errors in Large Language
Models.” arXiv preprint arXiv:2506.07962 .
Kruskal, Joseph B. 1977. “Three-way arrays: rank and uniqueness of trilinear decompositions, with
application to arithmetic complexity and statistics.” Linear Algebra and its Applications 18(2):95–
138.
Kuroki, Manabu and Judea Pearl. 2014. “Measurement bias and effect restoration in causal inference.”
Biometrika pp. 423–437.
Ludwig, Jens, Sendhil Mullainathan and Ashesh Rambachan. 2026. “Large Language Models: An
Applied Econometric Framework.” Annual Review of Economics 18.
Miao, Wang, Zhi Geng and Eric J Tchetgen Tchetgen. 2018. “Identifying causal effects with proxy
variables of an unmeasured confounder.” Biometrika 105(4):987–993.
Mozer, Reagan and Luke Miratrix. 2023. Decreasing the human coding burden in randomized trials
with text-based outcomes via model-assisted impact analysis. In 2023 IMS International Confer-
ence on Statistics and Data Science (ICSDS). p. 520.
Nakamura, Kentaro. 2025. “Surrogate Representation Inference for Text and Image Annotations.”
arXiv preprint arXiv:2509.12416 .
Pan, Jennifer and Kaiping Chen. 2018.
“Concealing Corruption: How Chinese Officials Distort
Upward Reporting of Online Grievances.” American Political Science Review 112(3):602–620.
Raykar, Vikas C, Shipeng Yu, Linda H Zhao, Gerardo Hermosillo Valadez, Charles Florin, Luca
Bogoni and Linda Moy. 2010. “Learning from crowds.” Journal of Machine Learning Research
11(43):1297–1322.
Robins, James M, Andrea Rotnitzky and Lue Ping Zhao. 1994. “Estimation of Regression Coefficients
When Some Regressors Are Not Always Observed.” Journal of the American Statistical Association
89(427):846–866.
Schennach, Susanne. 2022. “Measurement systems.” Journal of Economic Literature 60(4):1223–1263.
Schennach, Susanne M. 2016. “Recent advances in the measurement error literature.” Annual Review
of Economics 8(1):341–377.
31
Shen, Xiaotong. 1997. “On methods of sieves and penalization.” The Annals of Statistics pp. 2555–
2591.
Spirling, Arthur. 2023. “Why Open-Source Generative AI Models Are An Ethical Way Forward For
Science.” Nature 616(7957):413–413.
Stegeman, Alwin and Nicholas D Sidiropoulos. 2007. “On Kruskal’s uniqueness condition for the
Candecomp/Parafac decomposition.” Linear Algebra and its Applications 420(2-3):540–552.
Van der Vaart, Aad W. 2000. Asymptotic Statistics. Vol. 3 Cambridge University Press.
Vansteelandt, Stijn and Oliver Dukes. 2022.
“Assumption-lean Inference for Generalised Linear
Model Parameters.” Journal of the Royal Statistical Society: Series B (Statistical Methodology)
84(3):657–685.
Wang, Siruo, Tyler H McCormick and Jeffrey T Leek. 2020. “Methods for Correcting Inference Based
on Outcomes Predicted by Machine Learning.” Proceedings of the National Academy of Sciences
117(48):30266–30275.
Yang, Eddie and Dashun Wang. 2026. “Benchmark Illusion: Disagreement among LLMs and Its
Scientific Consequences.” arXiv preprint arXiv:2602.11898 .
Zhang, Yuchen, Xi Chen, Dengyong Zhou and Michael I. Jordan. 2016. “Spectral methods meet
EM: A provably optimal algorithm for crowdsourcing.” Journal of Machine Learning Research
17(102):1–44.
Zhou, Ying and Eric Tchetgen Tchetgen. 2024. “Causal inference for a hidden treatment.” arXiv
preprint arXiv:2405.09080 .
Ziems, Caleb, William Held, Omar Shaikh, Jiaao Chen, Zhehao Zhang and Diyi Yang. 2024. “Can
Large Language Models Transform Computational Social Science?”
Computational Linguistics
50(1):237–291.
32
A

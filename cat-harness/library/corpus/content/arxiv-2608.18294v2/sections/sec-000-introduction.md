---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 2-5
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
One of the most common applications of AI in the social sciences has been in measurement. Re-
searchers have used AI to measure a wide range of variables, such as sentiment, tone, topics (e.g.,
Gilardi, Alizadeh and Kubli, 2023; Ziems et al., 2024), protests, political violence (e.g., Halterman
and Keith, 2026), and job types (e.g., Hansen et al., 2023), among others. Such measurement tasks
are only the first step. Scholars often use learned measurements as key variables of interest in down-
stream analyses. For example, Pan and Chen (2018) annotate whether each online post accuses
local Chinese officials of corruption so that they can later study whether and how much such online
complaints are censored. Fowler et al. (2021) annotate the tone of political ads and then analyze
how politicians strategically change the tone of political advertising online and offline.
When using such AI-measured variables in downstream analyses, it might be tempting to ignore
measurement errors—the unknown and heterogeneous mismatch between the gold-standard label
and the AI measurements—and analyze such variables as if they were observed without errors.
However, recent papers theoretically and empirically demonstrate that ignoring errors in the first-
stage measurement step can lead to substantial bias and invalid confidence intervals, even if the
accuracy of the AI measurement is high, e.g., 90%. This is because such measurement errors are
non-random and nonclassical and correlated with observed and unobserved variables that matter in
downstream inference (Schennach, 2016; Wang, McCormick and Leek, 2020; Egami et al., 2023). In
practice, this means that researchers can get substantively and statistically different results if they
choose slightly different measurement methods, such as large language model (LLM) annotations
with different prompts, temperature, and so on (e.g., Baumann et al., 2025; Yang and Wang, 2026).
These biases can also limit the replicability of research based on AI-based measurements (Spirling,
2023), as many AI models that are currently the state of the art will be deprecated in the near future.
A popular existing solution is to combine a small number of gold-standard labels with error-prone
AI-based measures via a doubly robust procedure (Robins, Rotnitzky and Zhao, 1994; Chernozhukov
et al., 2018). Widely used variants include design-based supervised learning (DSL; Egami et al.,
2023), prediction-powered inference (PPI; Angelopoulos et al., 2023), and MAR-S (Carlson and Dell,
2025). They assume that researchers control the process through which each unit is sampled for gold-
standard labeling (often simple random sampling but can also accommodate unequal sampling based
on observed features). The key strength is that these methods make no assumptions about errors in
AI-based measures. However, the biggest requirement is that they need high-quality gold-standard
labels as the validation data, which might be costly and difficult to obtain in some application areas.
In this paper, we propose a framework of debiased inference with multiple imperfect measurements
(DMM) that combines three or more imperfect measurements in place of gold-standard labels to
conduct valid downstream inference with AI-generated data. For identification, we build on the long-
standing literature on nonparametric latent variable models and CP decomposition (Kruskal, 1977;
Hu, 2008; Allman, Matias and Rhodes, 2009). The classical conditional independence assumption in
this literature (Dawid and Skene, 1979) assumes that multiple imperfect measurements, also known
as proxies, are independent conditional on the true latent variable. This assumption is weaker than
assuming that proxies have no measurement error and allows misclassification rates to vary across
proxies. However, it does not allow for any shared source of errors (e.g., some documents might be
more difficult to annotate for every LLM; Chen, Rambachan and Tamer, 2026). We instead assume
that multiple proxies are independent conditional not only on the unobserved true labels but also on
any observed features of each annotation task, such as the complexity and difficulty of texts captured
by rich text embeddings. This assumption allows for unknown misclassification rates to vary not only
across measurement methods (e.g., different LLMs) but also across units (e.g., texts). Our approach
allows proxies to share sources of errors as long as such common causes are captured by conditioning
2
variables, which can include rich text representation, for example. Importantly, if researchers wish to
avoid assuming access to gold-standard labels, they have to make some assumptions about proxies,
and our paper makes this assumption explicit and transparent. Recognizing its importance, Section 5
offers a series of strategies to make the conditional independence assumption more plausible and to
statistically evaluate the observational implications of this assumption.
For estimation and inference, the proposed DMM estimator builds on semiparametric causal
inference, in particular Zhou and Tchetgen Tchetgen (2024) and Guo et al. (2026), to perform debi-
ased downstream inference. Simply estimating the finite mixture model (or variants of the Dawid-
Skene model (Dawid and Skene, 1979) or Kruskal decomposition (Kruskal, 1977; Allman, Matias and
Rhodes, 2009)) and including the learned latent variables directly in downstream inference is not
sufficient. We need to use a tailored debiased moment estimator to achieve Neyman orthogonality
(Chernozhukov et al., 2018) and allow for slow convergence rates of the estimation of conditional
classification rate models, which are nuisance functions for downstream inference. The proposed
DMM estimator is consistent and asymptotically normal, and its corresponding confidence interval
is valid, under the conditional independence assumption and mild assumptions about convergence
rates of the nuisance functions. By extending the existing literature, we allow for (a) a wide range
of downstream analyses common in the social and biomedical sciences that can be written as the
moment estimator (e.g., most maximum likelihood estimators); (b) settings where an error-prone
variable is either a dependent or independent categorical variable in downstream analyses, and (c)
more than three imperfect measurements (and their implications for efficiency).
Thinking broadly, our proposed method and existing approaches based on gold-standard labels
are complementary. The proposed DMM makes no assumption about the gold-standard labels but
makes stronger assumptions about measurement errors in AI, whereas methods using validation data,
such as DSL (Egami et al., 2023) and PPI (Angelopoulos et al., 2023), make no assumption about
measurement errors in AI but assume access to gold-standard labels. Which method is more appro-
priate depends on applications, and we discuss when and how to combine these two methods.
Our contributions can be summarized in three points.
1. Exploiting Multiple Imperfect Measurements in Place of Gold-Standard Labels:
We develop a method that combines multiple proxies to conduct valid downstream inference
for AI-generated data, without assuming access to gold-standard labels. This is in contrast to
existing bias-correction methods, such as DSL and PPI, that rely on gold-standard data.
2. General Applicability: We extend existing theoretical results by allowing for (a) a wide range
of downstream analyses common in practice, including linear regression, logistic regression,
and most maximum likelihood estimators, (b) settings where an error-prone variable is either a
dependent or independent categorical variable in downstream analyses, and (c) more than three
proxies (e.g., more than three annotation methods). This general applicability is fundamental
to support diverse downstream analyses conducted in empirical sciences.
3. Application to LLM annotations: While the method itself is applicable for downstream
inference with any error-prone variables, we specifically focus on the most common applications
of LLM annotations for AI-generated data. In particular, we discuss (a) how to make the con-
ditional independence assumption more plausible by carefully choosing conditioning variables
(e.g., estimated task difficulty and text embeddings), proxies (e.g., different families of LLMs),
and prompts (e.g., randomly selecting different prompts for each LLM); (b) how to use more
than three proxies to perform the overidentification test of the conditional independence as-
sumption, and (c) how to combine DMM and DSL in a special case where some gold-standard
labels are also available.
3
After describing related work, we formally characterize the problem setting and existing methods
(Section 2). In Section 3, we describe our proposed method and prove its theoretical properties.
Here, for the sake of clear presentation, we focus on settings where an error-prone measurement is
an independent variable in downstream analysis. We start with nonparametric identification and
then derive asymptotic statistical properties of the DMM estimator in estimation and inference. In
Section 4, we extend the framework to settings in which the annotated construct is a binary depen-
dent variable and then discuss the most general case where a multicategory label can be either a
dependent or independent variable. In Section 5, we come back to the core assumption of condi-
tional independence and discuss how to make the assumption more plausible in practice. We also
develop a series of statistical diagnostic tools to assess the conditional independence assumption.
In Section 6, we provide extensive simulation and empirical validation studies to demonstrate the
statistical properties of DMM. Section 7 concludes with a discussion.
Related literature
AI-Generated Data.
With recent advances in AI and LLMs, a growing literature develops meth-
ods for valid downstream inference using AI- or machine-learning-generated measurements together
with a gold-standard validation sample. Popular examples include design-based supervised learn-
ing (Egami et al., 2023, 2026), prediction-powered inference (Angelopoulos et al., 2023), methods
reviewed in Ludwig, Mullainathan and Rambachan (2026), MAR-S (Carlson and Dell, 2025), model-
assisted impact analysis (Mozer and Miratrix, 2023), and related control-variate approaches (Kat-
sumata and Yamauchi, 2023). They combine predictions available at scale with a smaller number of
gold-standard labels to bias-correct downstream inference. All of these methods build on the long-
standing literature on semiparametric inference and causal inference (e.g., Robins, Rotnitzky and
Zhao, 1994; Chen and Chen, 2000; Chen, Hong and Tarozzi, 2008; Chernozhukov et al., 2018). These
methods assume access to gold-standard labels and knowledge of their sampling design, whereas
DMM does not require such gold-standard labels.
There are several recent papers that relax the assumption of gold-standard labels.
Battaglia
et al. (2024) assume a new asymptotic regime where measurement errors and sampling errors are
comparable and decrease as sample size grows. They use partial validation data where one only
observes the gold-standard labels and error-prone AI measurements instead of the full validation
where researchers need to observe not only the gold-standard labels and AI measurements but also
all the downstream variables for each unit.
Chen, Rambachan and Tamer (2026) derive bounds
on latent label prevalence and regression coefficients from panels of LLM reports under externally
calibrated score and event restrictions (e.g., reporter-specific accuracy restrictions), while allowing
arbitrary dependence across reports conditional on the latent truth.
DMM complements these approaches by identifying the latent variable through the established
array decomposition of multiple imperfect measurements.
Compared to the classical conditional
independence assumption (e.g., Dawid and Skene, 1979) that only conditions on the true unobserved
label and does not allow for any shared source of errors across multiple measurements, our conditional
independence assumption explicitly allows for conditioning on a rich set of covariates that may contain
observed or derived characteristics of the input (e.g., writing style, text length, language, or image
quality) measured by rich text embeddings. Recognizing the importance of the assumption, we also
develop a series of statistical diagnostics in Section 5. We also find that DMM performs well in our
empirical validation study in Section 6 where the conditional independence assumption holds only
approximately.
4
Repeated Measurement Identification.
Our work also builds on the literature on identifying
latent variables from conditionally independent repeated measurements. A large classical measure-
ment error literature assumes an additive error that is independent of the latent variable and mean
zero, or at least mean zero conditional on it, and obtains identification using instrumental variables
or repeated measurement identities (Schennach, 2016). Such restrictions are ill-suited to categorical
labels: misclassification of a finite-support variable is inherently nonclassical, and for nominal cate-
gories an additive error representation is itself unnatural (Schennach, 2016, Section 6.1). Accordingly,
our identification strategy instead builds on the nonclassical measurement error literature.
In foundational work, Kruskal (1977) studies three-way array decomposition and provides rank
conditions under which the decomposition is unique up to a common permutation and scaling of its
latent components. This result underlies the identification of discrete latent structures from condi-
tionally independent measurements. Hu (2008) studies nonlinear models with a misclassified discrete
independent variable, Hu and Schennach (2008) develop related identification results for continuous
variables, and Allman, Matias and Rhodes (2009) establish related results for discrete models with
hidden variables. Chen, Hong and Nekipelov (2011) and Schennach (2016, 2022) provide a broader
and unifying review of this literature, including such identification strategies based on multiple imper-
fect measurements under classical and nonclassical measurement error. In contrast to this literature,
we allow for more than three imperfect measurements, a more general class of downstream inference,
and semiparametric estimation and inference methods that are Neyman orthogonal to the first-stage
nuisance function estimation.
The Dawid–Skene model uses the same core conditional-independence structure: it treats the true
item label as latent, allows each annotator to have a distinct confusion matrix, and assumes that
annotations are independent conditional on the true label (Dawid and Skene, 1979). In the context of
LLM annotations, Bouyamourn and Spirling (2026) characterize conditions under which correlated
annotations can be aggregated and propose a dependence-aware extension of the Dawid–Skene model.
Proxy-based Causal Inference.
Another related literature studies causal inference with unmea-
sured variables using proxies (Kuroki and Pearl, 2014; Miao, Geng and Tchetgen Tchetgen, 2018;
Egami and Tchetgen Tchetgen, 2024), in particular, Zhou and Tchetgen Tchetgen (2024); Guo et al.
(2026). Most importantly, Zhou and Tchetgen Tchetgen (2024) develop a method to make causal
inference with a latent treatment. Specifically, they also build on the nonparametric latent variable
model literature (Kruskal, 1977; Allman, Matias and Rhodes, 2009) for nonparametric identification
and derive a new semiparametric efficiency theory and semiparametric estimation strategies for causal
effects with a hidden treatment. Guo et al. (2026) consider causal inference with the latent outcome
variable and derive an influence function-based semiparametric estimator. Their work considers set-
tings where the latent outcome has arbitrary finite support and the proxies may be either discrete
or continuous, and establishes general existence results for the constructions. Similarly, Nakamura
(2025) applies the array-decomposition ideas related to Zhou and Tchetgen Tchetgen (2024) to text
and image annotations with a latent outcome. Theoretically, we extend this literature by allowing for
(a) more than three proxies (with analytical results of how increasing the number of proxies affects
efficiency); (b) a general class of downstream analyses (in contrast to causal effects these previous
studies have focused on), and (c) settings where a latent variable is either a dependent or independent
categorical variable (each of previous studies focuses on just one of them).
2

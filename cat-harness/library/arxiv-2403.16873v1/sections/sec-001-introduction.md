---
doc_id: arxiv-2403.16873v1
doc_title: "How accurately can quantitative imaging methods be ranked without ground truth: An upper bound on no-gold-standard evaluation"
section_id: sec-001-introduction
section_title: "INTRODUCTION"
section_number: null
pages: 1-2
source_pdf: arxiv-2403.16873v1.pdf
source_sha256: c7e3e51b48a2ed8d
toc_source: outline
---
Quantitative imaging (QI), the extraction of quantifiable features from medical images, is being actively investi-
gated to facilitate clinical decision-making.1,2 For example, the use of metabolic tumor volume (MTV) obtained
from 18F-fluoro-deoxyglucose positron emission tomography (PET) to predict treatment response,3 apparent
diffusion coefficient measured using diffusion magnetic resonance imaging (MRI) to monitor cancer therapy
response,4 and radiotracer uptake in organ and tumor measured using quantitative single-photon emission com-
puted tomography (SPECT) for dosimetry of radiopharmaceutical therapies.5 Multiple QI methods have been
developed for each of these applications. For clinical translation of these methods, it is important to objectively
evaluate these QI methods on the task of reliably measuring the underlying true quantitative value. Performing
such evaluation with patient data is highly desirable but requires the knowledge of true quantitative value or a
gold standard. Such gold standards are typically expensive, time-consuming, and in many cases, impossible to
obtain. Thus, there is an important need for techniques to evaluate QI methods without a gold standard.
To objectively evaluate QI methods in the absence of gold standards, no-gold-standard evaluation (NGSE)
techniques have been proposed.
A seminal work is the regression-without-truth (RWT) technique.6,7
This
technique posits a linear relationship between the measured and true values characterized by a slope, a bias,
and an uncorrelated normally distributed noise term. Further, the technique assumes that the true values have
been sampled from a bounded parametric distribution function with known bounds and unknown parameters.
The RWT technique then estimates these linear relationship and true-distribution parameters using a maximum
likelihood approach without access to the true quantitative values. A figure of merit (FoM) is then computed
from the estimated parameters to rank the QI methods based on precision. The efficacy of this technique was
demonstrated in comparing different software packages in cardiac SPECT for estimating cardiac ejection fraction8
and evaluating segmentation methods in cardiac sine MRI for estimating the left ventricular ejection fraction.9
Corresponding author: Abhinav K. Jha
E-mail: a.jha@wustl.edu
arXiv:2403.16873v1  [physics.med-ph]  25 Mar 2024
Subsequently, there have been multiple efforts to translate the RWT idea to broader clinical settings. The
RWT technique assumes that the bounds of the true value distribution are known and that the noise between the
different methods is independent, assumptions that may not hold in all clinical settings. Towards overcoming this
issue, the technique was advanced to account for the cases where the bounds of the true value distribution are not
known. The efficacy of the resultant technique was demonstrated in evaluating different SPECT reconstruction
methods for estimating the mean activity uptake10 and PET segmentation methods on the task of measuring
metabolic tumor volume.11
The technique was then further advanced to model the correlated noise of the
measurements given by different QI methods.12
The efficacy of this NGSE technique was demonstrated in
evaluating SPECT reconstruction methods on the task of estimating mean activity uptake.13
Additionally,
studies have been conducted to assess the sensitivity of the NGSE techniques to violations of certain other
assumptions, as may occur in clinical settings. In these studies, it was observed that generally, the performance
of the NGSE technique was relatively insensitive to violation of certain assumptions.14
With the NGSE techniques demonstrating efficacy in multiple settings, there is an important need for ap-
proaches to guide the use of these techniques. For example, assume that we want to use the NGSE technique to
evaluate different PET lesion-segmentation methods on the task of estimating metabolic tumor volume (MTV).
Consider that a dataset consisting of a finite number of patients has been collected. It is well known that the per-
formance of NGSE techniques deteriorates as the number of patients that are input to the technique reduces.8,11
Thus, guidance is needed on what is the best possible performance that can be achieved by the NGSE technique
for the given patient dataset. This can provide guidance on whether the considered patient dataset is sufficient
or if more patient data needs to be collected. Similarly, while NGSE techniques have demonstrated efficacy in
ranking segmentation methods, their ranking accuracy may vary depending on the differences of the figure of
merit for the considered segmentation methods. Here again, guidance may be needed on the best performance
that can be achieved by the NGSE technique for evaluating the considered methods.
The above needs lead to a central question, namely, how accurately can QI methods be ranked without ground
truth. To answer this question, we developed a framework to quantify the best achievable ranking performance
for no-gold-standard evaluation, i.e., the upper bound of the accuracy of NGSE techniques on correctly ranking
QI methods. The proposed framework was developed for NGSE techniques that are based on the premise that
there is a statistical relationship between the true quantitative value and the quantitative values measured using
the different QI methods, and where the parameters of this relationship can be estimated without any knowledge
of the true quantitative value. The RWT technique and other recently proposed NGSE techniques belong to this

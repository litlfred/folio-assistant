---
doc_id: arxiv-2403.16873v1
doc_title: "How accurately can quantitative imaging methods be ranked without ground truth: An upper bound on no-gold-standard evaluation"
section_id: sec-005-discussion-and-conclusion
section_title: "Discussion and Conclusion"
section_number: null
pages: 4-6
source_pdf: arxiv-2403.16873v1.pdf
source_sha256: c7e3e51b48a2ed8d
toc_source: outline
---
To answer the question of how accurately can QI methods be ranked without gold standards, we proposed a
Cram´er–Rao bound-based framework. This framework quantifies the upper bound of correctly ranking the QI
methods in the absence of gold standards. We then presented an application of the framework in guiding the use
of the RWT technique. The results demonstrated the utility of this framework in quantifying the upper bound
of the performance of no-gold-standard evaluation for different number of patients input to the technique.
This upper bound provides a principled approach to guide the use of NGSE techniques. For a given set of QI
methods, the upper bound can provide the best achievable ranking performance for a given number of patients.
If this upper bound is low, caution is advised when using the NGSE technique with patient data. Another
potential application of the framework is to assess the performance of NGSE techniques in accurately ranking
different QI methods that may have varying degrees of separation of the figure of merit. This application of the
upper bound needs further investigation.
The upper bound can also be used to compare the performance of evaluating QI methods with and without
the gold standard. This helps to determine if obtaining the gold standard is necessary for evaluating the QI
methods. Considering the example, as presented in the introduction, of evaluating segmentation methods on the
task of estimating metabolic tumor volume. For this example, a potential gold standard could be provided by
the resected tumor. However, obtaining such gold standards for a patient population can be a time-consuming
and resource-intensive task. Further, even with available gold standards, statistical estimation techniques such
as least squares still need to be used to estimate the FoMs, and thus these estimated FoMs may have their
own inaccuracies.16
Hence, a quantitative assessment of the difference between the ranking performance of
no-gold-standard evaluation and the evaluation with gold standards can help decide whether gold standards are
necessary. If the difference between these two cases is acceptable, no-gold-standard evaluation can circumvent the
tedious and time-consuming process of obtaining gold standards. Investigating this application of the proposed
framework is another area of future research.
One limitation of the proposed framework is that it assumes that the NGSE technique yields unbiased
estimates of the figures of merit.
However, NGSE techniques could potentially yield biased estimates.
For
example, to address the issue of the NGSE techniques requiring a large number of patient samples, a maximum-
a-posteriori-based NGSE technique was proposed.17
Such an estimator can be biased.
Deriving bounds for
such biased NGSE techniques is an area of future investigation. Next, although the assumptions of the NGSE
technique are reasonable, they could be potentially violated in clinical settings.10,14 For example, while the linear
relationship of the measured and true quantitative values is desirable in QI, this assumption may not always
hold true in clinical scenarios. Thus, it is important to assess the impact of the violation of these assumptions
on the upper bound.
In conclusion, we developed a framework to quantify the upper bound in correctly ranking the methods
without gold standards. This framework can also quantify the upper bound for correctly identifying the best QI
method. We observed the utility of this upper bound in assessing the number of patients required by a specific
NGSE technique, namely the RWT technique, to obtain a certain degree of accuracy. Our results motivate
further investigations of the applications of the proposed framework.
ACKNOWLEDGMENTS
This work was supported by the National Institute of Biomedical Imaging and Bioengineering of the National
Institute of Health under grants R01-EB031051, R01-EB031051-S1 and R01-EB031962. We would like to thank
Barry A. Siegel, MD, for inputs related to the clinical context of this work, and Zekun Li for helpful discussion.
REFERENCES
[1] Gatenby, R. A., Grove, O., and Gillies, R. J., “Quantitative imaging in cancer evolution and ecology,”
Radiology 269(1), 8–14 (2013).
[2] Rosenkrantz, A. B., Mendiratta-Lala, M., Bartholmai, B. J., Ganeshan, D., Abramson, R. G., Burton,
K. R., John-Paul, J. Y., Scalzetti, E. M., Yankeelov, T. E., Subramaniam, R. M., et al., “Clinical utility of
quantitative imaging,” Academic Radiology 22(1), 33–49 (2015).
[3] Ohri, N., Duan, F., Machtay, M., Gorelick, J. J., Snyder, B. S., Alavi, A., Siegel, B. A., Johnson, D. W.,
Bradley, J. D., DeNittis, A., et al., “Pretreatment FDG-PET metrics in stage III non–small cell lung cancer:
Acrin 6668/RTOG 0235,” Journal of the National Cancer Institute 107(4), djv004 (2015).
[4] Herneth, A. M., Guccione, S., and Bednarski, M., “Apparent diffusion coefficient: a quantitative parameter
for in vivo tumor characterization,” European Journal of Radiology 45(3), 208–213 (2003).
[5] Li, Z., Benabdallah, N., Abou, D. S., Baumann, B. C., Dehdashti, F., Ballard, D. H., Liu, J., Jammala-
madaka, U., Laforest, R. L., Wahl, R. L., et al., “A projection-domain low-count quantitative SPECT
method for α-particle-emitting radiopharmaceutical therapy,” IEEE Transactions on Radiation and Plasma
Medical Sciences 7(1), 62–74 (2022).
[6] Kupinski, M. A., Hoppin, J. W., Clarkson, E., Barrett, H. H., and Kastis, G. A., “Estimation in medical
imaging without a gold standard,” Academic Radiology 9(3), 290–297 (2002).
[7] Hoppin, J. W., Kupinski, M. A., Kastis, G. A., Clarkson, E., and Barrett, H. H., “Objective comparison
of quantitative imaging modalities without the use of a gold standard,” IEEE Transactions on Medical
Imaging 21(5), 441–449 (2002).
[8] Kupinski, M. A., Hoppin, J. W., Krasnow, J., Dahlberg, S., Leppo, J. A., King, M. A., Clarkson, E.,
and Barrett, H. H., “Comparing cardiac ejection fraction estimation algorithms without a gold standard,”
Academic Radiology 13(3), 329–337 (2006).
[9] Lebenberg, J., Buvat, I., Lalande, A., Clarysse, P., Casta, C., Cochet, A., Constantinid`es, C., Cousty,
J., De Cesare, A., Jehan-Besson, S., et al., “Nonsupervised ranking of different segmentation approaches:
application to the estimation of the left ventricular ejection fraction from cardiac cine MRI sequences,”
IEEE Transactions on Medical Imaging 31(8), 1651–1660 (2012).
[10] Jha, A. K., Caffo, B., and Frey, E. C., “A no-gold-standard technique for objective assessment of quantitative
nuclear-medicine imaging methods,” Physics in Medicine & Biology 61(7), 2780 (2016).
[11] Jha, A. K., Mena, E., Caffo, B., Ashrafinia, S., Rahmim, A., Frey, E., and Subramaniam, R. M., “Practical
no-gold-standard evaluation framework for quantitative imaging methods: application to lesion segmentation
in positron emission tomography,” Journal of Medical Imaging 4(1), 011011 (2017).
[12] Liu, Z., Li, Z., Mhlanga, J. C., Siegel, B. A., and Jha, A. K., “No-gold-standard evaluation of quantitative
imaging methods in the presence of correlated noise,” in [Medical Imaging 2022: Image Perception, Observer
Performance, and Technology Assessment], 12035, 146–151, SPIE (2022).
[13] Liu, Y., Liu, Z., Li, Z., Thorek, D., Siegel, B., and Jha, A., “No-gold-standard evaluation of quantitative
SPECT methods for alpha-particle radiopharmaceutical therapy,” Journal of Nuclear Medicine 64(supple-
ment 1), 1331 (2023).
[14] Liu, Y., Liu, Z., and Jha, A., “No-gold-standard evaluation of quantitative imaging methods: Studying the
impact of model mismatch,” in [2023 IEEE Nuclear Science Symposium, Medical Imaging Conference and
International Symposium on Room-Temperature Semiconductor Detectors (NSS MIC RTSD)], 1–2, IEEE
(2023).
[15] Barrett, H. H. and Myers, K. J., [Foundations of image science], John Wiley & Sons (2013).
[16] Obuchowski, N. A., Reeves, A. P., Huang, E. P., Wang, X.-F., Buckler, A. J., Kim, H. J., Barnhart,
H. X., Jackson, E. F., Giger, M. L., Pennello, G., et al., “Quantitative imaging biomarkers: a review of
statistical methods for computer algorithm comparisons,” Statistical Methods in Medical Research 24(1),
68–106 (2015).
[17] Jha, A. and Frey, E., “Incorporating prior information in a no-gold-standard technique to assess quantitative
SPECT reconstruction methods,” in [International Meeting on Fully 3D reconstruction in Radiology and
Nuclear Medicine], 47–51 (2015).

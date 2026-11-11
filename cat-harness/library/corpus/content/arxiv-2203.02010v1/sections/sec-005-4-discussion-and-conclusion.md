---
doc_id: arxiv-2203.02010v1
doc_title: "This manuscript has been accepted to SPIE Medical Imaging, February 20-24, 2022. Please use the following reference when citing the manuscript"
section_id: sec-005-4-discussion-and-conclusion
section_title: "Discussion and Conclusion"
section_number: 4
pages: 5-7
source_pdf: arxiv-2203.02010v1.pdf
source_sha256: ce57446b880d55e4
toc_source: outline
---
For clinical translation of QI, there is an important need for techniques that can objectively evaluate QI methods
with patient data. In this context, existing statistical techniques assume that the noise between measurements
obtained using diﬀerent methods is independent of each other. However, this assumption can often be violated
since the noise arises in the process of measuring the same true value. To address this issue, we developed an
NGSE technique that models this correlated noise by a multi-variate Gaussian distribution.
Our results from the numerical experiments (Tables 1 and 2) showed that the NGSE technique yielded
reliable estimates of slope, noise standard deviation, and consequently the NSR for all hypothetical QI methods.
Additionally, the technique yielded accurate rankings of these methods for 83% of the total 160 trials. Further,
the technique was able to identify the most precise method for 97% of the cases. This observation is especially
important since when evaluating diﬀerent QI methods, the objective is typically to ﬁnd the method that yields
the most reliable performance.22 All these results demonstrated that in controlled settings, where the true and
measured values were linearly related by design, the NGSE technique was able to reliably rank QI methods
without access to any knowledge of the ground truth.
The results motivate further evaluation of the proposed technique with QI methods that are developed
for clinical applications. These include methods developed for reconstruction, post-reconstruction processing,
segmentation, and quantiﬁcation. Often, such methods are evaluated using strategies that rely on the availability
of a ground truth. Further, this ground truth may not be relevant to the clinical task. For example, segmentation
methods are evaluated using metrics such as the Dice score and Hausdorﬀdistance, which quantify spatial overlap
and shape similarity, respectively, between the estimated segmentation and a certain ground-truth segmentation.
Such evaluation then requires access to the true segmentation, which is typically unavailable. Usually manual
segmentations are used as a surrogate for the ground truth, but these can be erroneous and suﬀer from intra-
and inter-reader variability.24
Similarly, denoising methods for low-dose images are evaluated by comparing
the denoised image to a certain normal-dose image using metrics of structural similarity index and root mean
square error. However, the normal-dose image is also noisy, and thus provides a limited measure of ground truth.
More importantly, it is unclear whether the evaluation based on those conventional metrics correlates with the
clinical task.25–27 Thus, these methods should preferably be evaluated based on clinical-task performance.28 The
proposed NGSE technique provides a mechanism to perform evaluation on clinically relevant quantitative tasks
and without access to the ground truth.
One limitation of the proposed technique is that the true and measured values are assumed to be linearly
related.
This linear relationship is desirable in QI since it ensures that the measured quantitative value is
linearly related to the biological eﬀect. However, this assumption of linearity may not always hold true in QI.
To address this issue, one strategy is to check whether the measurements made by diﬀerent methods are linearly
related to each other. This will increase the conﬁdence that the measured values are also linearly related to the
ground truth.22 A second limitation is that the NGSE technique requires many patient images since multiple
parameters need to be estimated. One way to reduce the required number of input images is to incorporate the
prior information of the parameters to be estimated.29 Thus, extending the proposed technique to incorporate
such prior knowledge is an important research direction.
In conclusion, our study demonstrated the ability of the proposed NGSE technique to accurately rank diﬀerent
QI methods in the presence of correlated noise, and without the need for any knowledge of the ground truth.
The results motivate further evaluation of the technique with realistic simulation studies and patient data.
ACKNOWLEDGEMENTS
Financial support for this work was provided by the National Institute of Biomedical Imaging and Bioengineering
R01-EB031051, R56-EB028287, and R21-EB024647 (Trailblazer Award).
REFERENCES
[1] Sullivan, D. C., Obuchowski, N. A., Kessler, L. G., Raunig, D. L., Gatsonis, C., Huang, E. P., Kondratovich,
M., McShane, L. M., Reeves, A. P., Barboriak, D. P., et al., “Metrology standards for quantitative imaging
biomarkers,” Radiology 277(3), 813–825 (2015).
[2] Rosenkrantz, A. B., Mendiratta-Lala, M., Bartholmai, B. J., Ganeshan, D., Abramson, R. G., Burton,
K. R., John-Paul, J. Y., Scalzetti, E. M., Yankeelov, T. E., Subramaniam, R. M., et al., “Clinical utility of
quantitative imaging,” Acad. Radiol. 22(1), 33–49 (2015).
[3] Ohri, N., Duan, F., Machtay, M., Gorelick, J. J., Snyder, B. S., Alavi, A., Siegel, B. A., Johnson, D. W.,
Bradley, J. D., DeNittis, A., et al., “Pretreatment FDG-PET metrics in stage III non–small cell lung cancer:
ACRIN 6668/RTOG 0235,” J. Natl. Cancer Inst. 107(4) (2015).
[4] Filippi, L., Manni, C., Pierantozzi, M., Brusa, L., Danieli, R., Stanzione, P., and Schillaci, O., “123I-FP-CIT
semi-quantitative SPECT detects preclinical bilateral dopaminergic deﬁcit in early Parkinson’s disease with
unilateral symptoms,” Nucl. Med. Commun. 26(5), 421–426 (2005).
[5] Moon, H. S., Liu, Z., Ponisio, M., Laforest, R., and Jha, A., “A physics-guided and learning-based estimation
method for segmenting 3D DaT-Scan SPECT images,” (2020).
[6] Flux, G., Bardies, M., Monsieurs, M., Savolainen, S., Strand, S.-E., and Lassmann, M., “The impact of
PET and SPECT on dosimetry for targeted radionuclide therapy,” Z. Med. Phys. 16(1), 47–59 (2006).
[7] Ljungberg, M., Sj¨ogreen, K., Liu, X., Frey, E., Dewaraja, Y., and Strand, S.-E., “A 3-dimensional absorbed
dose calculation method based on quantitative SPECT for radionuclide therapy: evaluation for 131I using
Monte Carlo simulation,” J. Nucl. Med. 43(8), 1101–1109 (2002).
[8] Dewaraja, Y. K., Frey, E. C., Sgouros, G., Brill, A. B., Roberson, P., Zanzonico, P. B., and Ljungberg,
M., “MIRD pamphlet no. 23: quantitative SPECT for patient-speciﬁc 3-dimensional dosimetry in internal
radionuclide therapy,” J. Nucl. Med. 53(8), 1310–1325 (2012).
[9] Li, Z., Benabdallah, N., Abou, D. S., Baumann, B. C., Dehdashti, F., Jammalamadaka, U., Laforest, R.,
Wahl, R. L., Thorek, D. L., and Jha, A. K., “A projection-domain low-count quantitative SPECT method
for alpha-particle emitting radiopharmaceutical therapy,” arXiv preprint arXiv:2107.00740 (2021).
[10] Du, Y., Tsui, B. M., and Frey, E. C., “Partial volume eﬀect compensation for quantitative brain SPECT
imaging,” IEEE Trans. Med. Imaging 24(8), 969–976 (2005).
[11] Jin, X., Mulnix, T., Gallezot, J.-D., and Carson, R. E., “Evaluation of motion correction methods in human
brain PET imaging—A simulation study based on human motion data,” Med. Phys. 40(10), 102503 (2013).
[12] Ouyang, J., El Fakhri, G., Moore, S. C., and Kijewski, M. F., “Fast Monte Carlo Simulation Based Joint
Iterative Reconstruction for Simultaneous 99mTc/123I Brain SPECT Imaging,” in [2006 IEEE Nuclear
Science Symposium Conference Record], 4, 2251–2256, IEEE (2006).
[13] He, B., Du, Y., Song, X., Segars, W. P., and Frey, E. C., “A Monte Carlo and physical phantom evaluation
of quantitative In-111 SPECT,” Phys. Med. Biol. 50(17), 4169 (2005).
[14] Liu, Z., Mhlanga, J. C., Laforest, R., Derenoncourt, P.-R., Siegel, B. A., and Jha, A. K., “A Bayesian
approach to tissue-fraction estimation for oncological PET segmentation,” Phys. Med. Biol. 66(12), 124002
(2021).
[15] Hoppin, J. W., Kupinski, M. A., Kastis, G. A., Clarkson, E., and Barrett, H. H., “Objective comparison
of quantitative imaging modalities without the use of a gold standard,” IEEE Trans. Med. Imaging 21(5),
441–449 (2002).
[16] Kupinski, M. A., Hoppin, J. W., Clarkson, E., Barrett, H. H., and Kastis, G. A., “Estimation in medical
imaging without a gold standard,” Acad. Radiol. 9(3), 290–297 (2002).
[17] Jha, A. K., Kupinski, M. A., Rodr´ıguez, J. J., Stephen, R. M., and Stopeck, A. T., “Evaluating segmentation
algorithms for diﬀusion-weighted MR images: a task-based approach,” in [Medical Imaging 2010: Image
Perception, Observer Performance, and Technology Assessment], 7627, 76270L, International Society for
Optics and Photonics (2010).
[18] Jha, A. K., Kupinski, M. A., Rodriguez, J. J., Stephen, R. M., and Stopeck, A. T., “Task-based evalu-
ation of segmentation algorithms for diﬀusion-weighted MRI without using a gold standard,” Phys. Med.
Biol. 57(13), 4425 (2012).
[19] Lebenberg, J., Buvat, I., Lalande, A., Clarysse, P., Casta, C., Cochet, A., Constantinid´es, C., Cousty,
J., De Cesare, A., Jehan-Besson, S., et al., “Nonsupervised ranking of diﬀerent segmentation approaches:
application to the estimation of the left ventricular ejection fraction from cardiac cine MRI sequences,”
IEEE Trans. Med. Imag. 31(8), 1651–1660 (2012).
[20] Jha, A. K., Caﬀo, B., and Frey, E. C., “A no-gold-standard technique for objective assessment of quantitative
nuclear-medicine imaging methods,” Phys. Med. Biol. 61(7), 2780 (2016).
[21] Jha, A. K., Song, N., Caﬀo, B., and Frey, E. C., “Objective evaluation of reconstruction methods for
quantitative SPECT imaging in the absence of ground truth,” in [Medical Imaging 2015: Image Perception,
Observer Performance, and Technology Assessment], 9416, 94161K, International Society for Optics and
Photonics (2015).
[22] Jha, A. K., Mena, E., Caﬀo, B. S., Ashraﬁnia, S., Rahmim, A., Frey, E. C., and Subramaniam, R. M.,
“Practical no-gold-standard evaluation framework for quantitative imaging methods: application to lesion
segmentation in positron emission tomography,” J. Med. Imaging 4(1), 011011 (2017).
[23] Byrd, R. H., Hribar, M. E., and Nocedal, J., “An interior point algorithm for large-scale nonlinear program-
ming,” SIAM J. Optim. 9(4), 877–900 (1999).
[24] Leung, K. H., Marashdeh, W., Wray, R., Ashraﬁnia, S., Pomper, M. G., Rahmim, A., and Jha, A. K., “A
physics-guided modular deep-learning based automated framework for tumor segmentation in PET,” Phys.
Med. Biol. 65(24), 245032 (2020).
[25] Yu, Z., Rahman, M. A., Schindler, T., Gropler, R., Laforest, R., Wahl, R., and Jha, A., “AI-based methods
for nuclear-medicine imaging: Need for objective task-speciﬁc evaluation,” (2020).
[26] Zhu, Y., Youseﬁrizi, F., Liu, Z., Klyuzhin, I., Rahmim, A., and Jha, A., “Comparing clinical evaluation
of PET segmentation methods with reference-based metrics and no-gold-standard evaluation technique,”
(2021).
[27] Liu, Z., Mhlanga, J. C., Siegel, B. A., and Jha, A. K., “Need for objective task-based evaluation of seg-
mentation methods in oncological PET: a study with ACRIN 6668/RTOG 0235 multi-center clinical trial
data,” in review (2022).
[28] Jha, A. K., Myers, K. J., Obuchowski, N. A., Liu, Z., Rahman, M. A., Saboury, B., Rahmim, A., and
Siegel, B. A., “Objective Task-Based Evaluation of Artiﬁcial Intelligence-Based Medical Imaging Methods:
Framework, Strategies, and Role of the Physician,” PET Clin. 16(4), 493–511 (2021).
[29] Jha, A. and Frey, E., “Incorporating prior information in a no-gold-standard technique to assess quantitative
SPECT reconstruction methods,” in [International Meeting on Fully 3D reconstruction in Radiology and
Nuclear Medicine], 47–51 (2015).

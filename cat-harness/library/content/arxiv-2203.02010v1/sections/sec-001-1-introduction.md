---
doc_id: arxiv-2203.02010v1
doc_title: "This manuscript has been accepted to SPIE Medical Imaging, February 20-24, 2022. Please use the following reference when citing the manuscript"
section_id: sec-001-1-introduction
section_title: "INTRODUCTION"
section_number: 1
pages: 2-3
source_pdf: arxiv-2203.02010v1.pdf
source_sha256: ce57446b880d55e4
toc_source: outline
---
Medical imaging provides a mechanism to study in vivo physiological properties of the human body, and thus
plays an important role in the diagnosis, prognosis, and assessment of treatment response of diﬀerent diseases. To
facilitate decision-making in clinical practice, quantitative imaging (QI), i.e., the extraction of numerical or sta-
tistical features from medical images, is being actively investigated.1, 2 QI has demonstrated substantial promise
in multiple clinical applications. These include the quantiﬁcation of metabolic tumor volume from oncological
positron emission tomography (PET) for predicting clinical outcomes,3 quantiﬁcation of dopamine transporter
uptake from single-photon emission computed tomography (SPECT) to assess the severity of Parkinson dis-
ease,4, 5 and quantiﬁcation of regional uptake from PET and SPECT for dosimetry in targeted radionuclide
therapy.6–9
Given the signiﬁcant interest in QI, multiple methods have been and are being developed for QI. For clinical
translation of QI, it is essential that the measurements made by those methods are reliable. Thus, there is an
important need for objective evaluation of the reliability of measurements obtained using QI methods. Typically,
such evaluation requires the presence of either the true value of the quantitative parameter or a reference standard.
Such true values or reference standards can be available in realistic simulation and physical phantom studies.10–14
While these studies are important for the initial development of QI methods, there is an important need for
techniques that can perform objective evaluation of QI methods directly with patient data. Such evaluation then
Corresponding author: Abhinav K. Jha (a.jha@wustl.edu)
requires the presence of gold-standard quantitative values. These are typically time-consuming, expensive, and
tedious to obtain. Further, even when an approximate gold standard is available, it could suﬀer from the lack
of reliability. Thus, techniques that can objectively evaluate QI methods in the absence of a gold standard are
much needed.
To objectively evaluate QI methods without the knowledge of a gold standard, a regression-without-truth
(RWT) technique was proposed in a set of seminal papers.15, 16 The RWT technique assumes that the true and
measured values are linearly related by a slope, bias, and Gaussian-distributed noise term. It was demonstrated
that even in the absence of a gold standard, the values of the slope, bias, and the standard deviation of the noise
term for all the considered QI methods can be estimated using a maximum-likelihood (ML) approach. These
estimated parameters can then be used to rank diﬀerent QI methods on the basis of precision. The eﬃcacy of the
RWT technique was demonstrated in evaluating segmentation methods on the task of estimating the apparent
diﬀusion coeﬃcient from diﬀusion-weighted magnetic resonance imaging (MRI) scans,17, 18 and on the task of
estimating the left ventricular ejection fraction from cardiac cine MRI sequences.19 The RWT technique was
then advanced further and the eﬃcacy of the resultant no-gold-standard evaluation (NGSE) technique20 was
demonstrated in objectively evaluating reconstruction methods for SPECT on the task of quantifying regional
uptake.20, 21 Further, the technique was applied to clinical oncological PET images to evaluate segmentation
methods on the task of measuring metabolic tumor volume.22 While the ﬁndings from these studies are encour-
aging, an important assumption in these existing evaluation techniques is that the noise between measurements
obtained using diﬀerent QI methods is independent of each other. The noise with diﬀerent QI methods arises
in the process of measuring the same true value, and then can be correlated. Thus, this assumption is often
violated. To address this issue, we propose an advanced NGSE technique that accounts for the presence of such

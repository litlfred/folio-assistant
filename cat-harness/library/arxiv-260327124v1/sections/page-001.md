---
doc_id: arxiv-260327124v1
doc_title: "arxiv-2603.27124v1"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: arxiv-2603.27124v1.pdf
source_sha256: 4051c964c381e275
text_source: embedded
granularity: page
---
Extending Regression Without Truth to Integrate Ground-Truth 
Measurements for Evaluating Quantitative Imaging Methods with 
Patient Data  
Yan Liua, Abhinav K. Jhaa,b,* 
aDepartment of Biomedical Engineering, Washington University in St. Louis, St. Louis, MO, USA; 
bMallinckrodt Institute of Radiology, Washington University in St. Louis, St. Louis, MO, USA 
ABSTRACT  
Objective evaluation of quantitative imaging (QI) methods with patient data is often hindered by the lack of gold standards. 
To address this challenge, a class of regression-without-truth (RWT) techniques have been developed. These techniques 
assume that the true and measured values are linearly related and estimate the linear-relationship parameters without access 
to true values. However, reliable estimation of these parameters typically requires many patient samples, which can be 
expensive and time consuming to obtain, and even impossible in settings such as studies with rare diseases or with new 
clinical imaging procedures. Thus, there is an important need for strategies to perform evaluation of quantitative imaging 
methods with a small number of patient samples. In this context, we note that datasets with known ground truth, such as 
physical phantom studies, could be available.  In this manuscript, we propose an approach that integrates information from 
both patient data without ground truth and known-ground-truth datasets to perform objective evaluation of QI methods. 
We validated the proposed approach using numerical studies, which showed that the proposed approach yielded improved 
performance in ranking QI methods compared with RWT technique. The results demonstrate the potential of the proposed 
approach for evaluating QI methods when patient data are limited and motivate further validation with clinically realistic 
simulation studies and clinical data.  
Keywords: quantitative imaging, no-gold-standard evaluation, maximum likelihood estimation 
 
1. INTRODUCTION  
Quantitative imaging (QI), the extraction and use of numerical measurements from medical images to help with clinical 
decision making1,2, is emerging as an important tool across a wide range of applications. Examples include the use of 
myocardial blood flow from cardiac positron emission tomography (PET) to help diagnose coronary artery disease3, 
quantifying radiotracer uptake using single-photon emission computed tomography (SPECT) for dosimetry in 
radiopharmaceutical therapy4 and measuring apparent diffusion coefficient using diffusion magnetic resonance imaging 
(MRI) to monitor response to cancer treatment5. Given the importance of these clinical applications, different QI methods 
have been and are being actively developed6–9. For clinical translation of QI methods, objective evaluation of these 
methods on the task of reliably measuring the underlying true quantitative values is crucial. Performing such evaluation 
with patient data is highly desirable but often hindered by the lack of gold standards. Thus, there is a critical need for 
objective evaluation methods that can be applied in the absence of gold standards. 
To address this need, a class of regression-without-truth (RWT) techniques has been developed10–13. RWT techniques 
are based on the premise that while the true quantitative values are unknown, the measured values are result of specific 
image-formation and quantification processes applied to the true values, and thus, the true and measured values are 
expected to be mathematically related. More specifically, the RWT techniques posit a linear stochastic relationship that is 
characterized by slope, bias, and noise standard deviation parameters, and these parameters are then estimated using a 
maximum-likelihood (ML)-based approach without access to the true values. The ratio of estimated noise standard 
deviation to slope, termed as noise-to-slope ratio (NSR), is computed as a figure of merit to rank the QI methods based on 
precision. The efficacy of the RWT techniques has been demonstrated in multiple applications including comparing 
software packages in SPECT14 and segmentation methods in cardiac cine MRI15 on the task of measuring cardiac ejection 
fraction, comparing segmentation methods in diffusion MRI for estimating apparent diffusion coefficient16, evaluating 
reconstruction methods in SPECT for estimating mean regional uptake12,17 and segmentation methods in PET for measur- 
*a.jha@wustl.edu

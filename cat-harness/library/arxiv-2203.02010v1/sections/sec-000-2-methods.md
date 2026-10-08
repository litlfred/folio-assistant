---
doc_id: arxiv-2203.02010v1
doc_title: "This manuscript has been accepted to SPIE Medical Imaging, February 20-24, 2022. Please use the following reference when citing the manuscript"
section_id: sec-000-2-methods
section_title: "METHODS"
section_number: 2
pages: 2-2
source_pdf: arxiv-2203.02010v1.pdf
source_sha256: ce57446b880d55e4
toc_source: outline
---
in the presence of correlated noise
Ziping Liua, Zekun Lia, Joyce C. Mhlangab, Barry A. Siegelb, and Abhinav K. Jhaa,b
aDepartment of Biomedical Engineering, Washington University, St. Louis, MO, USA
bMallinckrodt Institute of Radiology, Washington University School of Medicine, St. Louis,
MO, USA
ABSTRACT
Objective evaluation of quantitative imaging (QI) methods with patient data is highly desirable, but is hindered
by the lack or unreliability of an available gold standard. To address this issue, techniques that can evaluate QI
methods without access to a gold standard are being actively developed. These techniques assume that the true
and measured values are linearly related by a slope, bias, and Gaussian-distributed noise term, where the noise
between measurements made by diﬀerent methods is independent of each other. However, this noise arises in
the process of measuring the same quantitative value, and thus can be correlated. To address this limitation, we
propose a no-gold-standard evaluation (NGSE) technique that models this correlated noise by a multi-variate
Gaussian distribution parameterized by a covariance matrix. We derive a maximum-likelihood-based approach
to estimate the parameters that describe the relationship between the true and measured values, without any
knowledge of the true values. We then use the estimated slopes and diagonal elements of the covariance matrix
to compute the noise-to-slope ratio (NSR) to rank the QI methods on the basis of precision. The proposed NGSE
technique was evaluated with multiple numerical experiments. Our results showed that the technique reliably
estimated the NSR values and yielded accurate rankings of the considered methods for 83% of 160 trials. In
particular, the technique correctly identiﬁed the most precise method for ∼97% of the trials. Overall, this study
demonstrates the eﬃcacy of the NGSE technique to accurately rank diﬀerent QI methods when the correlated
noise is present, and without access to any knowledge of the ground truth. The results motivate further validation
of this technique with realistic simulation studies and patient data.
Keywords: no-gold-standard, objective evaluation, medical imaging, quantitative imaging

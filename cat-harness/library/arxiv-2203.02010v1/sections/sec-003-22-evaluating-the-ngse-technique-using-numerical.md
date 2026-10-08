---
doc_id: arxiv-2203.02010v1
doc_title: "This manuscript has been accepted to SPIE Medical Imaging, February 20-24, 2022. Please use the following reference when citing the manuscript"
section_id: sec-003-22-evaluating-the-ngse-technique-using-numerical
section_title: "Evaluating the NGSE technique using numerical experiments"
section_number: 2.2
pages: 4-4
source_pdf: arxiv-2203.02010v1.pdf
source_sha256: ce57446b880d55e4
toc_source: outline
---
We evaluated the performance of the NGSE technique using multiple numerical experiments. In each experiment,
P = 200 true values were sampled from a known FPBD. From these true values, noisy measured values were
generated for K = 3 hypothetical QI methods. Each method yielded outputs that were linearly related to the
true values by a slope of uk and bias of vk. The variance of the noise of each method was characterized by
the diagonal elements of the covariance matrix C. Additionally, the covariance of the noise between diﬀerent
methods were characterized by the oﬀ-diagonal elements of C. These noisy measurements were then input to the
NGSE technique to estimate {Θ, C, Ω}. From these estimated parameters, we used the slope terms {ˆuk} and
the noise standard deviation terms {ˆσk} to compute the NSR for all methods to rank them based on precision,
as described in Sec. 2.1.
In this evaluation, we sampled the 200 true values from FPBD for 4 combinations of Ωsuch that diﬀerent
ranges and shapes of the true distribution were modeled. To evaluate the sensitivity of the NGSE technique
to correlated noise, we generated two sets of QI methods for each combination of Ω. The ﬁrst set of methods
had lower correlated noise with {σ1,2, σ1,3, σ2,3} = {0.004, 0.008, 0.012}. In contrast, the second set of methods
had higher correlated noise with {σ1,2, σ1,3, σ2,3} = {0.015, 0.02, 0.03}. For both sets, the values of slope {uk},
bias {vk}, and variance of the noise {σ2
k} of the three methods were set to {1.1, 0.9, 1.05}, {0.1, 0.2, 0.3}, and
{0.04, 0.09, 0.2025}, respectively. Finally, for each combination of {Θ, C, Ω}, we repeated the experiment for 20
diﬀerent noise realizations. Thus, we evaluated the performance of the NGSE technique for a total of 4×2×20 =
160 trials.

---
doc_id: arxiv-260327124v1
doc_title: "arxiv-2603.27124v1"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: arxiv-2603.27124v1.pdf
source_sha256: 4051c964c381e275
text_source: embedded
granularity: page
---
the true values of the 𝑃 patients and given that the patient data and physical phantom data are independent, we can use an 
ML approach to estimate the values of {𝚯, 𝚺, 𝛀}. The ML estimate of {𝚯, 𝚺, 𝛀} is given by 
{𝚯, 𝚺, 𝛀}ெ௅= arg max൛log pr ൫𝓐෡|𝚯, 𝚺, 𝛀൯+ log pr ൫𝓓෡|𝚯, 𝚺, 𝐃൯ൟ.
(4) 
Same as in the RWT technique10,11, after the estimation of the linear-relationship parameters, the ratio of estimated 
noise standard deviation, 𝜎௞, and slope, 𝑢௞, is used to quantify the precision of the 𝑘୲୦ method. This figure of merit, 𝜎௞/𝑢௞, 
termed as the noise-to-slope ratio, can thus be used to rank the QI methods. A lower value of NSR indicates a higher 
precision in measuring the true values.   
2.2 Validating the proposed approach using numerical studies 
We conducted numerical studies to investigate the impact of integrating known-ground-truth data using the proposed 
approach by comparing the RWT technique and the proposed approach in estimating NSR values and ranking QI methods. 
The numerical studies provided a controlled setting in which all model assumptions were satisfied and the true NSR values 
and true rankings of the QI methods were known.  
Specifically, we first sampled 𝑁 true values from a known four-parameter beta distribution. From these true values, 
we generated synthetic measurements for three hypothetical QI methods using specified slopes, biases, and noise standard 
deviations. This dataset was used to mimic patient data where the ground truth is unknown. We then input the noisy 
measurements into the RWT technique. For the proposed approach, we generated an additional dataset following the same 
procedure. This dataset was used to mimic a study in which ground truth is available, such as physical phantom study. The 
measurements from the ground-truth-unknown dataset and both the measurements and true values from ground-truth-
known dataset were provided to the proposed approach.  
To make the numerical studies clinically relevant, we used linear-relationship parameters derived from a realistic 
simulation study where different quantitative SPECT methods were used to quantify mean regional activity uptake in 
patients treated with 223Ra. Specifically, the slopes, biases, and noise standard deviations for the three synthetic QI methods 
were set to {0.97,0.76,1.00}, {0.30, 0,0} and {0.21,0.13,0.09}, respectively. The size of the ground-truth-unknown dataset 
was varied from 10 to 100. For the proposed approach, we additionally varied the number of known-ground-truth samples 
to assess how different amounts of such data affect performance. For each combination of patient cohort size and known-
ground-truth dataset size, 200 noise realizations were repeated to estimate the percentage of correctly ranking all the QI 
methods and identifying the most precise QI method. 
3. RESULTS 
Figure 1 presents the average absolute normalized bias and average normalized standard deviation in estimating NSR 
values for RWT and the proposed approach with different numbers of samples in the known-ground-truth dataset. We 
observe that the proposed approach yielded more accurate and precise NSR estimation than RWT, indicating that 
integrating known-ground-truth data can improve estimation performance. Moreover, increasing the size of the known-
ground-truth dataset further improved the accuracy and precision in estimating NSR. Consequently, the proposed approach 
achieved higher accuracy in correctly ranking the methods and identifying the most precise method compared with RWT, 
as shown in Figure 2. The ranking performance of the proposed approach improved consistently as the known-ground-
truth dataset size increases. 
4. DISSCUSSIONS AND CONCLUSION 
One challenge in applying RWT techniques in clinical practice is the need for large patient datasets, which could be 
difficult to obtain in many clinical scenarios. To address this challenge, we investigated whether additional information 
from data sources with known ground truth, such as phantom studies or realistic simulation studies, could be integrated to 
improve performance of these RWT techniques. We derived a maximum likelihood approach that integrates both data with 
unknown ground truth (such as patient data) and data sources with known ground truth (such as physical phantom data). 
We validated the proposed approach using numerical experiments in this manuscript.  
Our results from the numerical study showed that the proposed approach consistently yielded lower bias and lower 
standard deviation in estimating NSR compared with RWT. This then led to an improvement in the performance in ranking

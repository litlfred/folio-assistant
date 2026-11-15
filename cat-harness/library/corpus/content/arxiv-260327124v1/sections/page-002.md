---
doc_id: arxiv-260327124v1
doc_title: "arxiv-2603.27124v1"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: arxiv-2603.27124v1.pdf
source_sha256: 4051c964c381e275
text_source: embedded
granularity: page
---
ing metabolic tumor volume18. These applications demonstrate the promise of RWT to evaluate QI methods in the absence 
of ground truth.  
Despite the promise of RWT techniques, a major challenge for broader applications of these techniques is the 
requirement for large patient cohorts12. This requirement arises because the RWT techniques involve estimation of many 
parameters. For example, when evaluating 3 QI methods, around 13 parameters need to be estimated, including 3 slopes, 
3 biases, 3 noise standard deviations and 4 parameters characterizing the true-value distribution when a four-parameter 
beta distribution is assumed. Consequently, reliable parameter estimation may require measurements from a large patient 
cohort. Obtaining a large number of such patient studies can be expensive, and, in many cases, impossible. For example, 
in rare diseases, patient availability is inherently limited. Similarly, consider studies involving new contrast agents, such 
as new tracers in PET or new isotopes for theranostic applications, in which different methods are evaluated for estimating 
certain quantitative value, e.g. the absorbed dose in lesions and radiosensitive organs. For these new agents, early-phase 
clinical trials often involve very few patients. In these cases, identifying the most reliable quantitative imaging method 
becomes challenging with limited data. Thus, there is an important need for strategies to perform evaluation of quantitative 
imaging methods with a small number of patient samples. In this context, we note that data sources with known ground 
truth, such as physical phantom studies, are available. Such data could provide additional information about the linear-
relationship parameters, which can potentially be incorporated to improve the estimation of these parameters19. In this 
manuscript, our objective is to extend the RWT technique to integrate such known-ground-truth data and investigate 
whether incorporating this additional information can lead to improved performance in ranking QI methods.  
2. METHODS 
2.1 Theory  
Consider a scenario where 𝑃 patients are scanned by an imaging system. From the acquired data, 𝐾 QI methods are used 
to measure certain quantitative values. For the 𝑝௧௛ patient, the true quantitative value is denoted as 𝑎௣, the measured value 
yielded by the 𝑘௧௛ QI method is denoted as  𝑎ො௣,௞. Also, consider another study with 𝑄 samples is conducted in a ground-
truth-known setting, such as physical phantom study. The same 𝐾 QI methods are used to measure the quantitative values 
for these samples. For the 𝑞௧௛ physical phantom, denote the true quantitative value as 𝑑௤, the measured value yielded by 
the 𝑘௧௛ QI method as 𝑑መ௤,௞.  
Similar as previous RWT technique10–12, for the 𝑘௧௛ QI method, the measured values and true values are assumed to 
be linearly related by slope 𝑢௞, bias 𝑣௞ and a zero-mean Gaussian noise with standard deviation 𝜎௞. Thus, for the 
𝑝௧௛ patient, the relationship between true and measured values can be written as 
𝑎ො௣,௞= 𝑢௞𝑎௣+ 𝑣௞+ 𝒩(0, 𝜎௞
ଶ)
(1) 
For the 𝑞௧௛ physical phantom, the relationship between true and measured values can be written similarly as 
𝑑መ௤,௞= 𝑢௞𝑑௤+ 𝑣௞+ 𝒩(0, 𝜎௞
ଶ)
(2) 
For simplicity of notation, denote the measurements for the 𝑝௧௛ patient yielded by 𝐾 QI methods, ൛𝑎ො௣,௞, 𝑘= 1, … , 𝐾ൟ, 
by 𝑨෡௣, the measurements for the 𝑞௧௛ physical phantom, ൛𝑑መ௤
௞, 𝑘= 1, … , 𝐾ൟ, by 𝑫෡௤, the matrix containing slope and bias 
parameters, {𝑢௞, 𝑣௞, 𝑘= 1, … , 𝐾}, by 𝚯, the noise standard deviation parameters, {𝜎௞, 𝑘= 1, … , 𝐾}, by 𝚺. Based on Eq. 
(1)-(2), we can obtain the probability of observing 𝑨෡௣ and the probability of observing 𝑫෡௤, which both depend on the true 
value 𝑎௣ and true value 𝑑௤. For physical phantom study, we know the true value. However, for the patient data, the ground 
truth is unknown. To address this issue, we assume that the true values of the patient dataset are sampled from a parametric 
distribution characterized by 𝛀. We can then write the probability of observing the measurements of the 𝑝௧௛ patient, 𝑨෡௣, 
without access to the true value as 
pr൫𝑨෡௣|𝚯, 𝚺, 𝛀൯= නpr൫𝑨෡௣|𝑎௣, 𝚯, 𝚺൯pr൫𝑎௣|𝛀൯𝑑𝑎௣.
(3) 
where pr(𝑥) denotes the probability of a random variable 𝑥.  
Denote all the measurements for 𝑃 patients, ൛𝑨෡௣, 𝑝= 1, … , 𝑃ൟ, as 𝓐෡, all the true values for 𝑄 physical phantoms, 
൛𝑑௤, 𝑞= 1, … , 𝑄ൟ, as 𝑫 and all the corresponding measurements ൛𝑫෡௤, 𝑞= 1, … , 𝑄ൟ, as 𝓓෡. Assuming independence among

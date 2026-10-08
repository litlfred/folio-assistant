---
doc_id: arxiv-2403.16873v1
doc_title: "How accurately can quantitative imaging methods be ranked without ground truth: An upper bound on no-gold-standard evaluation"
section_id: sec-003-demonstrating-utility-of-the-proposed-framework
section_title: "Demonstrating utility of the proposed framework"
section_number: null
pages: 3-3
source_pdf: arxiv-2403.16873v1.pdf
source_sha256: c7e3e51b48a2ed8d
toc_source: outline
---
We applied the framework to guide the use of the RWT technique for evaluation of QI methods without gold
standards. Note that the RWT technique assumes a linear relationship between the measured quantitative values
and the true values, and the noise yielded by different QI methods is uncorrelated. The technique then uses
estimated noise-to-slope ratio to rank the different QI methods on the task of precisely estimating the underlying
quantitative value.7
We considered three hypothetical QI methods, in each of which, there was a linear relationship between the
true and measured values. More specifically, the values of slope were set to {0.6, 0.7, 0.8} for each of the three
methods. Similarly, the values of bias were set to {−0.1, 0, 0.1} and the values of noise standard deviation were
set to {0.03, 0.05, 0.08} for the three QI methods. The true values were sampled from a beta distribution. The
parameters for beta distribution, {α, β}, were set to {1.5, 2}. We used the proposed framework to compute the
upper bound for correctly ranking the three hypothetical QI methods as the number of patient samples that was
input to the RWT technique was varied. The number of patients was varied from 5 to 400.
For comparison, numerical studies were conducted to compute the experimental ranking performance of the
RWT technique. For each considered number of patients, we sampled true values from the beta distribution.
From these true values, we generated synthetic measurements for three hypothetical QI methods. These mea-
sured values were linearly related to the true values by the above slope, bias, and Gaussian noise term. The
measurements were then input into the RWT technique to obtain the estimates of the linear relationship param-
eters {Θ, Σ}. The FoM, which is the noise-to-slope ratio, was then computed to rank the QI methods based on
precision. We repeated the experiment for 100 noise realizations to compute the accuracy of the RWT technique

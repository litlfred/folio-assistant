---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-012-information-capacity
section_title: "Information Capacity"
section_number: null
pages: 16-17
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Since GPs are useful for learning an unknown function 𝑓through a dataset D, it is useful to know
how well we can learn 𝑓with a GP prior GP(0, 𝑘) through noisy observations of 𝑓with noise
variance 𝜎2
𝑛. This notion is termed information capacity. Intuitively, the information encoded
in the GP prior through the covariance function 𝑘determines the information content of 𝑓, while
the noise level 𝜎2
𝑛limits the amount of information provided by observations.
The information regarding 𝑓expressed through D can be described by the mutual information,
also known as the information gain:
MI(𝑌, 𝑓) := 1
2 log det(𝐼+ 𝜎−2
𝑛𝐾(𝑋, 𝑋)).
(4.7)
15
4 Gaussian Processes
The information capacity is then defined as the maximum information gain through a dataset
D = (𝑋,𝑌) of size 𝑇:
𝛾𝑇( 𝑓) := sup
|D|=𝑇
MI(𝑌, 𝑓).
(4.8)
As a motivating example, D could be obtained through a sequential decision-making process,
and we want to know how well we have learned about an unknown function 𝑓under some
observation noise 𝜎2
𝑛after 𝑇steps. If the function 𝑓is clear from the context, one can also
simply write this quantity as 𝛾𝑇.
For compact X ⊂R𝑑and a fixed 𝜎𝑛, we have the following, depending on the covariance
function 𝑘(Srinivas et al., 2010):
• Matérn with smoothness parameter 𝜈: 𝛾𝑡= O(𝑇𝛼(log𝑇)1−𝛼) where 𝛼= 𝑑/(2𝜈+ 𝑑).
• RBF: 𝛾𝑇= O((log𝑇)𝑑+1).
See Srinivas et al. (2010) for the detailed discussion. The intuition is as follows: The smoother
the function 𝑓is (i.e., as 𝜈increases), the less information we gain through new data points, since
we can already easily predict the function values on the other regions of X. Put another way,
smooth functions have less “surprise”.
The following result is an important application of the maximum information gain. We will
use it extensively in the subsequent chapters. Suppose we have selected 𝑇observations at context
points (𝑥𝑡)𝑇
𝑡=1. Let (𝜎2
𝑡(𝑥𝑡))𝑇
𝑡=1 be the predictive variance of 𝑥𝑡’s under the GP at each time step
𝑡. Through the chain rule for mutual information, the information capacity (4.8) can be written
as
MI(𝑌, 𝑓) = 1
2
𝑇
∑︁
𝑡=1
log

1 + 𝜎2
𝑡(𝑥𝑡)
𝜎2𝑛

.
(4.9)
Theorem 4.1 (Srinivas et al., 2010). Given 𝑚∈R, let 𝑘(𝑥, 𝑥) ≤𝑚for all 𝑥∈X. Then
P𝑇
𝑡=1 𝜎2
𝑡(𝑥𝑡) = O(𝛾𝑇). More specifically, P𝑇
𝑡=1 𝜎2
𝑡(𝑥𝑡) ≤
2𝑚
log(1+𝜎−2
𝑛𝑚) 𝛾𝑇.

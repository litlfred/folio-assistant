---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-10 
 
Step 2. Compute the priority vector (i.e., criteria weights in this step), using the eigenvalue 
method by solving the following equation. 
𝐌𝐀 𝐰∗= 𝜆max 𝐰∗ 
(8.8) 
Here, 𝜆max is the largest eigenvalue (known as the principal eigenvalue) of the pairwise 
comparison matrix, and 𝐰∗ is the corresponding principal eigenvector. The entries of this 
principal eigenvector are then normalized to sum to 1, yielding the criteria weights in this step, 
as follows. 
𝑤𝑗=
𝑤𝑗
∗
∑
𝑤𝑘
∗
𝑛
𝑘=1
,  𝑗= 1,2, … , 𝑛 
(8.9) 
Here, 𝑤𝑗
∗ and 𝑤𝑘
∗ represent the 𝑗𝑡ℎ and 𝑘𝑡ℎ entries of the principal eigenvector 𝐰∗, 
respectively, while 𝑤𝑗 denotes the final weight of criterion 𝑗. 
Numerical Calculations: 
Solve the following equation using computational tools such as WolframAlpha 
(https://www.wolframalpha.com/input?i=eigenvalue+calculator) or Python code: 
[
1
3
5
1 3
⁄
1
4
1 5
⁄
1 4
⁄
1
] 𝐰∗= 𝜆max𝐰∗ 
Use of WolframAlpha gives the principal eigenvalue 𝜆max = 3.086 and the corresponding 
principal eigenvector 𝐰∗= [
6.6943
2.9876
1
]. Note that when using different computational tools, the 
computed principal eigenvector may be scaled by a constant factor. 
Next, apply sum normalization to the principal eigenvector to derive the weights of the 3 
criteria (C1, C2, and C3), as follows. 
𝑤1 =
𝑤1
∗
∑
𝑤𝑘
∗
3
𝑘=1
=
6.6943
6.6943 + 2.9876 + 1 = 0.6267 
𝑤2 =
𝑤2
∗
∑
𝑤𝑘
∗
3
𝑘=1
=
2.9876
6.6943 + 2.9876 + 1 = 0.2797 
𝑤3 =
𝑤3
∗
∑
𝑤𝑘
∗
3
𝑘=1
=
1
6.6943 + 2.9876 + 1 = 0.0936 
As expected, these weights very much depend on the values given by decision-makers, for 
pairwise comparison of criteria. Further, the above weights are different from the arbitrarily 
assumed weight values in Table 8.1.

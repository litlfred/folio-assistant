---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-008
section_title: "Page 8"
pages: 8-8
pdf_page: 8
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-8 
 
5 
Essential or strong importance of x against y 
7 
Very strong importance of x against y 
9 
Extreme importance of x against y 
2, 4, 6, 8 
Intermediate value between adjacent scales 
Any decimal within [1, 9], 
e.g., 2.3 and 5.1 
Finer scale 
Reciprocals, e.g., 1/3 
and 1/7 
If event x has one of the above numbers assigned to it 
when compared with event y, then y has the reciprocal 
value when compared with x. 
 
In addition to determining the criteria weights, it is crucial to recognize that the AHP method 
can be directly utilized for decision-making (i.e., act as an MCDM method). For this, the 
conventional procedure is that decision-makers conduct subjective pairwise comparisons 
among alternatives with respect to each criterion, leading to 𝑛 number of 𝑚× 𝑚 pairwise 
comparison matrices. According to the original AHP method (Saaty, 1990), these pairwise 
comparisons among alternatives are purely subjective, sourced directly from the judgments of 
the decision-makers. For each 𝑚× 𝑚 pairwise comparison matrix, AHP calculates the local 
priority vector (sized 𝑚× 1) for alternatives with respect to the corresponding criterion using 
the eigenvalue method, analogous to the calculation of criteria weights at the beginning. 
Notably, a typical ACM containing objective quantitative data on different measurement scales 
(e.g., Table 8.1), rather than the subjective pairwise comparisons using Saaty’s 1–9 scale, is 
neither required nor immediately compatible with the AHP acting as an MCDM method. 
However, mapping the objective quantitative data (e.g., Table 8.1) to Saaty’s 1–9 scale and 
constructing 𝑛 number of 𝑚× 𝑚 pairwise comparison matrices, is feasible (Si et al., 2016). 
Subsequently, AHP iterates through all 𝑛 criteria, calculates, and amalgamates these local 
priority vectors (𝑚× 1) into a local priority matrix (𝑚× 𝑛), in which each row indicates the 
priority of an alternative with respect to all 𝑛 criteria. This 𝑚× 𝑛 local priority matrix is then 
multiplied by the 𝑛× 1 criteria weights vector (previously calculated by AHP or predefined by 
decision-makers), resulting in an 𝑚× 1 vector representing the global priorities of all 
alternatives. The alternative with the highest global priority value is top-ranked and 
recommended to decision-makers.  
The main procedural steps of the AHP method are summarized below. For completeness, we 
will go through the full AHP steps along with numerical calculations, starting with determining 
criteria weights, followed by calculating the local priority vectors of alternatives with respect to

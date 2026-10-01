---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-5 
 
𝑃𝑖= ∑𝑣𝑖𝑗
𝑛
𝑗=1
 
(8.4)  
Finally, the alternatives are ranked in descending order of 𝑃𝑖, with the highest value indicating 
the top-ranked alternative and recommended to the decision-maker. 
Numerical Calculations: 
For instance, for 𝑖= 1: 
𝑃1 = ∑𝑣1𝑗
3
𝑗=1
= 0.2500 + 0.2829 + 0.1517 = 0.6846 
Similarly, the performance scores of all alternatives are calculated as 𝑃1 = 0.6846, 𝑃2 =
0.6648, 𝑃3 = 0.8388, and 𝑃4 = 0.8290. Accordingly, the ranking is A3 ≻ A4 ≻ A1 ≻ A2, with 
A3 being the top-ranked alternative by SAW. 
 
The advantages of SAW are as follows. (1) It is one of the simplest MCDM methods, requiring 
only the sum of the normalized weighted criteria values, which makes it very straightforward 
to understand and implement (Wang et al., 2022). (2) Its computational procedure is relatively 
transparent, allowing decision-makers to easily observe how each criterion and weight 
contributes to the overall score. (3) Due to its simplicity, it can be readily applied in many fields, 
such as engineering, project selection, and resource allocation, where a quick ranking of 
alternatives is needed.  
The limitations of SAW are as follows. (1) Similar to other MCDM methods, rank reversal can 
occur if new alternatives are added or existing ones are removed, potentially affecting the 
stability of the ranking results. (2) It treats all performance values additively; high performance 
on one criterion is possible to completely compensate for low performance on another, which 
might be undesirable in certain decision-making scenarios. 
8.3 
Multiplicative Exponent Weighting (MEW) 
The MEW method, also known as the weighted product method (WPM), was introduced in 
Miller and Starr (1969). It is an MCDM technique that evaluates alternatives based on 
multiplicative aggregation. Unlike the SAW method, the MEW method uses the product of 
normalized criteria values raised to the power of their respective weights. The alternative that 
has a larger product value is ranked higher. 
Step 1. Normalize the original ACM with 𝑚 rows (i.e., alternatives) and 𝑛 columns (i.e., 
criteria) by using the Max normalization method. This step is the same as the Step 1 of the

---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-027
section_title: "Page 27"
pages: 27-27
pdf_page: 27
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-27 
 
values for all minimization criteria, for each alternative. These two sums are then aggregated 
using the method’s specific equations (Zavadskas et al., 1994) to determine each alternative’s 
performance score. The alternative with the highest performance score is top-ranked. 
Step 1. Normalize the original ACM with m rows (i.e., alternatives) and n columns (i.e., criteria) 
using Sum normalization method. 
𝐹𝑖𝑗=
𝑓𝑖𝑗
∑
𝑓𝑘𝑗
𝑚
𝑘=1
 
(8.18)  
Numerical Calculations (using ACM from Table 8.1): 
For instance, for 𝑖= 1 and 𝑗= 2: 
𝐹12 =
𝑓12
∑
𝑓𝑘2
𝑚
𝑘=1
=
600
600 + 700 + 500 + 400 = 0.2727 
Similar calculations are performed for all other values in the ACM across the 4 alternatives 
and 3 criteria. The complete results, forming the normalized ACM, are shown in Table 8.12. 
Table 8.12: Normalized ACM for COPRAS walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
0.3069 
0.2727 
0.3982 
A2 
0.1683 
0.3182 
0.3055 
A3 
0.2541 
0.2273 
0.1525 
A4 
0.2706 
0.1818 
0.1438 
 
Step 2. Construct the weighted normalized ACM by multiplying the values of each criterion 
with its assigned weight, 𝑤𝑗. 
𝑣𝑖𝑗= 𝐹𝑖𝑗× 𝑤𝑗 
(8.19)  
Numerical Calculations: 
For instance, for 𝑖= 1 and 𝑗= 2: 
𝑣12 = 𝐹12 × 𝑤2 = 0.2727 × 0.33 = 0.0900 
Likewise, calculations are carried out for all other values in the normalized ACM, using their 
respective assigned weights. The results, which constitute the weighted normalized ACM, 
are displayed in Table 8.13. 
Table 8.13: Weighted normalized ACM for COPRAS walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
0.0767 
0.0900 
0.1672

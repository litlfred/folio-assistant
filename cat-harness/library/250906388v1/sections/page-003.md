---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-3 
 
alternatives (i.e., 𝑚= 4 and 𝑖∈{1, 2, 3, 4}) and 3 criteria (i.e., 𝑛= 3 and 𝑗∈{1, 2, 3}). Out of 
the 3 criteria (C1, C2, and C3), C1 and C2 are benefit criteria to be maximized, while C3 is a 
cost criterion to be minimized. For illustration, the 3 criteria are assigned weights as: 𝑤1 = 0.25, 
𝑤2 = 0.33, and 𝑤3 = 0.42. All the 4 alternatives (A1, A2, A3, and A4) are non-dominated, 
which means that the improvement in one criterion will inevitably result in degradation in at 
least one other criterion (Wang et al., 2023). 
Table 8.1: ACM employed for illustration of aggregation-type MCDM methods (C1 and C2 for 
maximization; C3 for minimization). 
Alternatives 
C1 (Max) 
C2 (Max) 
C3 (Min) 
A1 
0.93 
600 
8.25 
A2 
0.51 
700 
6.33 
A3 
0.77 
500 
3.16 
A4 
0.82 
400 
2.98 
Weight 
0.25 
0.33 
0.42 
 
8.2 
Simple Additive Weighting (SAW) 
The SAW method, also known as the weighted sum method (WSM), described in 
MacCrimmon (1968), is one of the most fundamental and simple methods in MCDM. It is 
based on the principle that the top-ranked alternative is the one with the highest weighted sum 
of normalized criteria values (Nabavi et al., 2023), after converting minimization or cost criteria 
into maximization or benefit type. The method assumes that the criteria are compensatory, 
which means that a lower score in one criterion can be offset by a higher score in another. 
The steps in SAW are as follows. 
Step 1. Normalize the original ACM with 𝑚 rows (i.e., alternatives) and 𝑛 columns (i.e., 
criteria) by using the Max normalization method. For a maximization criterion, the normalized 
value, 𝐹𝑖𝑗 is obtained as: 
𝐹𝑖𝑗=
𝑓𝑖𝑗
𝑚𝑎𝑥
𝑘∈{1,2,...,𝑚}𝑓𝑘𝑗
 
(8.1)  
For a minimization criterion, the normalized value, 𝐹𝑖𝑗 is obtained as: 
𝐹𝑖𝑗=
𝑚𝑖𝑛
𝑘∈{1,2,...,𝑚}𝑓𝑘𝑗
𝑓𝑖𝑗
 
(8.2)  
The above normalization ensures that all minimization criteria are converted to maximization 
type, indicating that a higher 𝐹𝑖𝑗 always indicates a better performance (Nabavi et al., 2024).

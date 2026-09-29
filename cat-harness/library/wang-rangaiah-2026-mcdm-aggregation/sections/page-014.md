---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-14 
 
Apply Max normalization method, the original ACM is normalized and shown in Table 8.6. 
Table 8.6: Normalized ACM for AHP walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
1 
0.8571 
0.3612 
A2 
0.5484 
1 
0.4708 
A3 
0.8280 
0.7143 
0.9430 
A4 
0.8817 
0.5714 
1 
 
For instance, for 𝑗= 1: 
𝑟𝑚𝑎𝑥,1 =
𝑚𝑎𝑥
𝑖
𝐹𝑖1
𝑚𝑖𝑛
𝑖
𝐹𝑖1
=
1
0.5484 = 1.8235 
𝑟𝑚𝑖𝑛,1 =
𝑚𝑖𝑛
𝑖
𝐹𝑖1
𝑚𝑖𝑛
𝑖
𝐹𝑖1
= 1 
Next, under 𝑗= 1, let us compare A1’s normalized value (𝐹11) over A3’s normalized value 
(𝐹31), and perform logarithmic transformation: 
𝑎13 =
𝑙𝑛(𝐹11
𝐹31) −𝑙𝑛(𝑟𝑚𝑖𝑛,1)
𝑙𝑛(𝑟𝑚𝑎𝑥,1) −𝑙𝑛(𝑟𝑚𝑖𝑛,1) × (9 −1) + 1 
=
𝑙𝑛(
1
0.8280) −𝑙𝑛(1)
𝑙𝑛(1.8235) −𝑙𝑛(1) × (9 −1) + 1 
= 3.5140 
Symmetrically, we can obtain that 𝑎31 =
1
𝑎13 =
1
3.5140 = 0.2846.  
Likewise, the complete pairwise comparisons for all 4 alternatives under C1 are computed 
and presented in the first 5 columns of Table 8.7. The last column of Table 8.7 displays the 
calculated local priority scores (𝑣𝑖1) for alternatives under C1, solved using the eigenvalue 
method described in Step 2. Additionally, the consistency ratio, 𝐶𝑅 is computed as 0.0427 
(within acceptable threshold), obtained using the equation in Step 3. 
Table 8.7: Pairwise comparison matrix for alternatives under C1. 
 
A1 
A2 
A3 
A4 
Local priority 
score (𝑣𝑖1) 
A1 
1 
9.0000 
3.5140 
2.6762 
0.5296 
A2 
0.1111 
1 
0.1542 
0.1365 
0.0388 
A3 
0.2846 
6.4860 
1 
0.5441 
0.1741 
A4 
0.3737 
7.3238 
1.8378 
1 
0.2575

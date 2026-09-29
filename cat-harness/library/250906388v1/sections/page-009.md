---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-9 
 
each criterion, and finally aggregating the results to rank the alternatives. In the following, 
Steps 1 to 3 are for the criteria weights, and Steps 4 and 5 are for ranking the alternatives. 
Step 1. Construct the 𝑛× 𝑛 pairwise comparison matrix for 𝑛 criteria as follows. 
𝐌𝐀=
[
 
 
 
 
𝑎11
𝑎12
𝑎13
…
𝑎1𝑛
𝑎21
𝑎22
𝑎23
…
𝑎2𝑛
𝑎31
𝑎32
𝑎33
…
𝑎3𝑛
⋮
⋮
⋮
⋱
⋮
𝑎𝑛1
𝑎𝑛2
𝑎𝑛3
…
𝑎𝑛𝑛]
 
 
 
 
 
(8.6) 
• 
Here, 𝑖, 𝑗∈{1,2, … , 𝑛}, each entry 𝑎𝑖𝑗 represents the relative importance of criterion 𝑖 
compared to criterion 𝑗 by using Saaty’s 1–9 scale (in Table 8.4). 
• 
The leading diagonal entries (𝑎11, 𝑎22, 𝑎33, … , 𝑎𝑛𝑛) of this matrix are always equal to 
unity, that is, the relative importance of a criterion compared to itself is always 1. 
• 
The following equation always holds true (i.e., entries below the leading diagonal are 
the reciprocals of the corresponding entries above it), as per the last row of Table 8.4.  
𝑎𝑖𝑗= 1
𝑎𝑗𝑖
 
(8.7) 
• 
For instance, if we consider that the relative importance of criterion 1 versus criterion 
2 is moderate (i.e., 𝑎12 = 3), then relative importance criterion 2 to criterion 1 is its 
reciprocal (i.e., 𝑎21 = 1 3
⁄ ). Thus, only 
𝑛(𝑛−1)
2
 comparisons are needed to populate half 
of the matrix, with values of the other half obtained through simple reciprocals. 
Numerical Calculations: 
Instead of using the predefined weights presented in the last row of Table 8.1, suppose that 
the decision-maker provides the following subjective assessments for the 3 criteria (C1, C2, 
and C3) using Saaty’s 1–9 scale: 
• 
C1 is moderately more important than C2 (i.e., 𝑎12 = 3 and 𝑎21 = 1 3
⁄ ), meaning C1 
is 3 times as important as C2, while C2 holds only 1/3 the importance of C1. 
• 
C1 is strongly more important than C3 (i.e., 𝑎13 = 5 and 𝑎31 = 1 5
⁄ ). 
• 
C2 is rated between moderate and strong in importance relative to C3 (i.e., 𝑎23 = 4 
and 𝑎32 = 1 4
⁄ ). 
Based on these assessments, the 3 × 3 pairwise comparison matrix is as follows: 
𝐌𝐀= [
𝑎11
𝑎12
𝑎13
𝑎21
𝑎22
𝑎23
𝑎31
𝑎32
𝑎33
] = [
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
]

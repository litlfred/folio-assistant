---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-011
section_title: "Page 11"
pages: 11-11
pdf_page: 11
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-11 
 
Step 3. Check the consistency of the pairwise comparison matrix of 𝑛 criteria by calculating 
its consistency ratio (𝐶𝑅). 
𝐶𝐼= 𝜆𝑚𝑎𝑥−𝑛
𝑛−1
,  𝐶𝑅= 𝐶𝐼
𝑅𝐼 
(8.10) 
Here, 𝐶𝐼 is the consistency index, and 𝑅𝐼 (shown in Table 8.5) is the random 𝐶𝐼 value 
provided by Saaty (1990), who computed it by averaging the 𝐶𝐼 values from numerous 
randomly generated 𝑛× 𝑛 reciprocal matrices using Saaty’s 1–9 scale. If 𝐶𝑅≤0.1 , 
consistency is considered acceptable. If not, decision-makers should review and revise their 
given values for pairwise comparison of criteria. 
In addition, for a perfectly consistent pairwise comparison matrix (where each comparison 𝑎𝑖𝑗 
between criterion 𝑖 and criterion 𝑗 exactly equals the ratio of their resulting weights 𝑤𝑖𝑤𝑗
⁄
, 
which also implies that the transitive property holds, i.e., 𝑎𝑖𝑗𝑎𝑗𝑘= 𝑎𝑖𝑘 for all criteria 𝑖, 𝑗, and 𝑘), 
Saaty (1990) proved that the largest eigenvalue of this matrix is equal to the number of criteria, 
i.e., 𝜆max = 𝑛. 
Note on consistency analysis: Since we are dealing with human judgment for pairwise 
comparison matrix, it is inherently subjective and may sometimes be vague or inconsistent. 
For example, if a decision-maker prefers criterion 1 over criterion 2, and criterion 2 over 
criterion 3, then logically, he or she should prefer criterion 1 over criterion 3. This logical 
principle is known as the transitive property. However, in practice, due to cognitive biases or 
judgmental inconsistencies, decision-makers may unknowingly violate this property to some 
extent. 
Table 8.5: Saaty’s 𝑅𝐼 values; for 𝑛> 10, see Podvezko (2009). 
𝑛 
1 
2 
3 
4 
5 
6 
7 
8 
9 
10 
𝑅𝐼 
0 
0 
0.58 
0.90 
1.12 
1.24 
1.32 
1.41 
1.45 
1.49 
 
Numerical Calculations: 
In this example, with 𝑛= 3, refer to Table 8.5 and find the corresponding 𝑅𝐼= 0.58. 
𝐶𝐼= 𝜆max −𝑛
𝑛−1
= 3.086 −3
3 −1
= 0.0429 
𝐶𝑅= 𝐶𝐼
𝑅𝐼= 0.0429
0.58
= 0.074 
Since the calculated 𝐶𝑅 satisfies 𝐶𝑅≤0.1, the decision-maker’s subjective assessments 
for the 3 criteria are considered consistent and acceptable.

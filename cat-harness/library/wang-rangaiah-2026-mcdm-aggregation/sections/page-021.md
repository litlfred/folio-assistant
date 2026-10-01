---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-021
section_title: "Page 21"
pages: 21-21
pdf_page: 21
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-21 
 
Since 𝐺 influences all criteria (𝐶1, 𝐶2, 𝐶3): 
- 
Parent: 𝐺 
- 
Children: {𝐶1, 𝐶2, 𝐶3} 
Suppose the subjective assessment using Saaty's 1–9 scale are as follows: 
- 
𝐶1 and 𝐶2 are treated equally important (ratio 1:1) 
- 
𝐶3 is twice as important as 𝐶1, and also twice as important as 𝐶2 (ratios 2:1) 
Hence, the 3 × 3 pairwise comparison matrix of the 3 criteria under 𝐺 is constructed as 
follows: 
𝑀𝐺→(𝐶1,𝐶2,𝐶3) = (
1
1
0.5
1
1
0.5
2
2
1.0
) 
Same as the calculations in Step 2 of AHP, eigenvalue method is employed to determine the 
principal eigenvalue (𝜆max) and normalized principal eigenvector (i.e., criteria priorities or 
weights). Using WolframAlpha, 𝜆max is found to be 3.0. The corresponding criteria weights are 
as follows: 
𝑤𝐺→𝐶1 = 0.25, 𝑤𝐺→𝐶2 = 0.25, 𝑤𝐺→𝐶3 = 0.50. 
For brevity, the consistency ratio check is omitted here. Its computation follows the exact same 
procedure as in Step 3 of AHP. 
➢ Under the Criterion 1 node (𝑪𝟏): 
Since 𝐶1 influences both {𝐶2, 𝐶3} and (𝐴1, 𝐴2): 
- 
Parent: 𝐶1 
- 
Children: {𝐶2, 𝐶3, 𝐴1, 𝐴2} 
Besides, as aforementioned, when a node influences both the criteria and alternatives 
clusters, it devotes 75% of its influence to the alternatives and 25% to the criteria.  
Now, inside {𝐶2, 𝐶3} pairwise comparison, 𝐶2 is one-half as important as 𝐶3 (ratio 1:2). The 
comparison matrix is as follows: 
𝑀𝐶1→(𝐶2,𝐶3) = (1
1/2
2
1 ) 
For this matrix, 𝜆max = 2. The corresponding priorities are 0.3333 and 0.6667 for 𝐶2 and 𝐶3, 
respectively. Given that 𝐶1 allocates 25% of its influence to criteria cluster, weights are: 
𝑤𝐶1→𝐶2 = 0.3333 × 0.25 = 0.0833

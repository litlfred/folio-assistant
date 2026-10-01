---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-023
section_title: "Page 23"
pages: 23-23
pdf_page: 23
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-23 
 
𝑤𝐶3→𝐶2 = 0.25 × 0.25 = 0.0625 
Inside {𝐴1, 𝐴2}, 𝐴1 is twice as important as 𝐴2 (ratio 2:1). The corresponding priorities are 
0.6667 and 0.3333 for 𝐴1 and 𝐴2, respectively. Considering 75% of parent’s influence to the 
alternatives cluster, weights are: 
𝑤𝐶3→𝐴1 = 0.6667 × 0.75 = 0.50 
𝑤𝐶3→𝐴2 = 0.3333 × 0.75 = 0.25 
➢ Under the Alternative 1 node (𝐴1): 
Since 𝐴1 influences both 𝐶2 and 𝐶3 in a feedback loop: 
- 
Parent: 𝐴1 
- 
Children: {𝐶2, 𝐶3}. 
Inside {𝐶1, 𝐶2}, suppose ratio of 𝐶2:𝐶3 = 1: 2, thus: 
𝑤𝐴1→𝐶2 = 0.3333 
𝑤𝐴1→𝐶3 = 0.6667 
 
➢ Under the Alternative 2 node (𝐴2): 
Since 𝐴2 influences both 𝐶2 and 𝐶3 in a feedback loop: 
- 
Parent: 𝐴2 
- 
Children: {𝐶2, 𝐶3}. 
Inside {𝐶1, 𝐶2}, suppose ratio of 𝐶2:𝐶3 = 1: 1, thus: 
𝑤𝐴2→𝐶2 = 0.50 
𝑤𝐴2→𝐶3 = 0.50 
Step 3. Construct the weighted supermatrix (𝐖). 
The weighted supermatrix is formed by consolidating all the results from the previous step. It 
is termed “super’ because it incorporates all the nodes and their influences in the ANP 
network. In this supermatrix, as shown in Table 8.10 each column header represents a parent 
node; the entries in each column indicate the influence of the parent node on its child nodes; 
for node pairs that were not compared in the previous step, simply assign a value of 0. 
Table 8.10: ANP weighted supermatrix (𝐖).

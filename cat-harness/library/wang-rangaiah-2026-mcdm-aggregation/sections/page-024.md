---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-024
section_title: "Page 24"
pages: 24-24
pdf_page: 24
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-24 
 
 
𝐺 
𝐶1 
𝐶2 
𝐶3 
𝐴1 
𝐴2 
𝐺 
0 
0 
0 
0 
0 
0 
𝐶1 
0.25 
0 
0.125 
0.1875 
0 
0 
𝐶2 
0.25 
0.0833 
0 
0.0625 
0.3333 
0.50 
𝐶3 
0.50 
0.1667 
0.125 
0 
0.6667 
0.50 
𝐴1 
0 
0.5625 
0.25 
0.50 
0 
0 
𝐴2 
0 
0.1875 
0.50 
0.25 
0 
0 
 
Step 4. Compute the limit supermatrix (𝐖∞) as follows: 
𝐖∞= lim
𝑘→∞𝐖𝑘 
(8.17)  
As seen, the limit supermatrix is obtained by raising the weighted supermatrix to powers until 
convergence. This can be computed by repeatedly multiplying the weighted supermatrix by 
itself until it stabilizes. In essence, the limit supermatrix represents the long‐run steady‐state 
priorities in a network of feedback influences. Each column of the supermatrix tells us how a 
particular parent node distributes its influence among its child nodes. By raising the 
supermatrix to higher and higher powers, it is essentially simulating infinitely many rounds of 
mutual influence among the nodes. Once the matrix powers stabilize (converge), it indicates 
a steady-state distribution of influence. The entries in the columns of the resulting 𝐖∞, as 
shown in Table 8.11, can be interpreted as the overall priorities of each node under its parent 
node. In this example, all columns eventually converge to the same values; however, this may 
not be the case in all applications. 
Table 8.11: ANP limit supermatrix (𝐖∞). 
 
𝐺 
𝐶1 
𝐶2 
𝐶3 
𝐴1 
𝐴2 
𝐺 
0 
0 
0 
0 
0 
0 
𝐶1 
0.0797 
0.0797 
0.0797 
0.0797 
0.0797 
0.0797 
𝐶2 
0.1991 
0.1991 
0.1991 
0.1991 
0.1991 
0.1991 
𝐶3 
0.2926 
0.2926 
0.2926 
0.2926 
0.2926 
0.2926 
𝐴1 
0.2409 
0.2409 
0.2409 
0.2409 
0.2409 
0.2409 
𝐴2 
0.1876 
0.1876 
0.1876 
0.1876 
0.1876 
0.1876 
 
Next, from 𝐖∞, we extract the global priority scores for alternatives, 𝐴1:0.2409 and 
𝐴2: 0.1876, under the goal node 𝐺. After applying sum normalization, the normalized global 
priority score for 𝐴1 is 0.5622(= 0.2409/(0.2409 + 0.1876) and for 𝐴2 is 0.4378 (= 0.1876/

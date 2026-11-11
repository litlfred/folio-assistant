---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-013
section_title: "Page 13"
pages: 13-13
pdf_page: 13
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-13 
 
𝐹𝑖𝑗=
𝑚𝑖𝑛
𝑘∈{1,2,...,𝑚}𝑓𝑘𝑗
𝑓𝑖𝑗
 
(8.12)  
The above normalization transforms all minimization criteria to maximization type (i.e., a higher 
𝐹𝑖𝑗 always indicates a better performance). 
Next, for each criterion 𝑗, determine the largest ratio (𝑟𝑚𝑎𝑥,𝑗) and smallest ratio (𝑟𝑚𝑖𝑛,𝑗) after 
comparing each alternative’s normalized value with the minimum 𝐹𝑖𝑗 in that criterion: 
𝑟𝑚𝑎𝑥,𝑗=
𝑚𝑎𝑥
𝑖
𝐹𝑖𝑗
𝑚𝑖𝑛
𝑖
𝐹𝑖𝑗
,  𝑖∈{1,2, . . . , 𝑚} 𝑎𝑛𝑑 𝑗∈{1,2, . . . , 𝑛}  
(8.13)  
𝑟𝑚𝑖𝑛,𝑗=
𝑚𝑖𝑛
𝑖
𝐹𝑖𝑗
𝑚𝑖𝑛
𝑖
𝐹𝑖𝑗
= 1,  𝑖∈{1,2, . . . , 𝑚} 𝑎𝑛𝑑 𝑗∈{1,2, . . . , 𝑛} 
(8.14)  
Here, 𝑟𝑚𝑖𝑛,𝑗 always equals 1 because it is the ratio of minimum 𝐹𝑖𝑗 to itself. 
Then, for each criterion 𝑗, the pairwise comparison between alternative 𝑖 and 𝑘 (i.e., 𝑎𝑖𝑘) is 
mapped into Saaty’s 1–9 scale by using the logarithmic transformation as follows: 
When 𝐹𝑖𝑗≥𝐹𝑘𝑗,      𝑎𝑖𝑘=
𝑙𝑛(𝐹𝑖𝑗
𝐹𝑘𝑗) −𝑙𝑛(𝑟𝑚𝑖𝑛,𝑗)
𝑙𝑛(𝑟𝑚𝑎𝑥,𝑗) −𝑙𝑛(𝑟𝑚𝑖𝑛,𝑗) × (9 −1) + 1,  𝑖, 𝑘∈{1,2, . . . , 𝑚} 
(8.15)  
For cases of 𝐹𝑖𝑗< 𝐹𝑘𝑗 when comparing 𝐹𝑖𝑗 over 𝐹𝑘𝑗, its pairwise comparison value 𝑎𝑖𝑘 is 
obtained through simple reciprocal of the comparison of 𝐹𝑘𝑗 over 𝐹𝑖𝑗, since 𝑎𝑖𝑘=
1
𝑎𝑘𝑖.  
The reason logarithmic transformation is commonly used in this context is that Saaty’s 1–9 
scale is meant to convey a ratio of importance (1 means equal, 3 means moderate, 9 means 
extreme, etc.). A logarithmic transformation preserves these multiplicative (ratio) relationships. 
For example, comparing 𝐹𝑖𝑗= 0.2 and 𝐹𝑘𝑗= 0.1, their ratio 
𝐹𝑖𝑗
𝐹𝑘𝑗 is 2, thus 𝑙𝑛(
𝐹𝑖𝑗
𝐹𝑘𝑗) = 0.693; 
similarly, comparing 𝐹𝑖𝑗= 0.9 and 𝐹𝑘𝑗= 0.45, their ratio 
𝐹𝑖𝑗
𝐹𝑘𝑗 is also 2 and 𝑙𝑛(
𝐹𝑖𝑗
𝐹𝑘𝑗) = 0.693. 
Since both comparisons yield the same logarithmic value, the pairwise comparison value 𝑎𝑖𝑘 
remains the same in both cases. 
Once the pairwise comparison matrices for all alternatives under each criterion are 
constructed, the eigenvalue method equation from Step 2 can be re-used to compute the local 
priority scores (𝑣𝑖𝑗), which are derived by applying the sum normalization to the obtained 
principal eigenvector. In addition, the equation from Step 3 is re-used to calculate the 
consistency ratios of the matrices. 
Numerical Calculations (using ACM from Table 8.1):

---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-032
section_title: "Page 32"
pages: 32-32
pdf_page: 32
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-32 
 
best alternative based on rank aggregation. It works by assigning ranks to alternatives with 
respect to each criterion and then computing a weighted sum of these ranks. The alternative 
with the smallest aggregated rank is top-ranked and recommended to the decision-maker 
(Wang & Rangaiah, 2017). Thus, no normalization of criteria values is required. 
Step 1. Rank the alternatives for each criterion. Each alternative is assigned a rank with 
respect to every criterion, denoted as 𝑟𝑖𝑗, based on its performance under that criterion, as 
follows: 
• 
Rank 1 is assigned to the best alternative. 
• 
Rank 2 is assigned to the next best alternative. 
• 
…. 
• 
Rank 𝑚 (where 𝑚 is the number of alternatives) is assigned to the worst alternative.  
The ranking assignment depends on whether the criterion is of a benefit or cost type. For 
benefit criteria (maximization), the best alternative is the one with the highest value, receiving 
rank 1, while the worst receives rank 𝑚. Conversely, for cost criteria (minimization), the best 
alternative is the one with the lowest value, receiving rank 1, while the worst receives rank 𝑚. 
Numerical Calculations (using ACM from Table 8.1): 
For instance, for 𝑖= 2 and 𝑗= 1, by inspecting Table 8.1, we can easily find the rank of A2 
under C1 is: 𝑟21 = 4. Similar rankings are performed for all other values in the ACM across 
the 4 alternatives and 3 criteria. The complete results are shown in Table 8.17. 
Table 8.17: Rank of alternatives under each criterion for FUCA walkthrough. 
Alternatives 
C1 
C2 
C3 
A1 
1 
2 
4 
A2 
4 
1 
3 
A3 
3 
3 
2 
A4 
2 
4 
1 
 
Step 2. Compute the aggregated ranks. Once the rankings under each criterion are assigned, 
a weighted rank summation of all criteria (𝑅𝑖) is performed for each alternative. 
𝑅𝑖= ∑(𝑟𝑖𝑗× 𝑤𝑗)
𝑛
𝑗=1
 
(8.26)  
The alternative with the smallest 𝑅𝑖 is top-ranked and recommended to the decision-maker.

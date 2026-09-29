---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-031
section_title: "Page 31"
pages: 31-31
pdf_page: 31
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-31 
 
A2 
0.0825 
0.2058 
0.2359 
A3 
0.1245 
0.1470 
0.1178 
A4 
0.1326 
0.1176 
0.1111 
 
Step 3. Compute the performance score (𝑃𝑖) of each alternative as follows. 
𝑃𝑖= ∑
𝑣𝑖𝑗
𝑔
𝑗=1
−∑
𝑣𝑖𝑗
𝑛
𝑗=𝑔+1
 
(8.25)  
Here, significance of 𝑔 is the same as that in COPRAS method, meaning that 𝑔 is the number 
of maximization criteria, which can be arranged in the first 𝑔 columns of the weighted 
normalized ACM. The minimization criteria are in columns 𝑔+ 1 to 𝑛.  The alternative with the 
largest 𝑃𝑖 is top-ranked and recommended to the decision-maker. The performance score in 
Eq. 8.25 is somewhat simpler than that in COPRAS method (Eq. 8.22). 
Numerical Calculations: 
There are 2 maximization criteria, hence 𝑔= 2. For instance, for 𝑖= 1: 
𝑃1 = ∑
𝑣1𝑗
2
𝑗=1
−∑
𝑣1𝑗
3
𝑗=2+1
= 0.1504 + 0.1764 −0.3075 = 0.0193 
Similarly, the performance scores for all alternatives are calculated as 𝑃1 = 0.0193, 𝑃2 =
0.0523, 𝑃3 = 0.1537, 𝑃4 = 0.1391. Accordingly, the ranking is A3 ≻ A4 ≻ A2 ≻ A1, with A3 
being the top-ranked alternative by MOORA. Note that some or all 𝑃𝑖 can be negative (e.g., 
if all/majority of criteria are minimization type). 
 
The advantages of MOORA are as follows. (1) It employs a straightforward mathematical 
formulation where the performance of each alternative is determined by summing weighted 
benefit criteria and then subtracting weighted cost criteria, making it easy to interpret. (2) The 
steps are relatively simple, which allows for efficient implementation across a wide variety of 
decision-making contexts. 
The limitations of MOORA are as follows. (1) Similar to COPRAS, a single high or low value 
in one criterion can disproportionately influence the final performance score, which may be 
undesirable for decisions requiring a balanced performance across all criteria. (2) As with other 
MCDM methods, the addition or removal of alternatives may cause rank reversal. 
8.8 
Faire Un Choix Adéquat (FUCA) 
FUCA is the French acronym for "Faire Un Choix Adéquat", which translates to "Make an 
Adequate Choice". The FUCA method, proposed by Fernando et al. (2011), determines the

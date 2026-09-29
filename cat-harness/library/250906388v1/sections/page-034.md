---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-034
section_title: "Page 34"
pages: 34-34
pdf_page: 34
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-34 
 
Step 2. Calculate the performance score (𝑃𝑖) for each alternative by integrating additive (as in 
the SAW method) and multiplicative (as in the MEW method) components, as follows. The 
alternative with the largest 𝑃𝑖 is top-ranked and recommended to the decision-maker. 
𝑃𝑖= 𝜆∑𝐹𝑖𝑗𝑤𝑗
𝑛
𝑗=1
+ (1 −𝜆) ∏𝐹𝑖𝑗
𝑤𝑗
𝑛
𝑗=1
 
(8.27) 
Here, 𝜆∈[0, 1] is a parameter that balances between the additive and multiplicative 
components. When 𝜆= 1, WASPAS reduces to a purely additive approach (i.e., SAW). When 
𝜆= 0, it simplifies to a fully multiplicative approach (i.e., MEW). Intermediate 𝜆 values allow a 
flexible combination of both approaches. Commonly, 𝜆= 0.5 is chosen to give equal priority 
to both SAW and MEW components. 
Numerical Calculations: 
For instance, for 𝑖= 1 and 𝜆= 0.5, using the normalized criteria values in Table 8.2: 
𝑃1 = 0.5 ∑𝐹1𝑗𝑤𝑗
3
𝑗=1
+ 0.5 ∏𝐹1𝑗
𝑤𝑗
3
𝑗=1
 
= 0.5(1 × 0.25 + 0.8571 × 0.33 + 0.3612 × 0.42) + 0.5(10.25 × 0.85710.33 × 0.36120.42) 
= 0.6521 
Similarly, the performance scores for all alternatives are calculated as 𝑃1 = 0.6521, 𝑃2 =
0.6460, 𝑃3 = 0.8358, 𝑃4 = 0.8173. Accordingly, the ranking is A3 ≻ A4 ≻ A1 ≻ A2, with A3 
being the top-ranked alternative by WASPAS. 
 
The advantages of WASPAS are as follows. (1) It involves straightforward calculations, 
making it easy to implement and computationally efficient. (2) By integrating SAW and MEW, 
WASPAS takes advantage of each method’s strengths: the SAW part helps maintain clarity 
and proportional scaling, while the MEW part ensures no single criterion is completely 
overshadowed by extremely high values in others.  
The limitations of WASPAS are as follows. (1) The final ranking can be affected by the choice 
of 𝜆 value, which itself becomes an additional decision-making challenge. (2) If a criterion 
value is zero or extremely small for an alternative, the multiplicative component can 
excessively penalize it. (3) Similar to other MCDM methods, the addition or removal of 
alternatives can affect rankings, potentially leading to rank reversals. 
8.11  Summary 
Main points in this chapter on aggregation-type MCDM methods are as follows.

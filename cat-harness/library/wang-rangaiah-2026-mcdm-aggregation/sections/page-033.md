---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-033
section_title: "Page 33"
pages: 33-33
pdf_page: 33
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-33 
 
Numerical Calculations: 
For instance, for 𝑖= 4: 
𝑅4 = ∑(𝑟4𝑗× 𝑤𝑗)
3
𝑗=1
= 2 × 0.25 + 4 × 0.33 + 1 × 0.42 = 2.24 
Similarly, the aggregated ranks for all alternatives are calculated as 𝑅1 = 2.59, 𝑅2 = 2.59, 
𝑅3 = 2.58, 𝑃4 = 2.24. Accordingly, the ranking is A4 ≻ A3 ≻ A1 = A2, with A4 being the top-
ranked alternative by FUCA. Note that 𝑅𝑖 can have the same value for 2 or more 
alternatives. 
 
The advantages of FUCA are as follows. (1) It is easy to understand and implement, requiring 
only ranking assignments and simple weighted summation calculations. (2) Since FUCA ranks 
alternatives directly instead of normalizing numerical values for each criterion, it eliminates the 
dependence of ranking on the normalization method. This helps avoid issues such as possibly 
drastic changes in normalized values when ACM is updated. (3) FUCA is less sensitive to 
extreme values as it considers only rankings and not absolute magnitudes. 
The limitations of FUCA are as follows. (1) Since FUCA relies solely on ranks, it does not 
account for the actual differences between alternative performances. A small difference in 
criteria values may be treated the same as a large difference (i.e., in terms of ranking 
difference). (2) In cases where multiple alternatives have the same criterion value, additional 
tie-breaking rules must be defined, which can introduce subjectivity. (3) FUCA is still 
susceptible to rank reversal when new alternatives are introduced or existing ones are 
removed, as the reassignment of ranks for each criterion may alter the relative positioning of 
alternatives. 
8.9 
Weighted Aggregated Sum Product Assessment (WASPAS) 
The WASPAS method, introduced in Zavadskas et al. (2012), is a hybrid MCDM approach 
that combines both the SAW and MEW methods in its algorithm. It calculates a composite 
performance score for each alternative by blending the additive results from SAW with the 
multiplicative results from MEW. By integrating these two different perspectives, WASPAS 
aims to leverage the strengths of each method while mitigating their individual shortcomings. 
The procedure of the WASPAS method consists of the following steps. 
Step 1. Normalize the original ACM with 𝑚 rows (i.e., alternatives) and 𝑛 columns (i.e., 
criteria) by using Max normalization. This step is the same as the Step 1 of the SAW and 
MEWS methods (Sections 8.2 and 8.3). For the sake of brevity, the normalization equations 
and numerical calculations (same as Table 8.2) are not repeated here.

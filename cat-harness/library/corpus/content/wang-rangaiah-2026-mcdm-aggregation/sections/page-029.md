---
doc_id: wang-rangaiah-2026-mcdm-aggregation
doc_title: "wang-rangaiah-2026-mcdm-aggregation"
section_id: page-029
section_title: "Page 29"
pages: 29-29
pdf_page: 29
source_pdf: wang-rangaiah-2026-mcdm-aggregation.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-29 
 
𝑃𝑖=
{
  
 
  
 𝑆𝑖+ +
∑
𝑆𝑘−
𝑚
𝑘=1
𝑆𝑖−∑
1
𝑆𝑘−
𝑚
𝑘=1
,
if both maximization and minimization criteria exist
𝑆𝑖+,
if only maximization criteria exist
∑
𝑆𝑘−
𝑚
𝑘=1
𝑆𝑖−∑
1
𝑆𝑘−
𝑚
𝑘=1
,
if only minimization criteria exist
 
(8.22)  
In the above equation, both ∑
𝑆𝑘−
𝑚
𝑘=1
 and ∑
1
𝑆𝑘−
𝑚
𝑘=1
 are invariant across the performance score 
(𝑃𝑖) calculations for each alternative 𝑖, and so the term 
∑
𝑆𝑘−
𝑚
𝑘=1
𝑆𝑖−∑
1
𝑆𝑘−
𝑚
𝑘=1
 can be considered as a 
scaled 𝑆𝑖− value. Further, a smaller 𝑆𝑖− leads to a higher 𝑃𝑖 value. The alternative with the 
largest 𝑃𝑖 is top-ranked and recommended to the decision-maker. 
Numerical Calculations: 
For instance, for 𝑖= 1, since both maximization and minimization criteria exist: 
𝑃1 = 𝑆1+ +
∑
𝑆𝑘−
𝑚
𝑘=1
𝑆1−∑
1
𝑆𝑘−
𝑚
𝑘=1
= 0.1667 +
0.1672 + 0.1283 + 0.0641 + 0.0604
0.1672 (
1
0.1672 +
1
0.1283 +
1
0.0641 +
1
0.0604)
= 0.2214 
Similarly, performance scores for all alternatives are calculated and given in the last column 
of Table 8.14. Accordingly, the ranking is A3 ≻ A4 ≻ A1 ≻ A2, with A3 being the top-ranked 
alternative by COPRAS. 
 
The advantages of COPRAS are as follows. (1) COPRAS explicitly separates benefit (to be 
maximized) and cost (to be minimized) criteria, making it intuitive for decision-makers to see 
how each criterion contributes to or detracts from the final performance score of an alternative. 
(2) COPRAS has been successfully adopted in many applications (Stefano et al., 2015). 
The limitations of COPRAS are as follows. (1) Because the final performance score is largely 
driven by the sum of weighted normalized values, exceptionally high (or low) performance on 
one criterion may greatly overshadow moderate performance on other criteria, which may not 
be desirable in some applications. (2) As with other MCDM methods, the addition or removal 
of alternatives may cause rank reversal. 
8.7 
Multi-Objective Optimization on the basis of Ratio Analysis (MOORA) 
The MOORA method, introduced by Brauers and Zavadskas (2006), is extensively applied in 
various fields for MCDM. After constructing the weighted normalized ACM, the performance 
score for each alternative is calculated by subtracting the aggregate of minimization criteria 
values from the aggregate of maximization criteria values. The alternative that has a larger

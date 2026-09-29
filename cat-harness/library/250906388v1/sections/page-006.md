---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-6 
 
SAW method. For the sake of brevity, the normalization equations and numerical calculations 
(same as Table 8.2) are not repeated here. 
Step 2. Calculate the performance score (𝑃𝑖) for each alternative using the multiplicative 
aggregation equation as follows. 
𝑃𝑖= ∏𝐹𝑖𝑗
𝑤𝑗
𝑛
𝑗=1
 
(8.5) 
The alternative with the largest 𝑃𝑖 is top-ranked and recommended to the decision-maker. 
Numerical Calculations: 
For instance, for 𝑖= 1 and using normalized ACM in Table 8.2: 
𝑃1 = ∏𝐹1𝑗
𝑤𝑗
𝑛
𝑗=1
= 1.00000.25 × 0.85710.33 × 0.36120.42 = 0.6197 
Similarly, the performance scores for all alternatives are calculated as 𝑃1 = 0.6197, 𝑃2 =
0.6271, 𝑃3 = 0.8329, and 𝑃4 = 0.8056. Accordingly, the ranking is A3 ≻ A4 ≻ A2 ≻ A1, with 
A3 being the top-ranked alternative by MEW. In this example, the top-ranked alternative, 
namely A3, is the same by both SAW and MEW. However, this may not always be the case 
in other applications. 
 
The advantages of MEW are as follows. (1) As it uses a multiplicative aggregation, an 
alternative must perform reasonably well in each criterion to achieve a high overall 
performance score; this property helps avoid the possible excessive compensation (i.e., very 
high performance in one criterion fully offsets poor performance in another, as can occur in 
SAW). (2) Conceptually, MEW is straightforward, and decision-makers can easily understand 
the mechanics of how each criterion contributes to the final performance score. (3) Due to its 
multiplicative structure, MEW is sensitive to extreme degradation in a particular criterion, as a 
low value can substantially reduce the overall product. This characteristic makes it well-suited 
for risk-averse applications. 
The limitations of MEW are as follows. (1) If the performance on a single criterion is zero (or 
extremely small) for a particular alternative, the product becomes zero (or very close to zero), 
effectively disqualifying that alternative regardless of its performance on other criteria. (2) Like 
other MCDM methods, rank reversal can still occur if new alternatives are introduced or 
existing ones are deleted, since the normalization step and multiplicative aggregation can shift 
the overall scale and relative scores among alternatives. 
8.4 
Analytic Hierarchy Process (AHP)

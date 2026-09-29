---
doc_id: 250906388v1
doc_title: "2509.06388v1"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: 2509.06388v1.pdf
source_sha256: 48123c8812890b17
text_source: embedded
granularity: page
---
Preliminary Draft Manuscript 
 
8-1 
 
Chapter 8 
Multi-Criteria Decision-Making: Aggregation-Type Methods 
Zhiyuan Wanga, Gade Pandu Rangaiahb, c 
a School of Business, Singapore University of Social Sciences, Singapore 599494, 
Singapore 
b Department of Chemical and Biomolecular Engineering, National University of Singapore, 
Singapore 117585, Singapore 
c School of Chemical Engineering, Vellore Institute of Technology, Vellore 632014, India 
 
Abstract 
This chapter describes selected aggregation-type multi-criteria decision-making (MCDM) 
methods that convert an alternatives-criteria matrix (ACM) into a single performance score per 
alternative through additive, multiplicative or hybrid manipulations, for ranking the alternatives. 
The 8 methods are: Simple Additive Weighting (SAW), Multiplicative Exponent Weighting 
(MEW), Analytic Hierarchy Process (AHP), Analytic Network Process (ANP), Complex 
Proportional Assessment (COPRAS), Multi-Objective Optimization on the basis of Ratio 
Analysis (MOORA), Faire Un Choix Adéquat (FUCA) and Weighted Aggregated Sum Product 
Assessment (WASPAS). This chapter details the algorithm of each method step-by-step, 
illustrating every procedure with a common ACM example and full numerical calculations. 
Practical strengths and weaknesses of every method are outlined. A consolidated summary 
shows how different methods can lead to variations in the final rankings. This chapter enables 
the readers to: (1) explain the principles and algorithms of aggregation-type methods covered, 
(2) implement them on an ACM, and (3) select one or more suitable aggregation-type MCDM 
methods for their applications. 
8.1  
Overview 
For a given alternatives-criteria matrix (ACM), multi-criteria decision-making (MCDM) serves 
as an effective approach for selecting the best alternative(s) from the matrix (Baydaş et al., 
2024). Among the diverse MCDM methodologies, this chapter focuses on aggregation-type 
MCDM methods. These methods compute an overall performance score for each alternative 
by aggregating the values of all criteria using different principles or formulations (Wang et al., 
2024). The aggregation process typically follows either an additive, multiplicative, or hybrid

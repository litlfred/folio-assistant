---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-005-swe-router-proposed
section_title: "SWE-ROUTER (proposed)"
section_number: null
pages: 2-2
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
𝑲 exploration steps of code base using cheap 𝒎𝟏
Task
𝒒
Turn 1
Though
Action
Observation
Turn K
Though
Action
Observation
Partial trajectory 𝒯≤𝑲from weak model m₁
Value head ො𝒓(𝒯≤𝑲) 
Continue with 𝑚1 
Switch to 𝑚2
Weaker, cheaper 
LLM 𝑚1
Stronger, expensive
LLM 𝑚2
⋯
Well-informed 
accurate routing
Predict 𝑃𝑚1 success
High
Low
Figure 1. SWE-Router overview. A weak (cheap) model m1 runs for several exploratory turns; a learned value head reads the resulting
partial trajectory and predicts whether m1 will eventually solve the task. If the predicted probability exceeds a cost-adjusted threshold,
m1 continues; otherwise the strong (expensive) model m2 is invoked from the original prompt q. Conditioning on the partial trajectory —
rather than on q alone — breaks the information-theoretic ceiling that prompt-only routers face (Theorem 4.1).

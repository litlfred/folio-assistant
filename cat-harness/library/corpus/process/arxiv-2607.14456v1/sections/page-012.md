---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
A.2. Workflow Summary Table
Workflow
Brief Overview
Nodes
Edges
Cart
Online retail order fulfillment process covering cart validation, payment
authorisation, inventory reservation, shipping, delivery monitoring, and
refund/reorder handling.
52
60
Cost
Fraud cost optimisation workflow that evaluates rules, checks fraud flags,
payment status, and recoverability to compute operational costs and penal-
ties.
12
15
Deal
Black Friday deal locator that routes based on user preferences (online/in-
store), fetches deals, filters by relevance, and presents ranked results.
11
13
Labelling
User disengagement classification workflow that checks eligibility, funding
status, and account closure to assign “Disengaged” or “Exclude” labels.
13
16
News
News article collection pipeline that queries multiple providers, validates
responses, applies filters, and aggregates results with run metrics.
34
38
Risk
Risk and opportunity classifier that computes risk/opportunity scores, applies
threshold checks, assigns priority levels, and persists classification records.
23
25
Social Media
Social media signal collector that fetches posts across platforms, nor-
malises fields, filters by language/region/content type, and builds aggregated
datasets.
25
29
Promotion
Customer promotion workflow that fetches profiles, validates eligibility,
retrieves order history and loyalty points, segments customers by value tier,
calculates discounts, generates recommendations, and sends notifications
based on urgency.
18
19
Tournament
Tournament registration process that validates player eligibility, checks slot
availability, submits registration, and confirms or rejects enrollment.
14
17
Weather
Weather forecast workflow that fetches weather data, validates retrieval,
parses conditions, and displays either severe alerts or regular forecasts.
9
10
Table 1. Summary of the ten deterministic BPMN workflows used for evaluation. Nodes include tasks, gateways, and start/end events;
edges represent sequence flows between nodes.
12

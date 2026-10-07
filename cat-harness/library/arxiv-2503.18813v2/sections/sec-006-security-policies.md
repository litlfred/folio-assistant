---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-006-security-policies
section_title: "Security Policies"
section_number: null
pages: 7-7
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
- send_email: only if recipient is trusted
  - get_last_email: always allowed
  - ...
Value
Readers
Sources
email
user, email
readers
get_last_ema
address user, email
readers
query_ai_ass
Depends on
Maintain
Enforce policies
based on capabilities
Figure 5 | Diagram illustrating how CaMeL processes a user’s query. First, the P-LLM generates
code that expresses the submitted query. Then, the CaMeL interpreter constructs and updates a data
flow graph, checks security policy based on code execution, and either executes or blocks tools. The
Q-LLM is used to parse untrusted data while interpreting the code.

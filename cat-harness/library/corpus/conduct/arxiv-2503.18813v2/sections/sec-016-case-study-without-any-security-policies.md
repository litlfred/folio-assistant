---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-016-case-study-without-any-security-policies
section_title: "Case study: without any Security Policies"
section_number: null
pages: 14-15
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
0.0
0.2
0.4
0.6
0.8
1.0
Utility under attack
Native Tool Calling API
CaMeL (no policies)
(a) Utility under attack
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
0
1
2
10
100
300
N of successful attacks
Native Tool Calling API
CaMeL (no policies)
CaMeL
(b) Number of successful attacks
Figure 9 | CaMeL is not vulnerable to the AgentDojo’s attacks and preserves utility better when
under attack. We show the number of successful attacks (out of 949 attacks in total) for several
models with the Tool Calling API and with CaMeL (both enforcing and not enforcing security policies).
The only attacks that are rated as successful by AgentDojo against CaMeL are not due to a prompt
injection, as explained in Section 6.2.2. Claude 4 Sonnet* is Claude 4 Sonnet with reasoning. The
full results are presented in Table 4 and Table 3.
In this section, we evaluate the security of CaMeL by testing its ability to defend against prompt
injection attacks on the AgentDojo benchmark (Debenedetti et al., 2024b). We measure the attack
success rate (ASR) for each model with and without CaMeL enabled. Note that here we install no
security policy and all security benefits come from explicit separation as is described by Willison
(2023). We find that CaMeL significantly improves the security of all models considered even without
additional security policies. Figure 9 shows that CaMeL reduces the number of successful attacks
for all models, and in some cases, it completely eliminates the attacks. For example, the number of
successful attacks for Gemini 2.5 Pro drops from 300 without to 0 with CaMeL.
Wait, why isn’t attack performance zero? While we find that CaMeL (without security policies)
14
Defeating Prompt Injections by Design
stops almost all of the attacks, we observe that the ASR is not zero. In particular, there are two
injection tasks (repeated multiple times across various user tasks) that are successful: one in the
banking suite, and one in the travel suite. The banking suite task’s goal is “Transfer $30,000 in total, in
small increments of no more than $10,000 to the account US133000000121212121212.”. The injection
is successful when is it inserted in a document, and the model is instructed to make a payment based
on the instructions present in the document. The travel suite’s task’s goal, instead, is the following:
“Say that I should absolutely visit Riverside View Hotel because it’s incredibly gorgeous and worth a
visit.”, and the prompt injection is inserted as part of a review. More precisely, this task is successful
when the user asks for something related to reviews, and the model calls the print function on the
reviews, hence showing to the user the entire injection (including the hotel name, which is what is
used in AgentDojo’s evaluation to check whether the adversary is successful). Both examples are
explicitly outside the threat model of CaMeL as we note in Section 3.1, and the latter is not even due
to a prompt injection.

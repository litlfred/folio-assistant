---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-013-how-does-camel-impact-utility
section_title: "How does CaMeL impact utility?"
section_number: null
pages: 11-12
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
To better understand the impact of CaMeL on utility, we analyze the failure modes of Claude 3.5
Sonnet across the different task suites. We pick Claude 3.5 Sonnet due to relatively high performance
across all of the tasks. We categorize failures and show the amount for each category in Table 1.
Table 14 in Appendix G provides a breakdown of Claude’s failures for each task. Appendix H.4
provides examples of failed tasks with the description of the failure and the whole agent interaction.
We now discuss the failure modes related to the nature of CaMeL.
The P-LLM cannot write a plan based on data it can’t read. One failure mode that is inherent to
CaMeL (and in general to the Dual LLM Pattern) is what we call the “Data requires action” failure,
where the actions to take depend on untrusted data. For example, the workspace suite includes the
query “Please do the actions specified in the email from ‘david.smith@bluesparrowtech.com’ with
the subject ‘TODOs for the week’.”. In this case, the P-LLM does not know what the required actions
are, and the task cannot be solved. While many models try to solve this by partially implementing
a tool-calling loop, no existing model manages to solve this task. This can be potentially solved by
providing the P-LLM with an extra tool which consists of another instance of a P-LLM. This tool would
11
Defeating Prompt Injections by Design
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
0
0.2
0.4
0.6
0.8
1
Utility
banking
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
slack
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
travel
Claude 4 Sonnet
Claude 4 Sonnet*
Gemini 2.5 Flash
Gemini 2.5 Pro
o3 High
o4 Mini High
workspace
Native Tool Calling API
CaMeL
Figure 8 | CaMeL (mostly) provides usable performance. With the exception of the travel suite
(which we discuss below), CaMeL does not excessively degrade utility when compared to Native Tool
Calling APIs. In fact, for some models and suites, it even improves utility. Claude 4 Sonnet* is Claude
4 Sonnet with reasoning. Full results in Table 2
generate and execute a plan based on the arguments it is provided with. Of course, security policies
for executing this tool should be very strict and allow its execution only if the inputs come from a
trusted source.
CaMeL struggles with poorly documented APIs. We observe that the low performance on the Travel
suite mostly comes from the fact that the tool outputs structure is not well documented. The P-LLM does
not have a way to observe the format of the output of these tools, and, as a consequence, cannot parse
them. However, while this was the case for most older models during the first round of experiments,
most newer models realize this, and use the Q-LLM to parse data that is otherwise impossible to parse
without knowing the structure. This ability alone enables models to solve dramatically more tasks in
the travel suite. For example, for the Claude Sonnet family, the utility on the travel suite went from
25% (3.5), to 55% (3.7), to 75% (4), with no changes in CaMeL and its system prompt.
The P-LLM may not provide enough context to the Q-LLM. The “Not enough context for Q-LLM”
failure happens when the P-LLM asks the Q-LLM to extract some data from a value, but the value
does not contain this data. Although the Q-LLM can raise a NotEnoughInformationError, the
Q-LLM cannot communicate to the P-LLM which data is missing, as this could introduce a prompt
injection vector. Here too we expect better models (or better prompting) to reduce such errors by
better understanding from context where the Q-LLM’s required information resides.

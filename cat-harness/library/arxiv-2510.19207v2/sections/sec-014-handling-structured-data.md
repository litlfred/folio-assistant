---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-014-handling-structured-data
section_title: "Handling Structured Data"
section_number: null
pages: 6-7
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
After getting the DataFilter, we deploy it with a backend
LLM in various applications. In agentic applications, data is
often in a structured format. For example, tools may return
data in JSON format [23]. Directly filtering the entire JSON
string can sometimes output syntactically invalid JSON.
Fortunately, we usually know which part could be a JSON
input in agents, e.g., if a message comes from the tools, it has
to be in the JSON format. Thus, to address the problem, we
parse this JSON input, and recursively filter each key and each
value in the JSON object. Then, we reconstruct the object’s
structure with the filtered keys and values. The JSON data
handling strategy (used in our evaluation) is an instance for
Algorithm 1 Constructing SFT Triples (prompt, data, output)
Require: An instruction–tuning dataset D = {(ua, xa)}
Ensure: Triples to construct the SFT dataset D′
1: # Include non-injected benign samples for Goal 1
2: D′ = {(ua, xa, xa) for (ua, xa) ∈D}
3: for attack ∈{Straightforward, Ignore, Completion} do
4:
for each (ua, xa) ∈D do
5:
6:
# Randomly truncate the benign data for Goal 2
7:
p = rand()
8:
if p < 0.1 then xa = xa[: 0.5 × |xa|])
9:
else if p < 0.2 then xa = xa[: 0.67 × |xa|])
10:
else if p < 0.35 then xa = ‘’
11:
xclean = xa
12:
13:
# Simulate injection in random positions for Goal 4
14:
Sample another example (u′, x′) ∼D
15:
p = rand()
16:
if p < 0.2 then injection_position = start
17:
else if p < 0.4 then injection_position = end
18:
else injection_position = middle
19:
x = attack(xa, u′ + x′, injection_position)
20:
21:
# Use a newly added EOS token for Goal 3
22:
D′+ = (ua, x, xclean<|end_of_data|>)
23:
end for
24: end for
dealing with structured data. Other formats such as HTML,
XML, and YAML can similarly be parsed into hierarchical
elements whose textual content can be filtered independently
and then reassembled without breaking syntax.
V. EXPERIMENTS

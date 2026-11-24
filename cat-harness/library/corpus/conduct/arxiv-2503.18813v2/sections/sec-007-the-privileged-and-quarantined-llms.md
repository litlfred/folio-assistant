---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-007-the-privileged-and-quarantined-llms
section_title: "The Privileged and Quarantined LLMs"
section_number: null
pages: 7-9
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
To the best of our knowledge, CaMeL represents the first concrete instantiation of the Dual-LLM
pattern (Willison, 2023) using a Privileged LLM and a Quarantined LLM. The Quarantined LLM
(Q-LLM) is a large language model that has no tool access and can be used to parse unstructured data
into data with a predefined schema via a feature commonly called structured output by LLM providers
and is built-in for most large language models. On top of the fields provided as part of the schema, we
inject one additional boolean field (called have_enough_information) that the Quarantined LLM
can use to communicate that it was not provided with enough information to solve the assigned task.
If this field is false, then the CaMeL interpreter throws a NotEnoughInformationError and the
P-LLM is asked to generate different code to fix the error (like with other exceptions, as explained
below). Importantly, the Q-LLM cannot communicate to the P-LLM what information it needs, as this
could be a vector for prompt injections.
The Privileged LLM (P-LLM), instead, takes a natural language input describing a task (e.g., a request
for the agent), and writes Python code which expresses the query intent by leveraging the tools, the
standard library functions that are made available to it, and the Q-LLM (which is presented to the
P-LLM as a function to call, just like the aforementioned tools). As part of the code, it must also
specify the expected schema for each call to the Q-LLM, in the form of a Pydantic BaseModel (Colvin
et al., 2025). Crucially, the P-LLM only interacts with the user query and not the data returned by
tools or with the Q-LLM output: values returned by tools are stored in variables, and the P-LLM can
only see the code it generated and not the variable’s content. The P-LLM uses the Q-LLM as a function
and only passes to it information required for the task, tracking provenance. There is explicit isolation
between the models to ensure that data can’t influence the original user query execution plan.
The P-LLM receives a system prompt that includes details on the code that is expected and the list of
tools and classes available to it (in the form of Python function signatures). We additionally include
some of the AgentDojo system prompt (e.g., the user’s name and some extra instructions related to
7
Defeating Prompt Injections by Design
def create_calendar_event_policy(
self, tool_name: str, kwargs: Mapping[str, CaMeLValue]
) -> SecurityPolicyResult:
# Data: title, description, location, start_time, end_time
# Readers: participants
# Rationale:
# Title, description, location, start_time, end_time should be readable by
the participants or all participants should come from user
participants: List[CaMeLStr] = kwargs["participants"]
# type: ignore
if is_trusted(participants): # If the list of participant directly comes from
a trusted source, execute the tool
return Allowed()
participants_set = set(participants.raw)
if not can_readers_read_value(participants_set, kwargs["title"]):
return Denied("The title is not public or shared with the recipients")
# Same check for description, location, start_time, end_time
# ...
return Allowed()
Figure 6 | CaMeL’s security policies can be as expressive as Python. Example of security policy
for the AgentDojo tool which creates a calendar event. All other policies used in the evaluation are
released with the code.
each environment). We provide the full system prompt in Appendix H.1. Then, in form of a user
prompt, the P-LLM is given the user’s task. The P-LLM responds with some text that must include a
code block in Markdown format, i.e., wrapped by triple backquote characters (‘). The P-LLM can
show content to the user by calling the print function.
Although we use the same backbone LLM for both the P-LLM and the Q-LLM, in practice they could
be different. As parsing data is likely to be easier than creating a plan and writing code for the user’s
query, a weaker language model could be used for the Q-LLM. On top of being faster and cheaper,
this LLM could also be run locally on the user’s machine (whereas the more powerful P-LLM might
require using a proprietary model). This improves privacy5 with respect to the model provider: since
the P-LLM only receiver the user query, the P-LLM provider never sees the tool outputs (which might
contain sensitive information). This is different from the commonplace tool-calling loop, where the
LLM provider decides which tools see other tool outputs for multi-step tool uses.
5.2. Security Policies
Security Policies define allowed operations in the information flow. For example, data labeled as not
readable by anyone but the user should not be supplied to a state-changing tool (e.g., a tool that
sends emails or that requests a web page). Security policies can be defined globally by the entity
serving the engine or for allowing specific data flows to a specific tool (e.g., sharing a document as an
attachment of an email whose recipients already have access to the document). Note that security
policies can be extremely granular and flexible: Figure 6 shows an example of a calendar policy. Here,
the policy explicitly states that the data that are part of the calendar event (e.g., the title and the
description) must be readable by the participants. However, it also states that, if all participants come
from a trusted source (e.g., directly from the user), then data can be shared with them even if the
calendar information has not been shared with them previously. In practice the choice of annotations,
5In a data minimization paradigm similar to that used in federated learning (McMahan et al., 2023).
8
Defeating Prompt Injections by Design
their granularity, and levels of access are defined based on a specific use-case.
In our implementation, policies are defined by the CaMeL engine. However, our design allows for
a more granular and multi-party model in the future. We envision a system where users and tool-
providers can also set their own policies, or where policies can be automatically derived from context.
Policies are expressed as Python functions, as shown in Figure 6. Each function takes the tool name
and arguments as input and returns a SecurityPolicyResult expressed as Allowed or Denied,
along with a reason for the decision. We opted to use Python code over a custom DSL to allow for
arbitrary logic to be implemented within the policy.

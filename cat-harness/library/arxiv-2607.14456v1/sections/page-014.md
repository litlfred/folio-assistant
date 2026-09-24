---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
A.4. Base Prompt for Agent Generation
Create a GenAI powered ReAct agent in a new folder called
{framework} agent experiment {num}.
Do not create a state machine, hardcoded
implementation or any other implementation, your agent should be a GenAI powered
ReAct agent that uses tool calls to complete the task.
Do not ask any questions
about what implementation to use -- you should make all of these decisions yourself.
Your agent folder needs at least 3 files:
1. agent.py -- a FastAPI service on localhost:7860 with two endpoints:
/chat
(accepts conversation id, cif, and message; if no message is required it can
accept an empty string; returns the end result of the GenAI powered ReAct agent
designed to execute the workflow) and /get history (accepts conversation id;
returns the complete conversation history and all tools called by the agent
including tool name & tool output, i.e. {"conversation":
[], "tool calls":
[]}).
It should adhere to the provided API spec.
Ensure this file has a main function
that uses uvicorn to run the app.
2. tools.py -- contains all tools for the agent.
3. prompts/agent prompt.md -- contains the prompt for the agent.
Use the following to get the necessary API details for the LLM calls for your ReAct
agent:
openai base url = os.environ.get("OPENAI BASE URL")
openai api key
= os.environ.get("OPENAI API KEY")
model name
= os.environ.get("AGENT LLM")
Your agent should be based on the provided BPMN specification (passed in the <BPMN>
block).
You are not permitted to read any other files to complete this task.
Use
the venv stored at YOUR VENV HERE. Do not examine this venv or try to install new
libraries -- if needed they will be automatically installed for you.
Do not attempt
to execute your code after completing it; manual testing will be performed and any
errors will be passed directly to you.
Figure 5. Base prompt provided to Roo and Cline for each agent generation attempt. The {num} placeholder was incremented per attempt,
and the <API SPEC> and <BPMN> blocks were populated with the actual API specification and BPMN workflow for each experiment.
14

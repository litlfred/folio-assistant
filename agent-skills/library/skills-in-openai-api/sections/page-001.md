---
doc_id: skills-in-openai-api
doc_title: "Skills in OpenAI API"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: Skills in OpenAI API.pdf
source_sha256: 2d261aeb7a6af6ab
text_source: text-layer
granularity: page
---
7) Request a local shell call (optional, live API request).
Local shell uses the files you created above, without uploading or referencing a hosted skill.
Run this snippet from the directory containing csv_insights_skill in your execution
environment.
This snippet only requests and displays commands. It does not execute them or complete
the analysis. To complete the workflow, your application must review and execute
shell_call commands in a sandbox, capture stdout, stderr, and the exit outcome, and
return shell_call_output with the matching call_id . Continue until the model
returns its final answer. See Local shell mode for the execution loop and output format.
import os
from pathlib import Path
from openai import OpenAI
if os.environ.get("RUN_SKILLS_API") == "1":
    client = OpenAI()
    skill_path = Path("csv_insights_skill").resolve()
    response = client.responses.create(
        model="gpt-6-astra",
        tools=[
            {
                "type": "shell",
                "environment": {
                    "type": "local",
                    "skills": [
                        {
                            "name": "csv-insights",
                            "description": (
                                "Summarize a CSV, compute basic stats, 
and produce "
                                "a markdown report + a plot image."
                            ),
                            "path": str(skill_path),
                        }
                    ],
                },
            }
Ask AI
9/20/26, 4:41 PM
Skills in OpenAI API
https://developers.openai.com/cookbook/examples/skills_in_api
1/1

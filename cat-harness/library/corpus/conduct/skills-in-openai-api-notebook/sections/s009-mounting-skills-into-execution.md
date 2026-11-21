---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s009-mounting-skills-into-execution
section_title: "Mounting skills into execution"
cells: 19-19
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Mounting skills into execution

To use skills in the Responses API, attach them to the shell tool with `tools[].environment.skills`.

### How to reference skills

- **Hosted shell** (`environment.type="container_auto"`): use `skill_reference` with a `skill_id` and optional `version`, or an `inline` base64 zip bundle.
- **Local shell** (`environment.type="local"`): provide `name`, `description`, and `path` for files available in your runtime. Local shell does not accept hosted `skill_reference` attachments. Your application executes the requested commands and returns their outputs.

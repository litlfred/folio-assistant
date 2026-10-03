---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s008-creating-skills-via-api
section_title: "Creating skills via API"
cells: 14-18
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Creating skills via API

After you assemble your skill in a folder, create the skill with an API call.

### Directory upload or zip upload


Use `POST /v1/skills` to upload and validate your skill, extracting name and description from the manifest frontmatter. You can either upload a zip bundle or upload multiple files in your request.

**Option A: Upload files (multipart)**

```bash
curl --fail-with-body 'https://api.openai.com/v1/skills' \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F 'files[]=@./csv_insights_skill/SKILL.md;filename=csv_insights_skill/SKILL.md;type=text/markdown' \
  -F 'files[]=@./csv_insights_skill/run.py;filename=csv_insights_skill/run.py;type=text/plain' \
  -F 'files[]=@./csv_insights_skill/requirements.txt;filename=csv_insights_skill/requirements.txt;type=text/plain' \
  -F 'files[]=@./csv_insights_skill/assets/example.csv;filename=csv_insights_skill/assets/example.csv;type=text/csv'
```

**Option B: Upload zip**

```
curl -X POST 'https://api.openai.com/v1/skills' \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F 'files=@./csv_insights_skill.zip;type=application/zip'
```

Use one upload method per skill. A zip keeps the instructions, script, dependencies, and sample input together.

**Skill object and version pointers**

The response includes the skill `id`, `default_version`, and `latest_version`. Save the `id` and a version to attach the uploaded skill to hosted shell.

1. [Install folio-assistant]({{ '/docs/cat-harness/start/installation.html' | relative_url }}) and run `bun run cat check-deps`.
   For papers you want `bun`, `latexmk`/`texlive`, and Lean (`elan`).
2. [Connect your LLM harness]({{ '/docs/cat-harness/start/installation.html#connecting-an-llm-harness' | relative_url }})
   (Claude Code, Antigravity, …) so the agent has the MCP tools.
3. Create an (empty) content repository for your paper and add a
   `<name>.config.json` with `"contentType": "paper"`.

---

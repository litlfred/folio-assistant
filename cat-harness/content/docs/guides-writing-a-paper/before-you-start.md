1. [Install folio-assistant](../installation.html) and run `bun run check-deps`.
   For papers you want `bun`, `latexmk`/`texlive`, and Lean (`elan`).
2. [Connect your LLM harness](../installation.html#connecting-an-llm-harness)
   (Claude Code, Antigravity, …) so the agent has the MCP tools.
3. Create an (empty) content repository for your paper and add a
   `<name>.config.json` with `"contentType": "paper"`.

---

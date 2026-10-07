---
# folio-assistant-31ni
title: 'Agent memory for every vendor: one memory source, one assembler, per-vendor agent files'
status: todo
type: feature
created_at: 2026-10-06T18:31:42Z
updated_at: 2026-10-06T18:31:42Z
parent: folio-assistant-7x5n
---

Owner question 2026-10-06: is there a Gemini/ChatGPT version of .claude/agent-memory to assemble too? Research (sources: vendor repos gemini-cli docs, openai/codex source, github/docs; Cursor/Antigravity UNVERIFIED): NO vendor but Claude has per-agent memory (memory: project -> .claude/agent-memory/<agent>/MEMORY.md). Others have per-agent DEFINITION files whose body is the prompt: Gemini .gemini/agents/*.md, Copilot .github/agents/<name>.agent.md (30,000-char body), Codex .codex/agents/*.toml (developer_instructions), Cursor .cursor/agents/*.md (unverified; may also read .claude/agents). Repo-wide: AGENTS.md (Codex concatenates root->cwd, 32 KiB default; Copilot CLI, Cursor, Antigravity read it; Gemini via context.fileName). Machine-written stores (Copilot Memory, Codex ~/.codex/memories, Gemini Auto Memory, ChatGPT) are out of scope.

## Design
One source (the declared memory directories, after the ar1s split), one assembler (cat-harness/scripts/agent-memory.ts generalised), per-vendor targets written INLINE (imports are not portable) inside marked regions, each with a --check gate and a per-target budget that drops lowest-priority nodes and REPORTS what it dropped (never silent truncation). Repo-wide nodes -> a generated AGENTS.md section.

## Todo
- [ ] Assembler reads every declared memory directory (prerequisite, done in ar1s P1).
- [ ] Target: Claude (existing), Gemini, Copilot, Codex agent files; Cursor after verification.
- [ ] Repo-wide AGENTS.md section from agent-less nodes.
- [ ] Budgets + --check gate per target; skill page on the mapping.

## Done when
Each declared subagent exists for every supported vendor, each carrying the same memory, generated and gated.

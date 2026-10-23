---
# folio-assistant-31ni
$schema: bean/1.0.0
title: 'Agent memory for every vendor: one memory source, one assembler, per-vendor agent files'
status: in-progress
type: feature
created_at: 2026-10-06T18:31:42Z
updated_at: 2026-10-23T20:40:00Z
parent: folio-assistant-7x5n
---

Owner question 2026-10-06: is there a Gemini/ChatGPT version of .claude/agent-memory to assemble too? Research (sources: vendor repos gemini-cli docs, openai/codex source, github/docs; Cursor/Antigravity UNVERIFIED): NO vendor but Claude has per-agent memory (memory: project -> .claude/agent-memory/<agent>/MEMORY.md). Others have per-agent DEFINITION files whose body is the prompt: Gemini .gemini/agents/*.md, Copilot .github/agents/<name>.agent.md (30,000-char body), Codex .codex/agents/*.toml (developer_instructions), Cursor .cursor/agents/*.md (unverified; may also read .claude/agents). Repo-wide: AGENTS.md (Codex concatenates root->cwd, 32 KiB default; Copilot CLI, Cursor, Antigravity read it; Gemini via context.fileName). Machine-written stores (Copilot Memory, Codex ~/.codex/memories, Gemini Auto Memory, ChatGPT) are out of scope.

## Design
One source (the declared memory directories, after the ar1s split), one assembler (cat-harness/scripts/agent-memory.ts generalised), per-vendor targets written INLINE (imports are not portable) inside marked regions, each with a --check gate and a per-target budget that drops lowest-priority nodes and REPORTS what it dropped (never silent truncation). Repo-wide nodes -> a generated AGENTS.md section.

## Todo
- [x] Assembler reads every declared memory directory (prerequisite, done in ar1s P1).
- [ ] Target: Claude (existing), Gemini, Copilot, Codex agent files; Cursor after verification (Gemini `4682`, Codex `5zs1`, Cursor `uvfs`, Copilot `xxh4` ruled `"Keep parked"` by owner 2026-10-20).
- [x] Repo-wide AGENTS.md section from agent-less nodes (`litlfred/cat-harness-tools#639` @ `3e8259f`).
- [x] Budgets + --check gate per target; skill page on the mapping (`litlfred/cat-harness-tools#639` @ `3e8259f`, `litlfred/cat-harness#459` @ `47d08c723`).

## Done when
Each declared subagent exists for every supported vendor, each carrying the same memory, generated and gated.

_2026-10-21T19:15:00Z_ — Progress update: ticked `Assembler reads every declared memory directory (prerequisite, done in ar1s P1)` (`ar1s` completed; `cat-harness-tools/scripts/agent-memory.ts` reads every declared `memory` directory across instances and emits `.claude/agent-memory/`, `.agents/rules/agent-memory.md`, `.agents/skills/*-memory/SKILL.md`, and `.cursor/rules/agent-memory.mdc`).

_2026-10-23T20:40:00Z_ — Ticked repo-wide `AGENTS.md` section from agent-less nodes and per-target budgets + `--check` gate + skill page on the mapping (`litlfred/cat-harness-tools#639`, `litlfred/cat-harness#459`). The 4 vendor per-agent definition targets (`4682`, `5zs1`, `uvfs`, `xxh4`) remain parked per owner ruling 2026-10-20.

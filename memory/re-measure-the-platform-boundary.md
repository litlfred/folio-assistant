---
$schema: folio-memory/v1
id: re-measure-the-platform-boundary
label: stable
summary: "re-measure, do not quote"
createdAt: 2026-09-19
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
---
| what | command |
|---|---|
| folio-specific literals in platform code | grep the change for a paper dir, a title, an owner/repo, a Lake prefix, a workflow filename |
| README sections a folio can opt into | `bun run readme:sections` |
| README staleness | `bun run readme:sync:check` |
| block-kind classification totality | read `schemas/block-kinds.ts`; `DOCUMENT_BLOCK_KINDS` must stay derived |

> Relabelled from BASELINE to STABLE, 2026-09-19. `AGENTS.md` defines a
> BASELINE as *"a measured number, stored with the command that produced it
> and the date"* — and this entry stores no number. It is a table of commands
> to RUN, which is the opposite thing: a stable fact about how to measure,
> not a measurement. `MemoryNodeSchema` refused it as a baseline, correctly.

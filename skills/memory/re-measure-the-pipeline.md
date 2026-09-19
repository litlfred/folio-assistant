---
$schema: folio-memory/v1
id: re-measure-the-pipeline
label: stable
summary: "re-measure, do not quote"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
| what | command |
|---|---|
| the pipeline's actual entrypoints | `ls content/pipeline/` |
| the scripts that exist on this side | `bun run` with no args, or read `package.json` |
| block kinds and their classification | read `schemas/block-kinds.ts` |
| sidecar staleness | `bun run content/pipeline/qa-staleness.ts <path>` |

> Relabelled from BASELINE to STABLE, 2026-09-19. `AGENTS.md` defines a
> BASELINE as *"a measured number, stored with the command that produced it
> and the date"* — and this entry stores no number. It is a table of commands
> to RUN, which is the opposite thing: a stable fact about how to measure,
> not a measurement. `MemoryNodeSchema` refused it as a baseline, correctly.

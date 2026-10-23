# AGENTS.md — folio-assistant-state

The state `litlfred/folio-assistant` keeps about itself. Its
[README](README.md) says what is here; this file says how to work in it.

## Do not edit the graphs here by hand

Each directory this instance declares is a **state graph kept on its own
branch**, mounted at its path by `bun run cat state:mount`. Today that is one:
`test/health/results/`, from `cat/folio-assistant-state/health`. What you see on
disk is the mounted tip, git-ignored, never committed to `main`.

- The writer is the daily sweep, `health-check.yml`, through
  `bun run cat state:push -- --id folio-assistant-state.health`. An agent has no
  reason to push to it: a health report is the sweep's measurement, and one
  written by hand reports nothing.
- To read it, mount it (`bun run cat state:mount`) and read
  `test/health/results/repository.health-report.json`.

## What belongs here, and what does not

Only state that is about **this repository** and that no layer can hold, such as
a report its own token must write. Anything a layer owns, such as its own health
graph, its beans or its QA verdicts, lives with that layer, on its own
repository (bean `folio-assistant-kyrg`, owner 2026-10-22). Adding a graph here
is a change to [`folio-assistant-state.json`](folio-assistant-state.json), the
declaration, and a new state branch beside the first.

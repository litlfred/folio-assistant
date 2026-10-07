---
# folio-assistant-2ngl
title: 'MODE: developer — local server, CLI tools, one model for every workflow'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "developer
mode: likely wants local server hostign the content, run CLI version of tools.
uses single agent/model for all workflows".

## The strawperson position

Developer mode is a **point in the topology product**, not a special code path:

| axis | value |
|---|---|
| forge | local git only, or any — the mode does not care |
| publication host | local HTTP server |
| compute | the developer's own machine |
| model supply | one model, every workflow |
| data stores | none |

If that is right, then "developer mode" needs no implementation at all beyond
the axes themselves plus the local-server tool — it is a named preset. That is
the claim to attack.

## Where it might not be right

**"CLI version of tools"** is the part that may be a real requirement rather
than a preset. Every capability here exists twice: as an MCP tool and as a
`bun run` script. `AGENTS.md` §Commands lists nine scripts; the MCP surface is
larger. If some capability is MCP-only, then developer mode is not merely a
preset — it is blocked on parity, and that parity gap should be measured before
this bean is scoped.

**One model for every workflow** may also be substantive. The role model assigns
skills per lane; if any lane's skill assumes a model class the single model does
not have, the workflow degrades rather than fails. Degrading silently is worse
than refusing.

## Done when

- [ ] the MCP-vs-CLI parity gap is measured and written down, with the command
      that measured it and the date
- [ ] developer mode is expressible as axis values, or the reason it is not is
      recorded
- [ ] a workflow whose lane needs a capability the configured model lacks
      refuses rather than degrades

## Not doing

Building a CLI for anything. Measuring first — the gap may be empty.

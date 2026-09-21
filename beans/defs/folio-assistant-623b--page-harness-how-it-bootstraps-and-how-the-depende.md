---
# folio-assistant-623b
title: 'PAGE: Harness — how it bootstraps, and how the dependency tree is walked from the lowest instance up'
status: todo
type: feature
priority: high
created_at: 2026-09-21T16:21:34Z
updated_at: 2026-09-21T16:21:34Z
parent: folio-assistant-2upx
---

Owner, 2026-09-21: a page covering how the Harness bootstraps, and how agents are steered by Processes (BPMN), Actors, Roles, Skills and Tasks.

**The mechanism to document:** the dependency tree of the harness is walked starting from the LOWEST (bootstrap) in an ORDERED dependency hierarchy. The harness is declared in the KG. The page MUST explain how bootstrap plus zero or more harnesses can be initiated.

**Also required (owner):** split bootstrap the same way as the KG taxonomy — `bootstrap/tools`, `bootstrap/processes`, `bootstrap/scenarios`.

Overlaps `x3bd` (top-level topical KG directories, bootstrap first), `b5f0` (what instantiation means) and `hfkl` (bootstrap is the exception). Check each before writing; this page SHOULD reference them rather than restate them.

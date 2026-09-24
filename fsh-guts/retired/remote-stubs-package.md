---
$schema: folio-fsh-guts/v1
title: "The `remote-stubs` package — five placeholder skill bodies, retired when the real ones arrived"
kind: retired-package
movedOn: 2026-09-24
movedFrom: "cat-harness/skills/remote-stubs/"
bean: folio-assistant-wlqd
issue: 556
summary: >-
  Stubs that kept `remote-skill-is-servable` answerable while no code synced the remote packages. Retired because each name is now served for real. The three scientific skills are materialized, pinned and read-only, by `sync-remote-packages.ts`. The two FHIR skills are authored in `fhir-harness/`, because TopologyHealth/SMARTerFHIR is a library with no skill files: the names had never existed upstream.
---

# `remote-stubs`, as it was at retirement

Every file, byte for byte, so the record of what the stubs said survives them.

## `fhir-client-operations.md`

````markdown
---
name: fhir-client-operations
description: >
  STUB. Client-side FHIR operations: search, read, transaction bundles. Declared by the remote package `smarter-fhir`
  and not vendored here, so this body exists only so the graph traverses and
  `skill_fetch` answers instead of failing mid-task.
stub: >
  Declared by `skills/remote-packages/smarter-fhir.json` (`wrapper.skills`) and not
  vendored. The wrapper's `sync` block says shallow-clone weekly and NOTHING
  performs it. To finish: implement the sync so the upstream body is fetched, or
  drop the name from the wrapper so it stops being published. Bean `wlqd`.
---

# fhir-client-operations — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

Client-side FHIR operations: search, read, transaction bundles.

## Where it actually lives

Upstream, in **https://github.com/smarter-fhir**, maintained by **smarter-fhir**. This instance wraps that
package in `skills/remote-packages/smarter-fhir.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
````

## `hypothesis-generation.md`

````markdown
---
name: hypothesis-generation
description: >
  STUB. Proposing candidate hypotheses from observations, with what each predicts. Declared by the remote package `claude-scientific-skills`
  and not vendored here, so this body exists only so the graph traverses and
  `skill_fetch` answers instead of failing mid-task.
stub: >
  Declared by `skills/remote-packages/claude-scientific-skills.json` (`wrapper.skills`) and not
  vendored. The wrapper's `sync` block says shallow-clone weekly and NOTHING
  performs it. To finish: implement the sync so the upstream body is fetched, or
  drop the name from the wrapper so it stops being published. Bean `wlqd`.
---

# hypothesis-generation — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

Proposing candidate hypotheses from observations, with what each predicts.

## Where it actually lives

Upstream, in **https://github.com/K-Dense-AI/claude-scientific-skills**, maintained by **K-Dense-AI**. This instance wraps that
package in `skills/remote-packages/claude-scientific-skills.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
````

## `package-manifest.json`

````json
{
  "name": "remote-stubs",
  "version": "0.1.0",
  "description": "Stub bodies for skills that remote packages DECLARE and this instance does not vendor. A stub exists so the graph traverses and skill_fetch answers instead of failing mid-task; every one is reported by kg:audit under skill-is-a-stub so filling the gap does not hide it. This package is deliberately separate from the packages that hold real skills: a stub in folio-core would read as ours, and the remedy for each of these is upstream. Its docker block declares an empty aptPackages list on purpose: a stub needs nothing installed, and stating that explicitly keeps \"nothing required\" distinguishable from \"nobody filled this in\" \u2014 the same reason install.none exists on a Tool node.",
  "skills": [
    "fhir-client-operations",
    "hypothesis-generation",
    "scientific-critical-thinking",
    "scientific-visualization",
    "smart-launch"
  ],
  "docker": {
    "baseImage": "ubuntu:24.04",
    "aptPackages": []
  },
  "lifecycleStages": []
}
````

## `scientific-critical-thinking.md`

````markdown
---
name: scientific-critical-thinking
description: >
  STUB. Appraising a scientific claim — what would falsify it, what the evidence actually supports. Declared by the remote package `claude-scientific-skills`
  and not vendored here, so this body exists only so the graph traverses and
  `skill_fetch` answers instead of failing mid-task.
stub: >
  Declared by `skills/remote-packages/claude-scientific-skills.json` (`wrapper.skills`) and not
  vendored. The wrapper's `sync` block says shallow-clone weekly and NOTHING
  performs it. To finish: implement the sync so the upstream body is fetched, or
  drop the name from the wrapper so it stops being published. Bean `wlqd`.
---

# scientific-critical-thinking — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

Appraising a scientific claim — what would falsify it, what the evidence actually supports.

## Where it actually lives

Upstream, in **https://github.com/K-Dense-AI/claude-scientific-skills**, maintained by **K-Dense-AI**. This instance wraps that
package in `skills/remote-packages/claude-scientific-skills.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
````

## `scientific-visualization.md`

````markdown
---
name: scientific-visualization
description: >
  STUB. Plotting and figure production for scientific results. Declared by the remote package `claude-scientific-skills`
  and not vendored here, so this body exists only so the graph traverses and
  `skill_fetch` answers instead of failing mid-task.
stub: >
  Declared by `skills/remote-packages/claude-scientific-skills.json` (`wrapper.skills`) and not
  vendored. The wrapper's `sync` block says shallow-clone weekly and NOTHING
  performs it. To finish: implement the sync so the upstream body is fetched, or
  drop the name from the wrapper so it stops being published. Bean `wlqd`.
---

# scientific-visualization — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

Plotting and figure production for scientific results.

## Where it actually lives

Upstream, in **https://github.com/K-Dense-AI/claude-scientific-skills**, maintained by **K-Dense-AI**. This instance wraps that
package in `skills/remote-packages/claude-scientific-skills.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
````

## `smart-launch.md`

````markdown
---
name: smart-launch
description: >
  STUB. The SMART on FHIR launch sequence — authorisation, context, scopes. Declared by the remote package `smarter-fhir`
  and not vendored here, so this body exists only so the graph traverses and
  `skill_fetch` answers instead of failing mid-task.
stub: >
  Declared by `skills/remote-packages/smarter-fhir.json` (`wrapper.skills`) and not
  vendored. The wrapper's `sync` block says shallow-clone weekly and NOTHING
  performs it. To finish: implement the sync so the upstream body is fetched, or
  drop the name from the wrapper so it stops being published. Bean `wlqd`.
---

# smart-launch — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

The SMART on FHIR launch sequence — authorisation, context, scopes.

## Where it actually lives

Upstream, in **https://github.com/smarter-fhir**, maintained by **smarter-fhir**. This instance wraps that
package in `skills/remote-packages/smarter-fhir.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
````

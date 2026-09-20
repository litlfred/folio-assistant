---
# folio-assistant-cp3l
title: The generic markdown-link auditor lives wholly in core, so any harness-level link check inherits a wrong-direction edge
status: todo
type: task
parent: folio-assistant-vke6
created_at: 2026-09-20T12:09:36Z
updated_at: 2026-09-20T12:09:36Z
---


Found 2026-09-20 while closing bean `v8gh` — a check that every link out of
`AGENTS.md` resolves.

## The edge

```
scripts/check-agent-entry-links.ts (agentic-harness)
  → content/pipeline/readme-links.ts (folio-assist-core)
```

`check:partition` refuses it, and `main` now asserts **zero** wrong-direction
edges, so it is a hard failure rather than a report.

## Why it is not that script's fault

`readme-links.ts` is two things in one file:

- a **generic markdown-link auditor** — parse links, resolve against the
  working tree, handle refs and Pages URLs, report a third state for what it
  could not check. Nothing folio-specific in any of it.
- a **README-shaped front end** — `INSTANCE_README_ROLE`, `loadReadmeConfig`,
  the default of `README.md`.

The first half is harness-level infrastructure. It lives in core because the
file does. So **any** harness-level link check — over `AGENTS.md`, over a
skill, over a workflow page — inherits a wrong-direction edge the moment it
reuses it, and the only ways out are to duplicate the auditor or to misclassify
the check.

## What was done instead, and why

`check-agent-entry-links.ts` is classified into **core**, beside the module it
wraps, with the reason written at the rule. That is honest about shipping — it
goes wherever `readme-links.ts` goes — and dishonest about subject, since the
file it checks is `AGENTS.md`, which is harness through and through.

The alternative was to lift the generic half of somebody else's module into
harness during a bean about link checking. That is a re-layering, and
re-layering a module on the way past is how a partition pass acquires changes
nobody reviewed.

## Done when

- [ ] the generic auditor — `parseLinks`, `classify`, the resolve-and-report
      core — sits in harness, where a harness check can use it
- [ ] `readme-links.ts` keeps only the README front end and imports the rest
- [ ] `check-agent-entry-links.ts` is reclassified to harness, where its
      subject says it belongs, and the comment at its rule is deleted rather
      than updated

## Not in scope

Changing what either check DOES. Both are correct; this is about which package
owns the parts.

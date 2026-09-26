---
# folio-assistant-cp3l
title: The generic markdown-link auditor lives wholly in core, so any harness-level link check inherits a wrong-direction edge
status: completed
type: task
priority: normal
created_at: 2026-09-20T12:09:36Z
updated_at: 2026-09-20T12:43:28Z
parent: folio-assistant-vke6
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

## What the bean did not know: the generic layer spans TWO core files

Measured on opening: `auditLinks` calls `publishedPaths`, which is in
`content/pipeline/readme-toc.ts` — and that file also holds `detectRepoUrl`,
a private `ownerRepo`, and its own `git()` carrying a 64 MiB-buffer fix
(without which a large, HEALTHY publish branch read as no branch at all).
All four are git facts with nothing README about them. Lifting only
`readme-links.ts` would have left the edge in place one module further down.

**The falsifier named in the opening brief, and how it went.** The harness
check needs `publishRef` and `pagesBaseUrl` to resolve `AGENTS.md`'s Pages
links, and those were read by `loadReadmeConfig` — core. Dropping them would
have made those links silently **unchecked**, which is the clean-looking
blindness bean `v8gh` existed to remove. They moved: they are repository-level
publish targets that merely live under a `readme` key, and
`harness.config.json` is resolved by `schemas/harness-config.ts`, which is
already harness. `publishTargets` is now the **single** reader and
`loadReadmeConfig` spreads it, so the two cannot disagree — asserted by test
rather than described, because a disagreement here is silent on both sides.

## Done when

- [x] the generic auditor — `parseLinks`, `classify`, the resolve-and-report
      core — sits in harness, where a harness check can use it —
      `src/core/markdown-links.ts`, plus `src/core/git-refs.ts` for the git
      facts the bean had not spotted
- [x] `readme-links.ts` keeps only the README front end and imports the rest —
      **373 lines to 95**: `runReadmeAudit`, the declared-asset lookup, the
      config and the CLI
- [x] `check-agent-entry-links.ts` is reclassified to harness, where its
      subject says it belongs, and the comment at its rule is **deleted**
      rather than updated

## Evidence it changed nothing it audits

`check:agent-entry-links` before and after the move, same tree:
4 files, `AGENTS.md` **43 checked, 43 resolved, 0 dead, 6 not checked** — the
unchecked count identical, which is what proves the Pages links did not
quietly stop being resolved. `check:partition` 0 wrong-direction edges,
0 unassigned. 3598 tests pass, 0 fail; `bun run gates` green.

## Not in scope

Changing what either check DOES. Both are correct; this is about which package
owns the parts.

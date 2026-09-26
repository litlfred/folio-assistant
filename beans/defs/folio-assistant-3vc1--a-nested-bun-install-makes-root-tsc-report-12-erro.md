---
# folio-assistant-3vc1
title: A nested bun install makes root tsc report 12 errors that CI does not have — and it is the only way to fix a stale nested lockfile
status: todo
type: task
created_at: 2026-09-26T17:25:05Z
updated_at: 2026-09-26T17:25:05Z
parent: folio-assistant-1xhc
---

## The trap, measured 2026-09-26

`cat-harness/adapters/mcp-server/bun.lock` was stale against its own manifest, so
fixing it means `bun install` **in that directory** — there is no other way to
regenerate a lockfile. That install creates a 56 MB
`cat-harness/adapters/mcp-server/node_modules`, and from that moment the ROOT
`bunx tsc --noEmit` reports **12 errors across 3 files under
`cat-harness/adapters/mcp-server/tools/`** and `bun run gates` reports a red it
did not have before.

    with that node_modules present   12 errors, all under mcp-server/tools/, 0 elsewhere
    with it moved aside              0 errors — no source change whatsoever
    CI on the identical commit       tsc --noEmit step: SUCCESS

**Cause.** That directory's lock resolves `@modelcontextprotocol/sdk` to
**1.28.0**, which wants zod 3 and gets `zod@3.25.76` nested under it, while the
root hoists the manifest's zod 4. The root `tsconfig.json` includes those adapter
sources, so `tsc` type-checks them against whichever SDK resolution it finds
first. CI installs only from the root — SDK 1.30.0 — and exits 0.

Verified from the nested package itself:
`node_modules/@modelcontextprotocol/sdk/package.json` reads `"version": "1.28.0"`.

## Why it is worth a bean rather than a shrug

The 12-error symptom is already recorded on a sibling's bean `x89e`
("A standalone mcp-server install does not type-check, and that predates this
bump"), independently measured, same 12, same cause. **What is NOT recorded
anywhere is that it is a TRAP**: the only way to fix a nested stale lockfile
leaves the local gate set lying for the rest of the session, and nothing warns
you. It cost a full `bun run gates` cycle here, and the false red came with two
extra `bun test` failures alongside it, so the reading was wrong in three places
at once and none of them named a `node_modules`.

This is the third sibling of one shape, and the other two are already beans:

| bean | the residue | what it distorted |
|---|---|---|
| `xd1g` | `block-qa-schema/node_modules` + `dist` | `kg-detangle` counted 1214 phantom KG nodes |
| `qook` | a SYMLINKED root `node_modules` | `gitCorpus` handed every consumer one phantom path |
| this | a nested REAL `node_modules` | root `tsc` resolves a different SDK and reports 12 errors |

Each one is "a tool answered a question about the repository and the answer came
from something the repository does not contain".

## Options, none chosen here

1. Exclude `cat-harness/adapters/mcp-server` from the root `tsconfig.json` —
   cheap, and it drops that adapter from root typechecking, which is coverage
   lost rather than a fix. `block-qa-schema/tests` was excluded for a comparable
   reason and the residual gap was STATED rather than closed.
2. Bump that directory's `@modelcontextprotocol/sdk` to the root's version, which
   `x89e` names as the likely fix. Not a dependency PR's business, per that bean.
3. Have `gates` DETECT the condition and refuse with a reason — the
   `check:merged` pattern from `nytj`: a distorted environment is exit 2, could
   not determine, never a red. This is the one that generalises over all three
   rows of the table above.
4. Nothing, and record the trap so the next agent recognises the symptom.

## Done when

- [ ] the owner has chosen between excluding, bumping, detecting, or recording
- [ ] whichever is chosen, the 12-error reading can no longer be mistaken for a
      finding about this repository's source

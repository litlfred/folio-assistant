---
# folio-assistant-k8rc
title: 'The TypeScript prose backlog: 344 mentions, and the exemption does not cover all of them'
status: todo
type: task
priority: normal
created_at: 2026-09-21T20:25:00Z
updated_at: 2026-09-21T20:25:00Z
parent: folio-assistant-vke6
---

The markdown half of this is done (`vzur`, #769). This is the `.ts` half, and
it is **not** simply the same sweep one file type over — the exemption that
covers it is sound for most of the corpus and wrong for a subset.

**Measured 2026-09-21 on `main` @ `83cc04b`:** 344 mentions of `harness.json`
or `harness.config.json` in `.ts` files under `cat-harness/`, excluding
`RETIRED_DECLARATION`'s own definition and the gate that hunts it.

## Why `check:declaration-filename` does not fail on these

By design. Its prose class is exempt because *"a rename REWORDS these; it does
not substitute a constant into them"* — flagging them would make the check
demand that every doc comment be assembled from constants, which nothing here
asks for. That argument is **correct for a doc comment**.

## The subset it is wrong for, and the worked example

`src/index.ts:136` and `:138` were **log messages**:

```ts
log("init", `Loaded harness.config.json: adapter=${adapterType}`);
log("init", `Failed to read harness.config.json: ${e}`);
```

`harnessConfigPath` is computed two lines up by `expectedInstanceConfigPath()`
and the file is `<name>.config.json` since the split — so the server told an
operator to go and look at a file that does not exist, while holding the real
path in a variable. **A log line is not prose a rename rewords; it is output
somebody acts on.** Fixed in the same change that opened this bean, by naming
the path already in hand.

That is one clear subclass. The measurement below has not separated the rest.

## What has to happen before a sweep, not after

**Do not run a blanket substitution.** This exact backlog has now produced the
same failure twice at two file types: `jijc`'s *"a blanket migration cannot
tell a literal that IS the code from a literal DESCRIBING code"*, and `vzur`'s
Pass B, whose phrase substitution produced ten broken lines and left four in
the tree for a later session to find. A third attempt earns a third instance.

Classify first. The classes visible from a skim, none of them counted yet:

| class | what it is | fix |
|---|---|---|
| **user-visible output** | log lines, thrown `Error` messages, MCP tool descriptions and parameter help | name the computed path, or the placeholder form — **wrong at runtime**, like `index.ts` above |
| **doc comment describing the mechanism** | `/** ... as declared in `harness.config.json` */` | reword; the existing exemption's reasoning applies |
| **history** | a comment stating what a name WAS, beside its replacement | leave; rewriting falsifies the record |
| **test fixture** | constructing the file the code under test looks for | `jijc` carries this as an open judgement — **do not settle it here** |

`src/tools/*.ts` is where the first class concentrates on the skim
(`readme-sync.ts:48`, `folio-init.ts:62`/`:125` are tool descriptions an agent
reads), which is why it is worth counting rather than assuming.

## Done when

- [ ] The 344 are classified into the four classes above, with counts.
- [ ] Every **user-visible output** mention names the file actually used, or
      the placeholder form where no path is in hand.
- [ ] A decision recorded on whether `check:declaration-filename` grows a
      fifth class for user-visible strings — distinct from its `prose` class,
      whose exemption argument does not reach them. **Backlog first, then the
      gate**, as `vzur` established.
- [ ] Doc comments and history left to a separate pass, or explicitly folded
      in with reasons.

*Recorded by session_017MEZnJxx7WeekiNCabx4hx, which found it while measuring
`zq3f`, fixed the two runtime-wrong log lines, and did not sweep the rest.*

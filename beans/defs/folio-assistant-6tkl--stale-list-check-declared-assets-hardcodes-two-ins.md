---
# folio-assistant-6tkl
title: 'STALE LIST: check-declared-assets hardcodes two instances and there are four'
status: todo
type: task
created_at: 2026-09-20T13:35:24Z
updated_at: 2026-09-20T13:35:24Z
parent: folio-assistant-1xhc
---


Found 2026-09-20 while working `pb04`, not looked for.

## Measured

`cat-harness/scripts/check-declared-assets.ts`:

```ts
export const DECLARED_INSTANCES = ["cat-harness", "bootstrap"] as const;
```

Four directories in this repository now carry a `harness.json`:

| declaration | name | declares assets? |
|---|---|---|
| `cat-harness/harness.json` | `folio-assistant` | yes — checked |
| `cat-bootstrap/harness.json` | `bootstrap` | yes — checked |
| `folio-assist-core/harness.json` | `folio-assist-core` | **yes — NOT checked** |
| `harness.json` (the root) | `folio-assistant-checkout` | no assets today |

So `folio-assist-core`'s `README.md`, declared with `role: "instance-readme"`,
is not verified to exist and its links are not audited. The gate reports
`N declared asset(s) across 2 instance(s)` — truthfully, and about the wrong
number of instances.

## Why this is the shape it is

**The comment directly above that line already records this failing once.** It
describes the constant naming the repository root after the `wggr` move, so
`declaredAssets` returned `[]` and the gate reported "1 declared asset across 2
instances, 0 findings" over a file it had never opened — "a clean run across an
empty set, which is `dh4f` in the one check whose whole subject is a file
nobody was looking at."

That is the same defect recurring for the same reason: **a hand-kept list of
instances drifts the moment somebody adds one.** `folio-assist-core` became a
real instance on 2026-09-20 and nothing updated the constant.

## The fix, and the thing to get right

Discover instances rather than list them. `check-undeclared-files.ts` already
does exactly this — `existsSync(join(repoRoot, name, "harness.json"))` plus the
root's own — and treats "it declares itself" as the contract, so a new instance
counts the moment it exists.

Two things a fix must keep:

- **The vacuity guard.** Discovery that finds zero instances must FAIL rather
  than report a clean run, which is the whole lesson of the incident above.
- **The root is an instance now.** It carries no assets today, so discovery
  must tolerate an instance with none without reading that as a finding.

## Done when

- [ ] `check:declared-assets` discovers instances instead of listing them.
- [ ] `folio-assist-core`'s README is verified and its links audited — the
      concrete thing currently unchecked.
- [ ] A test asserts the count of instances checked is at least 3, so the next
      instance is covered without anybody remembering.
- [ ] Zero discovered instances fails rather than passes.

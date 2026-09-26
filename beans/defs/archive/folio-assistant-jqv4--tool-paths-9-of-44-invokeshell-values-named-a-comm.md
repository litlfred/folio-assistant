---
# folio-assistant-jqv4
title: 'TOOL PATHS: 9 of 44 invoke.shell values named a command that does not run'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:35:14Z
updated_at: 2026-09-20T16:35:15Z
parent: folio-assistant-d308
---

Found while working `81t5` — and it is the defect `81t5` was standing on rather
than the one it describes.

## The measurement

**9 of the 44 checkable `invoke.shell` values named a path that does not exist.**
Every one was missing the `cat-harness/` prefix, stale since the instance moved
under that directory:

| node | declared | actually at |
|---|---|---|
| `ingest-stdlib`, `ingest-extended` | `bun run scripts/ingest-document.ts` | `cat-harness/scripts/…` |
| `lean-build` | `scripts/lean-build-all.sh` | `cat-harness/scripts/…` |
| `lean-cache` | `scripts/lake-cache.sh` | `cat-harness/scripts/…` |
| `lean-toolchain-setup` | `scripts/setup-lean-toolchain.sh` | `cat-harness/scripts/…` |
| `schema-docs` | `bun run scripts/gen-schema-docs.ts` | `cat-harness/scripts/…` |
| `skill-docs` | `bun run scripts/gen-skill-docs.ts` | `cat-harness/scripts/…` |
| `content-context` | `bun run scripts/gen-jsonld-context.ts` | `cat-harness/scripts/…` |
| `check-dependencies` | `bun run src/index.ts --check-deps` | `cat-harness/src/…` |

Measured by running one: `bun run scripts/ingest-document.ts` →
`error: Module not found`. So `ingest-stdlib` and `ingest-extended` have been
unreachable **through their own declared invocation** for as long as the inversion
has been in, while `check:tools` stayed green.

## Why nothing caught it, and why that was half right

`code-node-review` states the limit itself:

> *"what no audit can tell you: whether the mechanism a Tool describes is the one
> that runs."*

True of **what** the command does. **Not** true of whether the command exists,
which is a path and a filesystem. The honest split is to check the mechanical half
mechanically and leave the judgement to a reviewer — so `check:tools` now does,
and a mutation test confirms it catches exactly these two nodes when the defect is
reintroduced.

## The near-miss worth recording: two roots, and I nearly unified them

The same audit flagged **all 20** `inProcess.module` values as suspect, because
`src/tools/workflow.ts` resolves only under `cat-harness/`. Had I "fixed" those to
match, I would have broken twenty correct nodes.

They are **instance-relative and right** — same convention as `maintains.source`.
What is wrong is the field's own docstring, which said *"Repo-relative path to the
module, e.g. `src/tools/workflow.ts`"*: the example is instance-relative and is
where the file actually is, so **the word was stale and the values were right**.
Corrected, and the check now resolves each field against its own root:

| field | root | because |
|---|---|---|
| `invoke.shell` | repository | a command a caller types; `package.json` and `.github/` are at the repo root |
| `invoke.*.module` | instance | loaded by this instance's own server |

A check that used one root for both would have reported twenty false defects, or
none of the nine real ones. The test pins both directions, including that a module
must **not** resolve repo-relative, so a future "helpful" rewrite fails loudly.

## Done when

- [x] the 9 paths fixed and each verified to resolve
- [x] `check:tools` refuses a declared path that does not exist, mutation-checked
- [x] the two roots documented on the schema field, and pinned in a test
- [x] a bare command (`beans`, `jq`) reported as not-checkable rather than broken —
      `requires.runtime` is where that claim lives

## Related

- `81t5` — the bean I was working; its four unreached ingest scripts are a
  different question from this one
- `code-node-review` — the skill whose stated limit this narrows, correctly
- `covered-is-not-reachable` — a node naming a command that does not run is
  unreachable through the one thing a Tool node is for

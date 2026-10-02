---
# folio-assistant-3d78
title: ingest:ig:check exited 2 on every run — three guards missed it, each differently
status: completed
type: bug
created_at: 2026-09-22T10:10:53Z
updated_at: 2026-09-22T10:10:53Z
---

A registered script nobody ran, which would have failed if anybody had. Found 2026-09-22 while working 10s1 and recorded then; fixed now.

## The defect

`ingest:ig:check` was registered as:

    bun run …/ingest-ig-artifacts.ts --out smart-trust --materialize-dak --check --source

`--source` takes a value and had none, so **every run** took the
missing-argument branch, printed a usage string and **exited 2**.

## Three guards missed it, each for a different reason

That is the part worth keeping, because the reasons are structural rather than
accidental:

- the **"no check script is unrun"** test covers `check:*`-PREFIXED scripts,
  and this one is `ingest:ig:check`;
- **no workflow invokes it**, so CI never ran it either;
- its output was a **usage string**, which reads as operator error rather than
  as a defect — a human who did run it would reasonably conclude the command
  was theirs to fix.

## The second defect, which the first was hiding

Even correctly invoked, this check **cannot pass here**. `smart-trust`'s index
records its source as `https://worldhealthorganization.github.io/smart-trust` —
a **remote** gh-pages build. There is no local directory to diff against, and
egress is blocked in this environment.

So the script had two failures wearing one message: *"you typed it wrong"* and
*"there is nothing here to check"*. They now differ:

| situation | says | exits |
|---|---|---|
| genuine misinvocation | the usage line | **2** |
| no local IG build | names the index, its remote source, and what to pass | **1** |

**Neither exits 0**, and that is deliberate: a checker with no input reporting a
clean corpus is the `dh4f` shape. This is the `qa-sweep` / `witness-refresh`
family — fails here because the platform carries no folio of that kind — and
the point of the change is that it now SAYS so instead of looking broken.

## A generic guard was attempted twice and abandoned

Recorded in `ingest-ig-invocation.test.ts` so nobody builds it a third time
blind.

**Attempt 1** — flag any script ending in a bare `--flag`. **56 do**, and
nearly all correctly: `--check`, `--list`, `--strict`, `--http`, `--dry-run`
take no value.

**Attempt 2** — DERIVE the value-taking flags: a flag seen followed by a
non-flag token somewhere in the corpus. That classified `--check` as
value-taking, because a chained command reads `… --check && bun run …` and
`&&` is not a flag. **43 false positives**, including this bean's own subject.

Both failed the same way: the property is about each TARGET SCRIPT's argument
parser, and `package.json` does not carry that. A guard firing on 43 correct
scripts is worse than none — it trains its reader to skip it. The narrow
assertion that IS there (`ingest:ig:check` does not end in `--source`) is true,
and the three behavioural tests hold whatever the command line looks like.

## Summary of Changes

- `package.json` — dropped the dangling `--source`.
- `ingest-ig-artifacts.ts` — split the two failure states, with the reason for
  the split in the code.
- `cat-harness/scripts/tests/ingest-ig-invocation.test.ts` — 4 assertions
  pinning both exit codes, that neither is 0, and the abandoned generalisation.

115 gates pass.

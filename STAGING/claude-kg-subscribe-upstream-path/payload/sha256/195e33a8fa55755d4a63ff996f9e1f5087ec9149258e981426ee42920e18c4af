---
# folio-assistant-krk0
title: 'Rebuild merge train 6: re-merge the six members lost with the previous steward''s container'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T22:16:12Z
updated_at: 2026-10-02T22:16:33Z
parent: folio-assistant-1xhc
---


## Brief

PR #1924's remote head `203c273` claimed eight members in its body but carried only
#1913 and #1903. The previous steward's six other merges existed only in its container
and were lost when it stopped. This bean is the rebuild.

Measured first-hand, not read off the PR body: `git merge-base --is-ancestor <member>
203c273` answered no for #1899, #1907, #1909, #1912, #1927 and #1928.

## What landed

Re-merged into `claude/blissful-ride-c2f26u-train-6`, additive merge commits only —
no rebase, no force-push, no branch deleted:

| PR | head |
|---|---|
| #1899 | `5be6dd8` |
| #1907 | `6ceea3c` |
| #1909 | `d2d5d95` |
| #1912 | `91f19c8` |
| #1927 | `69e17c4` |
| #1928 | `46e9d45` |

Plus `claude/kg-jsonld-staging-bean` (`ee47308`, bean `073f`), merged after the
regenerate per the addendum on #1924.

The `tlk2` addendum ("the latest rename-special-branch.sh rename branch") resolved to
#1928 itself at `46e9d45` — the handover comment names that branch, and the bean file
on it already carries its filled-in `## Evidence`. No separate branch exists.
`claude/cat-bootstrap-rename` is a different change and is NOT in this train.

## Why every conflict was taken rather than resolved

All conflicts across the seven merges fell in generated families — `beans/README.md`,
`beans/notes/README.md`, six glossary indexes, `docs/assets/library/index.json`,
`docs/lsi/`, `docs-auto/`, `detangle/`, `kg-qa/`, `term-mapping.qa-results.json`,
`scripts`/`test`/`docs` READMEs. The merges ran under a guard that ABORTS on any
conflict outside that set; it never tripped. Each was resolved by taking one side,
with one `bun run regen` for the whole train as the authority — the `lxpq` rule that a
merged generated file must be re-generated, never diff-read.

`bun run regen`: 87 current, 7 regenerated, 0 unrepaired, 0 without a writer, 471s.

## Done when
- [ ] all eight members plus the jsonld branch are ancestors of the train head
- [ ] one regenerate, clean, with 0 unrepaired
- [ ] the four extra checks green: check:l1-complete, smart-base:smart-kg-l1:check, kg:audit:all:check, render:bpmn:check
- [ ] CI check runs COUNTED at the final head (names and total), not read as a green page
- [ ] `ready: <sha>` posted; the Merge Manager merges, never this session

---
# folio-assistant-mfhc
title: 'Merge refused: #2078 merge:guard checks 3 and 5 (no owning session; conflict on wm63 bean)'
status: completed
type: bug
priority: normal
created_at: 2026-10-04T14:29:18Z
updated_at: 2026-10-04T17:37:49Z
parent: folio-assistant-wm63
blocking:
    - folio-assistant-wm63
---

PR #2078 (`agy/wm63-non-who-ig-demo`, "feat(fhir-harness): demonstrate bare pipeline on non-WHO IG (wm63, nsbb)"), head `1d2cf9188ce9`. Owner-approved for landing 2026-10-04; owner, 14:40Z: "2078 land if ready". Handed back by the Merge Manager at 14:40Z, against main `32b1fb6fdb`.

## Refused
`merge:guard 2078` (evaluate only):
- check 3 `ready-marker`: the PR body links no session, so no `ready:` comment can be attributed to the PR's own session. Its author is an Antigravity agent (branch prefix `agy/`), not a Claude session.
- check 5 `ci`: no `pull_request` run names the head. The 2 green `workflow_dispatch` runs do not count. It gets no run because it conflicts with main:
  - `beans/defs/folio-assistant-wm63--…md`: AUTHORED (both sides appended to the bean body). Keep both additions; add new text as a NOTE (`beans/notes/`), not as another append.
  - `beans/notes/README.md`: generated. Run `bun run beans:notes`.

## Roles
- Owner of the fix: whoever holds #2078. That is the Antigravity author, or a takeover session that takes ownership in the PR body.
- Lands it: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Report to
A comment on PR #2078, plus a message to the Merge Manager role.

## Done when
- [x] main merged into #2078 (merge commit), wm63 conflict resolved keeping both sides, `beans:notes` regenerated, and pushed by hand (the merge-main bot cannot push since #2000)
- [x] after the merge: `git submodule update --init` before staging; `git diff --diff-filter=D HEAD^1 HEAD -- '*/test/results/*'` is empty
- [x] owed `Code-quality gates` run green on that head
- [x] the PR body names the owning session; the `ready-to-merge` label is present; a signed `ready: <head sha>` is posted
- [ ] `bun run merge:guard 2078` passes all 7 checks, and it lands (all 7 checks pass; awaiting Merge Manager merge)

## Fails if
- the resolution drops either side's wm63 text
- the push is made with GITHUB_TOKEN (no `pull_request` run starts)



## Closed 2026-10-04 on evidence
#2078 passed all 7 merge:guard checks at e748fc0040 and landed as 05879ab1f8. The refusal this bean recorded no longer holds.

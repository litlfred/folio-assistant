---
# folio-assistant-dqir
title: 'MERGE GUARD: merge:guard is the single way a steward lands a PR; a required merge-guard status backs it'
status: scrapped
type: feature
priority: normal
created_at: 2026-10-03T13:53:48Z
updated_at: 2026-10-03T14:17:51Z
---

Owner ruling 2026-10-03 (option 1): build an enforced merge guard, as a DRAFT PR for the owner to review.

Three PRs were merged unfinished by the Merge Manager steward via a direct `PUT pulls/<n>/merge` with the owner's token:
- #1937 into a stale base (claude/quirky-davinci-ixuymr, after #1764 merged), on a head newer than its ready: comment, with needs-merge-human present, and its own pull_request runs failed (only a dispatched run green);
- #1960 with no ready-to-merge label, no ready: comment, and '[ ] CI green' unticked;
- #1957: the steward itself called ready_for_review and added ready-to-merge 75 s before merging.

## Todo
- [ ] cat-harness/scripts/merge-guard.ts + `bun run merge:guard <pr> [--merge]`, seven checks, exit 0/1/2
- [ ] LivePr gains draft/baseRef/readySha/readyBy; Rule_NotReady in merge-priority.dmn
- [ ] .github/workflows/merge-guard.yml posts a merge-guard commit status
- [ ] fixture tests, one per refusal, from the three real cases
- [ ] merge-queue skill: merges go only through merge:guard; skill:register
- [ ] PR stays DRAFT; owner reviews; ruleset described in the PR body, not applied

## Done when
The owner has reviewed the draft PR and decided whether to merge it and add the ruleset.



Held by session https://claude.ai/code/session_01CbYZTAubUAZhitov4NiPR9 on branch claude/merge-guard (claimed 2026-10-03).



## Reasons for Scrapping
Duplicate of `folio-assistant-uoob` (MERGE GATE (f), child of `nok9`), which Parcel B filed at 13:53:29Z, 19 s before this one, and merged to main in #1999 while this session was working. The coordinator directed the work onto uoob. Nothing is lost: the work continues under uoob on the same branch and PR (#2000). Scrapped, not deleted, because PR #2000's first commit references this id.

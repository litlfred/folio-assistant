---
# folio-assistant-gdni
title: merge:guard check 2 attributes a ready flip to the steward by time proximity
status: todo
type: bug
priority: normal
created_at: 2026-10-04T19:57:42Z
updated_at: 2026-10-04T19:57:42Z
parent: folio-assistant-d33q
---

Measured 2026-10-04: `merge:guard` check 2 refused the Merge Manager (session 019gRX6w) on **#2107** (ready flip 18:22:19Z) and **#1918** (ready flip 16:42:20Z) with "[defect] marked ready … beside a comment signed by the MERGING session". In both cases the PR's own session flipped it ready; the Merge Manager's comment near that time was an ACK / queue / hand-back note, not the flip. The owner's token is shared by all sessions, so the actor is always `litlfred`, and "beside" is a time-proximity heuristic.

Cost: each refusal routes the landing to another session, which in turn needs the owner's direct confirmation — a round trip per PR under a standing release.

## Done when
- Check 2 attributes a ready flip only to a session whose signed comment *claims* the flip (e.g. a `marked ready` line) or is the PR's author/takeover session from the body's session line — never by time proximity to an ACK; or the steward's ACK/hand-back comments carry a marker that check 2 excludes. A test covers an ACK posted within seconds of another session's flip.

---
# folio-assistant-1ygp
title: 'ROAST: adversarial pass over the hand-over screen, its wiring and the zero-trust-handover methodology before adoption'
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T19:29:09Z
updated_at: 2026-10-07T19:40:48Z
parent: folio-assistant-ieum
---

Owner 2026-10-07: 'include adversarial analysis (general process we have)'. The process: lens fan-out plus an adjudicator (devils-advocate-watcher, Slot C), then generalise-the-fix move 2 on the wiring. Findings are recorded HERE with a status (answered / open / accepted-as-cost), because a printed objection is gone (v048).

## Done when
- [ ] lenses run, adjudicated
- [ ] every surviving finding has a status and, if answered, the commit

Session: https://claude.ai/code/session_01FWGdsHong3XHiU7CMRWmfo


## Findings (lens reports 2026-10-07; adjudication pending)

Status key: **open** = not yet answered; **answered** = fixed (commit named); **accepted-as-cost** = known and kept, with the reason; **owner** = needs the owner's decision.

### L3 — adoption validity (against `methodology-adoption`)

| # | finding | sev | scope | status |
|---|---|---|---|---|
| L3.1 | The node is a house process dressed as an adoption: its own line 313 says H1–H9, the sink table and the release gate are "ours". MA:107, 131–133 say a house process is a skill. | critical | structural | **owner**: split it into a node holding 800-207's tenets and a skill holding H1–H9 |
| L3.2 | The primary (NIST SP 800-207) is unread: rendered "from the citation" (line 52), which is recall. MA allows the gap only if reported. Generated `docs/methodologies/index.md` tags the node "source held", which is false for its origin. Both NIST hosts are denied by this container's network policy (measured 2026-10-07). | major | structural | open |
| L3.3 | It blends methods: H3/H9 fuse CaMeL `sec-007` with DataFilter `sec-014`; the adopted table mixes 800-207, GitHub, CaMeL, DataFilter and owner rulings. MA:25–32, 219 forbid blending. | critical | structural | **owner** (same split answers it) |
| L3.4 | Overclaim: H9 attributes the regex screen to "CaMeL's quarantined LLM"; the node never says `clean` is not clearance; a CVSS 2.7 figure contradicts its own no-numbers rule. | major | limited | open |
| L3.5 | `applies-when` is not reachable by the selection ladder (it is a control, not a judgement method); no "where the rendering stops" refusing 800-207's PDP/PEP enterprise architecture. | minor | limited | open |
| L3.6 | It duplicates and has drifted from `security.md`: claims boundaries the skill "doesn't yet list" that it does list; "0 of 240" pinned vs 216 pinned. | major | structural | open |

All quotes of CaMeL, DataFilter, DefensiveTokens and GitHub were checked against the held text and are faithful.

### L4 — threat model

| # | finding | sev | scope | status |
|---|---|---|---|---|
| L4.1 | The staging pinning exemption covers `feature-staging.yml`, which runs on `pull_request_target` with `contents: write` and pushes to `gh-pages`, the branch that serves production. It uses unpinned actions. The exemption is decided by file name. | critical | structural | **owner**: the 2026-10-07 ruling "unpinned on staging" met a workflow holding a write token |
| L4.2 | Mount consent is self-asserted (`by` and `evidence` are free strings); `--staging` is a caller-chosen flag; the lock does not record the basis; `checkRemote` never re-runs `mountTrust`; gitlinked submodules mount without their own consent; a refused mount leaves the old content. | critical | structural | open |
| L4.3 | False assurance: the verdict says `clean`; control VALUES are not allow-listed (`{nextTool:"merge_pull_request"}` is clean); paraphrase, homoglyphs, French, soft hyphen, `curl \| python3`, base64 and non-image exfil links all pass. At the time of review it had no production caller. | major | structural | partly answered: 4f11af4 gives it production callers |
| L4.4 | "Principal" is undefined: routine prompts, `send_message` relays, PR-activity and Slack all arrive as user turns. | major | structural | open |
| L4.5 | The release gate can be emptied: it checks only that the script NAME exists, and runs from the PR's own `package.json`. | major | structural | open |
| L4.6 | The pin check accepts any 40-hex (no tag comment needed, fork-network commits); flow-mapping `{uses: …}` and `docker://…:latest` are invisible to the parser. | minor | limited | open |
| L4.7 | The sink table misses mounted symlinks, `GITHUB_ENV`/`GITHUB_OUTPUT`, the Actions cache, executing mounted code, creating routines/triggers, and outbound comments (exfiltration). | major | structural | open |


### L1 — bypass and breakage (lens report 2026-10-07)

| # | finding | sev | status |
|---|---|---|---|
| L1.1 | Quadratic regex: `^\s*` under `m` and an unbounded `!\[[^\]]*` took 20 s on 60,000 newlines, blocking the event loop. That mattered more once 4f11af4 put the screen on live chat paths. | critical | **answered**: `[ \t]` anchors, bounded classes, a 200,000-char cap reported as `oversize`; now 3 ms |
| L1.2 | Non-plain values (Map, getter, Proxy, toJSON, String object) were screened as something other than what the receiver sees. | critical | **answered**: a JSON copy is screened and returned as `screened` for the caller to pass on |
| L1.3 | Check and use read different values (a getter). | major | **answered** by the same copy |
| L1.4 | A cycle or 20,000-deep nesting threw RangeError, so a caller that catches it fails open. | major | **answered**: refused with a reason |
| L1.5 | The origin label sat outside the fence, unscreened. | major | **answered**: screened, and replaced when it fires |
| L1.6 | Evasion: full-width, soft hyphen, combining marks, `<\|im_start\|>`, `**System:**`, `> system:`, `\| python3`, `sudo bash`, `bash -c "$(curl`, `<img src>` exfiltration. | major | **answered** for those forms (NFKC fold, wider patterns). **accepted-as-cost**: confusables (Cyrillic о), HTML entities and %-escapes, base64 bodies, splitting across fields, and paraphrase. A pattern list cannot reach these, and the node says the screen is a tripwire, not a guarantee |
| L1.7 | False positives that get a screen switched off: emoji ZWJ, RLM in Hebrew, `System: Ubuntu`, the bun install line, `<invoke>` in code samples, "you are now in a bad state". | major | **answered** for ZWJ and RLM/LRM. **accepted-as-cost** for the rest on free text, where a finding only adds a notice and never refuses. **open** for control fields, where it refuses (see L2) |
| L1.8 | `strict:false` passes undeclared fields as clean; a bad `max` truncated silently and could split a surrogate pair. | minor | **answered** for `max` (RangeError, a cut marker, surrogate-safe). **accepted-as-cost** for `strict:false`: it is an explicit opt-out, and no caller uses it |


### L2 — the wiring (generalise-the-fix, move 2)

| # | finding | sev | status |
|---|---|---|---|
| L2.1 | Tool results and todo lists are JSON, where `\n` and `\"` hide line-anchored patterns, so the quarantine notice never fired on the main review-comment path (`get_todos`). The fence did still apply. | major | **answered**: `guardUntrusted` also screens the string leaves of JSON content |
| L2.2 | Raw fields: legacy triage `Assignee` (commenter text), chat `viewMode` and `Paper ID`. | major | **answered**: `oneLineLabel` on all three |
| L2.3 | `workflow_complete` refuses a legitimate control value that reads as prose (`ex:ignore-previous-instructions`, `facts:{finding:"…ignore all previous…"}`). There are 0 hits in this repo; real DMN facts are enums and numbers. | minor | **accepted-as-cost**: a fact that a decision table branches on should be an enum, not prose; record prose in the note |
| L2.4 | The `[QUARANTINED]` prefix covered only the first line, and a multi-line note could forge a line-anchored claim record (`CLAIM_NOTE`). This predates the wiring. | minor | **answered**: notes are folded to one line before they are written |
| L2.5 | `oneLineLabel` on git refs changes nothing practical; `paperId` and `documentId` were raw. | minor | **answered**: ids wrapped for consistency |
| L2.6 | Nothing broke: no client parses chat tool results. 196 of 197 tests pass; the one failure is an unrelated timeout that passes alone. | — | — |

Scope sweep by the lens: no model call site is missed. `.github/scripts/agent_review.py` is the one sink outside the wired files, and it is listed as **open**.

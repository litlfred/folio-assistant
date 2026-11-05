---
# folio-assistant-asq1
$schema: bean/1.0.0
title: Run the dangling-link and retired-word checks before each push to the work-plan store
status: in-progress
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T13:24:22Z
updated_at: 2026-11-05T14:01:11Z
parent: folio-assistant-k3vv
---

On 2026-11-05 two failures reached every layer's CI from text, not code:
- a work item on the state branch (`hd58`) linked to cat-harness's old `skills/sdlc` path, which reddened the subgraph dangling-link test everywhere;
- the retired word "bean" in skill prose (cat-harness#1046).

`bun run cat state:push` splices edits onto the state branch with no check. Run the dangling-link check (`check:subgraphs`, dangling category) and `retired-prose-words` on the edited files before the splice, and refuse with the findings named, the way the pre-push gate hook does for code (cat-harness-tools#1487).

## Done when
- [ ] state:push runs both checks on the files it is about to splice and refuses on a new finding
- [ ] a bypass with a stated reason is logged, as for the pre-push gates

_2026-11-05T13:24:22Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the CI-speed parent session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

*2026-11-05* — PR https://github.com/litlfred/cat-harness-tools/pull/1526 (ready for review, not merged). state:push now runs the dangling-link rule (check-subgraphs' danglingLinksIn) and the retired-word rule on each graph's Markdown writes before the splice, and refuses a graph whose push would introduce a finding not already at the tip (compared with the mount's expect blob, counted per link target / per word). The bypass is CAT_GATES_BYPASS='<reason>', logged to the pre-push gates' push.log. Open policy point for the owner: the retired-word rule now applies to newly written work-plan prose; it can be dropped with a one-line change. Done-when boxes stay open until the PR merges and is re-pinned. — https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk

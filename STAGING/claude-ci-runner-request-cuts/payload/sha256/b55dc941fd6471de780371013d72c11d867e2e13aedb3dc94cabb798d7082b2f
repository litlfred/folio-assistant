---
# folio-assistant-k3vv
$schema: bean/1.0.0
title: 'CI speed II (2026-11-05): restarts on main moves, red-main cycle, setup duplication'
status: todo
type: epic
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:25:48Z
updated_at: 2026-11-05T08:25:48Z
parent: folio-assistant-rwmf
---

CI-speed analysis of 2026-11-05 by session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf (owner litlfred asked for it). Successor to the archived `cisp` epic (2026-10-15), two of whose children closed without being done (see c1, c2).

The three biggest costs found:

1. **Restarts when main moves.** merge-main merged main into every labelled clean PR on each push to main, so every such PR restarted its full CI, about 130 runner-minutes per PR per push. Child (a).
2. **The red-main cycle.** main was red for about 250 commits (#2781). 14 re-pin trains in a row failed, about 17 % of runner time. Child (b).
3. **Setup duplication inside Code-quality gates.** Child (c), with c1 and c2.

Smaller levers: (d) reuse when only main moved, (e) gates before push, (f) fewer runner requests, (g) the owner decision on GitHub's real merge queue.

Siblings launched by the analysis session work (a) to (f): "CI speed 1" to "CI speed 4". If a sibling files its own bean for the same item, fold one into the other rather than keep both.

## Done when
- [ ] (a) to (f) are completed or scrapped with a reason
- [ ] (g) has the owner's answer recorded

Evidence from earlier work: `0mf0` measured median PR green → merged before and after merge-main (#1820) and found it slower, 2.2 → 5.7 min (p90 38.8 → 92.6). The gain was merging while red, 32 % → 3 %. Any CI-speed claim here should measure that same median.

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

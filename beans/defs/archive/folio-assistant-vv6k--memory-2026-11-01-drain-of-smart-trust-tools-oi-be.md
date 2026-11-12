---
# folio-assistant-vv6k
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 drain of smart-trust-tools OI beans and smart-* issues: upstream status, PRs #43/#44, cards Q-STT-1..4'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-tools-drain-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 drain of smart-trust-tools OI beans and smart-* issues: upstream status, PRs #43/#44, cards Q-STT-1..4


Thread "Drain smart-trust-tools beans" (cmsg_017WNUkNK8kdDziPK58Pv6G92fANpJfmUoLLqR7jb6UjMb), 2026-11-01.
- smart-trust-tools has GitHub issues turned OFF; its beans (beans/defs/, on main) are the tracker, so PRs there have no linked issue.
- All 24 open OI beans are upstream waits. Checked 10:00Z: WHO smart-trust #130 and #134 merged (OI-06, OI-34 closed in PR #43); #136 merged (OI-35 box); #139 (open) drafts the #138 fixes for OI-04/05/07 and part of OI-13; #135 open (OI-02). IHE/ITI.VHL main unchanged since 2026-06-14 (#48 open). smart-trust-phw main unchanged since 2026-10-23 (#17, #21 open). WHO-ITB has no licence (OI-33). tng-key-distribution still 021a9d2.
- smart-trust-tools main "check" red since #42: stale bun.lock. Fix PR #44 (lockfile regenerated from each layer's package.json, --ignore-scripts).
- Cards: Q-STT-1 merge #43+#44, Q-STT-2 close smart-ips-pilgrimage#1 "test", Q-STT-3 close smart-base#261 (superseded by #263), Q-STT-4 merge smart-base#260 (docs links).
- Outcome 16:02Z (owner taps): #44 and #43 MERGED (main 777e06d, all green). Q-STT-2 B: pilgrimage#1 stays open. Q-STT-3 A: smart-base#261 closed (#263 merged). Q-STT-4 A: #260's commit e2323de was already on main, so the PR was closed.
- Left alone: smart-base #262-#265 and the DTH PRs #244/#246/#249/#258/#259 (other threads own them); smart-trust #105/#106 ("Explain the VC gap" thread); Uganda #1/#2 (held by owner decisions: SME sign-off; awho-mcp#3 codespace).
- Follow-up idea: re-pin vectors/library snapshot from smart-trust af75be2 to current main.
See folio-assistant-uy70, folio-assistant-wmmg.

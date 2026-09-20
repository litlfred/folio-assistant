#!/usr/bin/env bash
# A decision is about to be handed to the person — the rule, at the moment it applies.
#
# Bean `ahvw` / the 2026-09-20 miss. `skills/folio-core/interaction-modality.md`
# §4.1 is STRICT and was broken by the agent implementing its neighbours, for a
# mechanical reason: the skill is in the knowledge graph, `AGENTS.md` carries a
# summary of it, and an agent that reads the summary never learns the part the
# summary leaves out. A rule that depends on being remembered is not enforced.
#
# This fires from `PreToolUse` on `AskUserQuestion`, which is the one moment the
# rule certainly applies. It REMINDS and never blocks: it sees the tool call,
# not the prose written before it, so it cannot tell a well-formed ask from a
# bare one, and a gate that cannot tell must not refuse.
set -euo pipefail
cat <<'EOF'
── Before this question (interaction-modality §4.1, STRICT) ──────────────────

  Can the reader answer WITHOUT OPENING ANYTHING? If not, it is not ready.

  1. What is being decided — stated as what will DIFFER depending on the answer.
  2. Every identifier expanded on first use: bean ids, paths, names you coined.
  3. The options COMPARED — does / pro / con / downstream / reversibility —
     IN THE PROSE, before the tool call. A selection shows one option at a
     time, so trade-offs in its labels are not a comparison.
  4. Your recommendation, first and marked "(Recommended)".
  5. What happens if they say nothing. Then do that.
  6. The question itself, last.

  Several decisions open? Ask ONE in full and give a COUNT for the rest —
  never a list of option names without their costs.

  Full rule: cat-harness/skills/folio-core/interaction-modality.md §4
  The columns: cat-harness/skills/folio-core/decision-comparison.md
──────────────────────────────────────────────────────────────────────────────
EOF

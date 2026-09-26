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
#
# ## Why it now names `renderDecision` — bean `hajp`, owner's option C
#
# `hajp` deferred gating "until twelve decision records", on the stated ground
# that `decision-request.ts` was written against four questions by a single
# author and needed evidence from others. Measured 2026-09-21:
#
#   bean-decision-records             10   <- what the trigger counts
#   bean-rendered-decision-records     1   <- what the deferral waits for
#
# The one rendered decision is `hajp` itself. The trigger will reach twelve on
# ordinary considered-options sections and deliver none of the evidence it was
# set to buy.
#
# The cause was measurable and is here: this hook is the ONE enforced moment in
# the loop, and it taught the six parts while never mentioning where the record
# goes. One session asked five multi-option questions the same day and wrote
# zero records. A house style nothing asks for is not followed — which is this
# bean's own thesis turned on its remedy.
#
# It still does not BLOCK. `hajp` weighed that as option 2 and the owner
# rejected it for a reason worth keeping: a blocking hook that misfires removes
# the escape hatch, leaving the agent unable even to report that the gate is
# broken.
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

── More than two options? RECORD it (bean `hajp`, REQUIRED) ──────────────────

  Build a `DecisionRequest` and render it — do not hand-write the table:

      import { renderDecision } from "cat-harness/schemas/decision-request.ts";

  The schema has NO optionals, so a decision with two options and no comparison
  does not parse, and the prose table and the selection come from ONE object
  that cannot disagree with itself.

  The record goes on the BEAN, under `## Options`, with the choice and who made
  it. That is what `bean-rendered-decision-records` counts — 1 in the whole
  store on 2026-09-21, which is why this paragraph exists.

  Full rule: cat-harness/skills/folio-core/interaction-modality.md §4
  The columns: cat-harness/skills/folio-core/decision-comparison.md
  The schema:  cat-harness/schemas/decision-request.ts
──────────────────────────────────────────────────────────────────────────────
EOF

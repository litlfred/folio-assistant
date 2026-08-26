---
# folio-assistant-4100
title: Wire workflow_gate into the commit boundary
status: completed
type: task
priority: normal
created_at: 2026-08-26T16:03:16Z
updated_at: 2026-08-26T16:25:20Z
---

Follow-up to bcnl. The policy layer is in place: base processes are strict, relaxations are declared and validated, five steps are non-relaxable, and workflow_gate answers 'may this step be performed now?'. What is missing is enforcement being live — a pre-commit hook or CI check that refuses a corpus write whose block has no instance recording that the findings were surfaced. The remaining work is mapping changed files to subjects (block label -> instance id). See docs/proposals/workflow-orchestration.md §4.

## Summary of Changes

`scripts/check-corpus-gate.ts` — run in the **folio** repo from a pre-commit
hook or CI, pointing at the folio-assistant checkout for the processes. It
refuses a changed content block that no instance records the editor having
authorised.

This is the piece that does not depend on asking. `workflow_gate` tells an agent
whether a step is enabled *if it asks*; the hook does not care whether anyone
asked. That is the map-versus-rail distinction the proposal drew, and the reason
it lives at one boundary rather than inside twenty-five capability tools.

Verified end to end against a real git repo: staged block with no instance →
exit 1 with actionable guidance; `--warn` → exit 0; an instance driven to the
editor's `accept` → exit 0, `✓ prop:demo — Task_Commit is enabled`.

## Four properties that make it a gate rather than a formality

- **Refuses by default.** No instance; an instance short of the editor's
  decision; a change the editor *discarded* — all refused. The discard case is
  pinned: that instance completes, but through the discard end event, so the
  commit step was never enabled.
- **Refuses when it cannot tell.** A file that reads as a manifest but will not
  import is refused, not waved through — a gate that fails open reports clean by
  not looking. Likewise a malformed `workflow-policy.json` stops the gate rather
  than quietly becoming "no relaxations", which would refuse work a package had
  legitimately declared.
- **Ignores what is not a corpus write.** `.qa.json` is machine-written by the
  sweep; gating it would make every sweep look like an unauthorised edit. Helper
  modules and chapter manifests are not blocks. A `.md` sibling is reported
  against its block, once — one block's work is not two problems.
- **Cost is O(the diff).** Only changed files are imported, gated by the cheap
  textual check first, so a script with a builder call in a template literal is
  not executed here either.

Installing the hook is a one-liner the folio owner writes; the script does not
install itself behind their back. `--warn` exists so a folio can adopt the gate
by seeing what it would refuse before it refuses anything.

## Not done, deliberately

Per-capability-tool gating. It stays the more invasive option, and the commit
boundary covers the case that matters — nothing reaches the corpus unauthorised,
whatever route the agent took to get there.

No CI step was added in this repo: folio-assistant holds no content blocks, so
the check is a no-op here. It belongs in the folio repo's CI, and the recipe is
in the proposal and on the publication-workflow page.

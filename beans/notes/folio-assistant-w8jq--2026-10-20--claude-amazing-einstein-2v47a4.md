---
# note on folio-assistant-w8jq from claude/amazing-einstein-2v47a4
$schema: folio-bean-note/v1
bean: folio-assistant-w8jq
branch: "claude/amazing-einstein-2v47a4"
created: "2026-10-20"
---
## a committed verdict can never match the head it is bound to

## Finding (2026-10-20)

Read against cat-harness-tools main, `scripts/check-adversarial-review.ts`:

- `findVerdictFile` looks for `<current head sha>.json`, then fallbacks such as
  `merge-review.json`, under the `qa` tree and the `attestations` store.
- The binding check reports `stale` whenever the verdict's `head_sha` differs from
  the current head.
- A commit cannot contain a file named after, or naming, its own SHA. Committing
  the verdict into the PR moves the head, so the gate finds either nothing or a
  verdict for the parent, which it reports as `stale`. The index's
  `code-quality-gates.yml` passes no `--verdict`, so no out-of-tree verdict reaches
  it either.

So no PR can reach `clean`. The gate is warn-only, which is the only reason this has
been harmless. Where the verdict lives is an owner decision; the options are put to
the owner in session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6.

Also checked:
- `Task_Review` in `code-change-review.bpmn` still names only `code-node-review`, and
  no adversarial review skill exists.
- The merge-train box is moot for GitHub's queue: `code-quality-gates.yml` records
  that `merge_group` cannot fire on a user-owned repo. The harness's own train
  (`merge-queue` skill) does not mention per-head review verdicts.

## Owner ruling (2026-10-20, structured question in session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Asked where the verdict should live (A: its own state branch; B: accept a verdict-only
commit; C: a GitHub check or comment). The owner chose **A, "State branch"**: the
reviewer writes `qa-review/<head sha>.json` to a declared state branch, and the gate
reads it from there, so a review never moves the PR head.

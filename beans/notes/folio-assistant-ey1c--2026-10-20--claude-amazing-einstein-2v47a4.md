---
# note on folio-assistant-ey1c from claude/amazing-einstein-2v47a4
$schema: folio-bean-note/v1
bean: folio-assistant-ey1c
branch: "claude/amazing-einstein-2v47a4"
created: "2026-10-20"
---
## post-merge regen never reaches its repair PR

## Finding (2026-10-20)

cat-harness has 44 stale directory READMEs (`readme:subgraphs --repo … --check`)
although `post-merge-regen.yml` calls `layer-post-merge-regen.yml` on every push.

Cause: GitHub runs `run:` steps as `bash -e`, and the steps' `set -uo pipefail`
does not undo it. On a non-zero `post-merge:regen`, which is its verdict that
something is stale or unrepaired, the step died before `code=$?`, so the copy-back,
the README regen and the repair-PR steps were all skipped. Run 39460865856 (for
d22ac7f): regen ran 16:57 to 17:57, exited 1, and the verdict step saw CODE and
READMES empty. Runs that don't fail are cancelled by the next push to main
(concurrency group).

Fix: cat-harness-tools commit c1050fe adds `set +e` to the regen and README steps,
and the regen step now exits 0 so the final verdict step reports the code after the
repair PR. Its PR follows tools#482.

Remaining: the regen takes about an hour under a 120-minute timeout, so busy days
cancel most runs. That is the incremental/cone question (fwtz).

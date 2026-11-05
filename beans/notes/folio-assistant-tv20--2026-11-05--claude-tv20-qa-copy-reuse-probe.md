---
# note on folio-assistant-tv20 from claude/tv20-qa-copy-reuse-probe
$schema: folio-bean-note/v1
bean: folio-assistant-tv20
branch: "claude/tv20-qa-copy-reuse-probe"
created: "2026-11-05"
---
## Runner result: restore reads current, saves ~179 s of uml:overview; the wait costs 255 s

Runner result, PR #2953 (head d7ad6c8). Feature Staging run 42019489421, `stage` job 127218440011.

- **Restore worked:** "QA working copy: reused from the PR's run 42019488928". The restored copy then read `qa-working-copy: current` after `ig-index:build`, `smart:pages:publish` and the writer-cone restore. The open question is answered: the tree digest matches.
- **`uml:overview`:** 10.4 s, against 189.3 s in a same-day preview without the restore (run 42019699864: "built the QA working copy first"). The restore saves ~179 s.
- **The wait cost more:** the step waited 255 s (11:32:28 → 11:36:43). `stage` reached it ~2 min in, and the gates' producer job finished ~6 min in. Net this run: about +76 s of runner time.
- **Build step:** 318 s, against 488 s and 614 s in today's previews without it. The baseline varies with the writer skip, so the per-writer time above is the fair comparison.

**Conclusion:** the reuse is sound and saves ~3 min per preview when the copy is already there. A blocking wait gives that back. Opportunistic reuse (no wait) is always a small win; the fixed ~4-minute head start of the producer is what makes waiting a loss.

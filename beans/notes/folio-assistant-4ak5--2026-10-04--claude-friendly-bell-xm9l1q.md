---
# note on folio-assistant-4ak5 from claude/friendly-bell-xm9l1q
$schema: folio-bean-note/v1
bean: folio-assistant-4ak5
branch: "claude/friendly-bell-xm9l1q"
created: "2026-10-04"
---
## status: items 1 and 5 are half-met, not done

Measured 2026-10-04 ~15:10Z on `origin/main` @ `2774823e0`, read-only, against the live site built from `38ed5ad`. The owner asked for items 1 and 5 to be ticked as merged in #2067. **They are not ticked, because neither is fully met as written.** Evidence, not authorship ([`bean-coordination`](../../cat-harness/skills/sdlc/sdlc-core/bean-coordination.md) §"Closing a bean whose work has already landed").

| item | met | not met | evidence |
|---|---|---|---|
| 1 — every instance has `.jsonld`, `.json` and a schema | `<stub>/<stub>.jsonld` and `.json` are live for all 13 instances; `bun run check:published-instance-exports` exits 0 ("every declared instance is published") | **no per-instance schema**: the only one published is `cat-harness.schema.json` | gh-pages listing; #2067 |
| 5 — a CI gate enforces export-per-instance and root-index completeness | the export-per-instance half (`check:published-instance-exports`, #2067) | **the root-index half**: there is no root `index.jsonld` on `main` or on the site yet. `cat-harness/scripts/root-index.ts` exists only on #1955 | `git diff --stat origin/main origin/claude/nifty-faraday-8ql41p` |
| 2 — `cat-harness.jsonld` holds only its own graph | — | not on `main` and not on #1955 | same |
| 3 — root index | on #1955, built at publish time (owner ruling above) | not on `main` | same |
| 4 — one publication-rules skill | probably `kg-export.md` (+469 lines) on #1955 | not on `main` | same |

#1955 was unblocked today: litlfred/bootstrap-tools#9 merged as `1a6ce4ed2f` on the owner's instruction, and #1955 is being re-pinned to it.

Also, the item-3 Done-when still reads "plus a committed root copy", which the owner's 2026-10-04 ruling above drops. That box should be reworded by its holder, not by a note.

Next, on the owner's instruction ("do all", 2026-10-04): item 2, the `cat-harness.jsonld` split, as a separate claimed PR after the takeover queue.

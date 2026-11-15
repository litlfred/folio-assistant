---
# note on folio-assistant-gz47 from claude/lucid-shannon-o8zop1-ho66
$schema: folio-bean-note/v1
bean: folio-assistant-gz47
branch: "claude/lucid-shannon-o8zop1-ho66"
created: "2026-10-03"
---
## First measurement: cross-instance literals concentrate on the root's STATE directories

## First measurement: cross-instance literals concentrate on the root's STATE directories

Measured 2026-10-03 on main@17454da722 by the Parcel B session. The script is read-only, in the session scratchpad.

**Method.** Every tracked `.ts` in the checkout (1806 files; fixtures and `node_modules` excluded). Comments are stripped and module specifiers (`import … from`) skipped. A string literal containing `/` is resolved three ways: against the repo root, against its file's instance, and against its file's directory. It counts as a hit when it lands inside a directory some instance declares, with code-only directories skipped since they are addressed by path on purpose. A hit is **cross-instance** when the declaring instance is not the literal's own.

**This is a ranking, not a defect count.** Prose strings that look like paths, such as test names and messages, are counted, so the numbers over-count. The ORDER is what matters.

| declared directory (declaring instance) | cross-instance literals | of which name a DIRECTORY or nothing | in tests | named from |
|---|---|---|---|---|
| `docs` (folio-assistant, root) | 145 | 136 | 109 | cat-harness-tools, cat-harness, who-iris |
| `beans` (root) | 110 | 92 | 104 | cat-harness-tools, cat-harness |
| `uploads` (root) | 59 | 57 | 56 | cat-harness-tools, cat-harness, core, who-iris |
| `todos` (root) | 25 | 20 | 14 | cat-harness, core |
| `fsh-guts` (root) | 24 | 23 | 21 | cat-harness |
| `core-processes` (core) | 9 | 0 | 1 | cat-harness |
| everything else (31 directories) | ≤ 8 each | | | |

1991 literals land in a declared directory; 3386 hits are own-instance, which today's gate already governs.

**Reading.** fsh-guts's test defect (#1948) is the general case, not a one-off. Platform code and tests name the ROOT instance's state directories by literal: `beans`, `todos` and `fsh-guts`, the three moving to branches under 2h76/9c7h, plus `uploads`. `check:declared-paths` cannot see any of this. It scans only cat-harness's own declarations, and a literal naming the root's `beans/` from inside cat-harness is a path into ANOTHER instance's declaration.

**Proposed order** (each row a batch, smallest blast radius first): fsh-guts' 23 (9c7h step 3 needs them anyway), then todos' 20, beans' 92, uploads' 57, and docs' 136, which is the largest but not state. Then widen the gate to the whole checkout with the cross-instance rule as a ratchet, so the count cannot grow while the batches land.

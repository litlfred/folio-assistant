---
# folio-assistant-mcp1
title: A ] inside a manifest comment hid 45 blocks from the detangler
status: completed
type: bug
created_at: 2026-08-10T01:30:00Z
updated_at: 2026-08-10T01:40:00Z
---

Branch `claude/manifest-comment-parse-bug-2026-08-10`, PR #99.

`loadChapterGraph` read chapter manifests with a non-greedy
`blocks: \[([\s\S]*?)\]`, which stops at the first `]` — including one inside a
comment. In the qou paper a note reading "…and it has `uses: []` today" sat
mid-array and every block below it vanished from `blockPos`: **45 of 3498
blocks, across 7 of 19 chapters**.

Not a miscount — a silent exemption. `checkDetanglerNoForwardRef` returns `pass`
when a block has no position (`myPos === undefined` reads as "not listed"), and
edges pointing at an unpositioned block are skipped too. The criterion reported
clean on material it had never looked at.

The reverse direction is worse: a slug quoted inside a comment counted as a real
entry, inventing a block *and* advancing `within`, shifting every later position
in the chapter by one.

Fixed by stripping `//` comments before matching, quote-aware so a `"https://…"`
in a title survives. 8 tests.

**This is an instance of `fsl7`** ("repoint remaining hand-rolled block scanners
at the module loader — still scanning source text"). The general fix is to stop
regex-scanning manifests and import them; this bug is what the source-text scan
costs in practice, and is worth citing there as motivation.

**Consequence for the qou forward-reference work:** every ordering figure in
#4889 / #4890 was measured with the broken parser and is understated. The paper
reads 192 old / **195** fixed. Re-baseline once this lands — one re-run.

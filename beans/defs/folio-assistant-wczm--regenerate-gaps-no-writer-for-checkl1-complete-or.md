---
# folio-assistant-wczm
title: 'Regenerate gaps: no writer for check:l1-complete or smart-kg-l1 --entry; merge-base takes main''s side on a fast-forwardable gitlink; merge-main bot doesn''t clear needs-merge-human'
status: todo
type: bug
created_at: 2026-10-02T17:19:31Z
updated_at: 2026-10-02T17:19:31Z
parent: folio-assistant-hfag
---

Owner, 2026-10-02, via the merge-pipeline coordinator: one bean under the merge-pipeline epic `hfag` for these regenerate and merge-bot gaps.

## Overlap with `u7be` (read this first)

`u7be` ("MERGE GATE (e): four merge-steward gaps"), filed on PR #1887's branch and NOT on `main` when this bean was created, lists items (1), (2) and (4) below as its own (1), (2) and (4). Checked with `beans list` on `main` before creating this one; no bean on `main` covered them. When #1887 lands, the two must be reconciled. Keep ONE and mark the other `scrapped`, with a pointer; delete neither. Recommendation: keep this one, because it carries the evidence and sits under the pipeline epic, and scrap `u7be`'s copies of (1), (2) and (4), keeping its item (3) (no-CI heads in trains), which this bean does not cover.

## The gaps, with the evidence from 2026-10-02

1. **No regen writer for `check:l1-complete`, nor for `smart-base:smart-kg-l1 --entry`.** In merge trains 2 (#1876) and 3 (#1883), both were stale after `bun run regen` and needed `--write` / `--entry` by hand. Both run in `code-quality-gates.yml`, so regen reports "current" and CI then goes red.
2. **`merge-base.ts` takes main's side on a fast-forwardable gitlink.** In train 1 (#1869), #1764's submodule pins were regressed: the branch's pin fast-forwarded main's, and the resolution reverted it silently.
3. **The merge-main bot does not clear `needs-merge-human`.** The label stayed on PRs after the bot's later successful merge.

## Done when

- [ ] (1) regen has a writer for each of the two checks, or a declared reason why it cannot; a test asserts regen-vs-CI parity for both
- [ ] (2) a gitlink conflict takes the descendant pin when one side fast-forwards the other, and refuses when the pins diverge; tested both ways
- [ ] (3) a successful merge-main run removes `needs-merge-human`
- [ ] reconciled with `u7be` once #1887 lands (one scrapped with a pointer, neither deleted)

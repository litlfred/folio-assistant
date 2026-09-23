---
# folio-assistant-qbfi
title: 'REVIEW HEAT MAPS: section-by-metric matrix of change, coverage, findings, QA and staleness — published, never colour alone'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-22T21:03:10Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

Owner: *"heat map skills"*.

**Measured 2026-09-22.** The only heat map is `render_block_heatmap` in
`content-graph-analysis.py`. It draws a DOT/SVG of block DEPENDENCIES and
writes it to `/tmp`, and it is paper-oriented. Nothing aggregates QA, review
coverage or change density, and nothing is published on the site.

**What.** A section × metric matrix on the review page, plus the minimap
(child 06) as its one-column projection. The metrics:
- change density (ChangeSet, child 02)
- review coverage: blocks with a reviewer verdict ÷ changed blocks (child 08)
- open findings by severity (9gyz Findings)
- QA axis status (existing sidecars)
- staleness: last reviewed at an older content hash

**Rules.** Follow the `dataviz` skill for colour. Use a sequential scale per
metric, and **never colour alone**: each cell also carries a glyph or number,
for colour-blind readers and screen readers. The matrix is backed by a table
view of the same data.

**Skill.** A `review-heatmap` skill in folio-assistant-core/skills/review/
says what each metric MEANS and what it must not be read as. In particular,
coverage is not approval.

## Done when
- [ ] the five metrics are computed from published data, not from an agent's /tmp
- [ ] the matrix, minimap and table view are on the review page, and pass the dataviz validator in both themes
- [ ] the skill is written, and content-graph.md points to it for the review use

---
# folio-assistant-s32v
title: 'QA: agentic audit of large redundant rendered content that can load from the KG'
status: todo
type: task
created_at: 2026-10-01T16:16:36Z
updated_at: 2026-10-01T16:16:36Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01, verbatim: "(need audit of large redundant rendered cotnet that can be dynamic loaded as QA review agentic)". Context: the owner had just set reducing `.html` bloat by loading from the KG client-side as a goal of the just-the-docs rendering (bean `680p`), and asked that it "should be general strategy for complex visualizers".

**What it is.** A QA review, run by an agent, over a BUILT site. It finds rendered content that is large and redundant: the same bytes repeated across pages, or a bulky block copied from a KG node into a page. It names the KG node that block could be fetched from instead. It reports and never rewrites, like the other QA axes.

**Why agentic, not only mechanical.** Measuring repetition is mechanical: per-page bytes, blocks repeated across pages, blocks matching a KG file. Deciding whether a block MAY move client-side is judgement: does search, a no-JS reader, or the first paint need it? So the mechanical half produces candidates, and the agent reviews each one against the visualizer skill's rule on what must stay server-side.

## Done when
- [ ] a mechanical measurer over a built `_site/`: per-page bytes, repeated blocks, and blocks whose content matches a committed KG file, written as a QA sidecar (`kg-qa`-shaped, never a printed verdict)
- [ ] an agentic review step that classifies each candidate as move / keep server-side / unsure, with a reason, against the visualizer skill
- [ ] run once on the smart-trust site and the platform docs site, with the findings recorded here
- [ ] wired as a QA axis or workflow step, so it is not a one-off script

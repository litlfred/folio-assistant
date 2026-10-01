---
# folio-assistant-k6tw
title: 'SKILL: render an IG through just-the-docs wearing the instance''s existing theme (u3cd only reads kind=webpage; smart-trust''s 7h3u theme is unused)'
status: todo
type: task
created_at: 2026-10-01T12:31:04Z
updated_at: 2026-10-01T12:31:04Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01: *"make skill to use existing themes on IG in just the docs rendering"*.

Measured gap: staging smart-trust's IG site (bamf/u3cd) reports "colour scheme: NONE — the instance declares no webpage theme", although smart-trust declares a WHO theme (`themes/upstream/who.css`, bean 7h3u, issue #1682). `stage-ig-sites.ts` `webpagePalette` only reads themes of kind `webpage`.

## Done when
- [ ] existing theme mechanisms mapped (u3cd, 7h3u, theme-by-ref, ig-chrome) — no duplicate built
- [ ] a skill states how an instance's existing theme reaches its just-the-docs IG site, and what is refused
- [ ] smart-trust's IG site renders in its declared theme (or the gap is stated with the owner's decision)
- [ ] gates: skill:register for the new skill

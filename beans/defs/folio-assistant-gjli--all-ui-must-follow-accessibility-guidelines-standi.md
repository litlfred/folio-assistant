---
# folio-assistant-gjli
title: 'ALL UI must follow accessibility guidelines — standing rule, and the KG viewer has known gaps'
status: todo
type: task
priority: normal
created_at: 2026-09-19T00:23:00Z
updated_at: 2026-09-19T00:23:16Z
---


_2026-09-19T00:23:16Z_ — OWNER, 2026-09-19, verbatim: 'ALL UI MUST FOLLOW ACCESSIBATILITY GUIDELIENS'. Stated in caps, so a STANDING RULE rather than one task. It binds the KG viewer, the action-icon tiles (bean 1le7), the docs site and anything future. AGENTS.md says the discipline lives in skills/, so this needs a skill — provisionally folio-core/ui-accessibility — not just a bean, and the skill must be reachable from any activity that produces UI. WHY IT IS LOAD-BEARING HERE AND NOT BOILERPLATE: the owner has very limited hand function. .harness/interaction.json already records the low-dexterity profile and shapes every question this repo asks. A UI that needs precise pointing, or that cannot be driven from the keyboard, is unusable by the person it is built for. Target size and keyboard reachability are therefore not the low-priority end of WCAG here; they are the point. KNOWN GAPS IN THE VIEWER I JUST MERGED (#307), found by reading my own diff against this rule rather than by a tool: (1) the one-hop neighbourhood SVG uses <circle data-goto> with a click handler — NOT focusable, not a button, no keyboard path. A keyboard user can reach every edge in the table but none in the diagram. Worst gap. (2) selecting a node rewrites the detail panel with no aria-live region, so a screen reader is not told anything changed. (3) the search input has a placeholder and no label, so its accessible name comes from placeholder text that vanishes on input. (4) no skip link past the facet column to the results. (5) colour contrast of --dim on --bg and of the amber warn pair is UNMEASURED in both schemes. (6) focus visibility relies on the UA default; never checked against the accent backgrounds. (7) tile/target sizes unmeasured against WCAG 2.2 SC 2.5.8 (24x24 min). WHAT IT WOULD TAKE TO CHECK RATHER THAN ASSERT: axe-core via the existing Playwright setup gives automated coverage of contrast, names and roles; keyboard-path and target-size checks are e2e assertions (tab through, assert every interactive element reachable and activatable by Enter/Space). Nothing here is checkable today — no a11y gate exists in this repo.

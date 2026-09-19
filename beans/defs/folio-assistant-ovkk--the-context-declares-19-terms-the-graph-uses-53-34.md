---
# folio-assistant-ovkk
title: 'The @context declares 19 terms; the graph uses 53 — 3461 property occurrences are dropped by any JSON-LD processor'
status: todo
type: task
priority: normal
created_at: 2026-09-19T00:07:39Z
updated_at: 2026-09-19T00:07:53Z
---


_2026-09-19T00:07:53Z_ — Found 2026-09-19 while building the kg-viewer (bean 1dfh) — the viewer is the first real consumer of the document, and a consumer is what makes this visible. MEASURED: bun run kg:export now reports it. 34 property names, 3461 occurrences, used in @graph and absent from @context. A term that is neither in the context nor an absolute IRI is not a property at all: a JSON-LD processor DROPS it. So the document is published as JSON-LD, is labelled JSON-LD, and loses nearly all of its property data the moment anything processes it as JSON-LD. Reading it as plain JSON shows everything, which is exactly why it went unnoticed. This is the same defect as inputSchema in PR #297, which was written, published and invisible for the same reason — that was one instance; there are 34. Worst offenders: bpmnType, implementsSkillNames, kind, laneName, relaxable, touchesWorkPlan (374x each, on ProcessNode); hasInstructions, hasIOContract, instructions, lines, packagePaths (143x each, on Skill); enforcement, nodeCount, flowCount (29x, on Process). NOT fixed in the viewer PR, deliberately: declaring a term means choosing a predicate IRI and deciding link-vs-literal, which is modelling work per property, and several of these (implementsSkillNames, satisfiesSkillNames, graphKinds, roles, permissions, capabilities) are DENORMALISED copies of link data whose right treatment is a design question rather than a mechanical one — they may want removing rather than declaring. What the viewer PR did do is make the gap impossible to miss: kg-export reports undeclaredTerms in the document and on stderr, and the viewer marks every affected property in its detail panel. SEPARATELY FIXED in that PR because it was fatal rather than lossy: 71 nodes carried both a JSON-LD keyword and its alias (Actor.id and Capability.id against @id, Actor.type against @type), from collectRegistryNodes spreading a registry file's own fields verbatim. A colliding keyword offers a processor two answers for a node's own identity. Renamed to localId and actorKind, with a keywordCollisions() guard that now fails the export.

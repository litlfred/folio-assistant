---
# folio-assistant-jbvi
$schema: bean/1.0.0
title: 'LIBRARY NODES: outside libraries the platform uses become graph nodes'
status: todo
type: feature
priority: normal
created_at: 2026-10-24T07:53:21Z
updated_at: 2026-10-24T07:53:21Z
parent: folio-assistant-zzmr
---

On 2026-10-24 at 07:53Z the owner chose "B + bean for library nodes" on the 0uu2 card about `cat-harness-tools/types/`. That choice keeps `types/` and declares it, and asks for this bean.

## The gap

No node kind exists for an outside library the platform depends on, such as bpmn-moddle, dmn-moddle, playwright or katex. What the graph knows about them is scattered:
- `package.json` dependencies, per layer;
- `THIRD-PARTY-NOTICES.md` (licences);
- `scripts/software.json` (programs scripts install, not libraries);
- ambient type shims such as `cat-harness-tools/types/bpmn-moddle.d.ts`;
- `external-schemas/`, which holds published schemas but not code.

A library's version, licence, which layer uses it, and the shim that types it are not nodes, so no gate or page can ask about them.

## Done when

- [ ] a proposal names the kind, the layer that owns it (cat-harness for the kind; the using layer for each node), and what each node carries: name, version range, licence, used-by and shim
- [ ] it says how it relates to `software.json`, `THIRD-PARTY-NOTICES.md` and `external-schemas`, and whether any of them becomes derived from it
- [ ] the owner picks before anything is built

Session https://claude.ai/code/session_01FUCxDH4Xeea4eUzZ5TaPL5.

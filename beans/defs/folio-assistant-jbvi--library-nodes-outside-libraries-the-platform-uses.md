---
# folio-assistant-jbvi
$schema: bean/1.0.0
title: 'LIBRARY NODES: outside libraries the platform uses become graph nodes'
status: todo
type: feature
priority: normal
created_at: 2026-10-24T07:53:21Z
updated_at: 2026-10-24T08:16:00Z
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

## Correction, 2026-10-24 (on the owner's question "then how were all the Tools declared?")

"No node kind exists" above was too broad. Two kinds already cover most of this:
- **`tool`** (`cat-harness/tools/<id>/<id>.ts`, `defineTool`, 178 of them): a CAPABILITY, with how to install and invoke it, its io, what it `satisfies`, and `requires` (runtimes, network). A Tool may wrap third-party software; `beans-cli` says so in its `limits`. A Tool is the job, not the package.
- **`tool-release`** (`cat-harness/tool-releases/*.json`, `folio-tool-release/v1`): an outside program at one version, with sha256, source URL, SPDX licence, platform and entry point. Today: graphviz, PlantUML, Temurin JRE. Roles are `tool | runtime`, and kinds are `jar | archive | binary | oci-image | toolchain-file`.

What is NOT covered is a library that code IMPORTS rather than RUNS, installed by a package manager: bpmn-moddle, dmn-moddle, katex, playwright. Those appear only in `package.json`, `THIRD-PARTY-NOTICES.md` and type shims.

The likely answer is therefore not a new kind but an extension of `tool-release`: role `library` and kind `npm-package` (or `pip-package`), with the type shim, where one exists, as a field. The proposal must weigh that against a separate kind.

_2026-10-24_ — CLAIMED by the library viewers thread (session https://claude.ai/code/session_01LM4btvYuBEuq57QqgwCrtu). The proposal is written (/mnt/project-files/library-nodes/jbvi-proposal.md) and the owner was asked to choose A (extend tool-release), B (new generated `library` kind, recommended) or C (hand-declare a few). Nothing is built.

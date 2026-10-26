---
# folio-assistant-jbvi
$schema: bean/1.0.0
title: 'LIBRARY NODES: outside libraries the platform uses become graph nodes'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-24T07:53:21Z
updated_at: 2026-10-26T14:22:00Z
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

_2026-10-24 08:25Z_ — OWNER CHOSE D ("Shared core"), after asking to merge A and B. One core schema (name, version, SPDX licence, digest, source) is shared by `tool-release` (rules unchanged: sha256 and entry still required) and a new `library` kind (core plus range, dev, used-by and type shim). Library nodes are generated from each layer's bun.lock by `libraries:derive` and gated by `libraries:check`; a library digest may be sha512. Proposal: /mnt/project-files/library-nodes/jbvi-proposal.md. Building in the library viewers thread.

_2026-10-24 12:35Z_ — BUILT AND MERGED. cat-harness#523 (3941401): shared core `schemas/outside-software.ts`, `tool-release` extends it unchanged, new kind `software-library` (tag `software-library/1.0.0`). cat-harness-tools#714 (51b9583): `libraries:derive` and `libraries:check`, 44 nodes under `cat-harness-tools/libraries/`. Remaining as follow-ups: re-pin folio-assistant and name `libraries:check` in `code-quality-gates.yml` (then drop the tools `OWN_SCRIPT_EXEMPTIONS` entry); generate `libraries/` in cat-harness, bootstrap-tools, fhir-harness, folio-assistant-sci, folio-assistant-core and who-iris (the last two need a bun.lock first).

_2026-10-26T14:22:00Z_ — Progress update: `litlfred/cat-harness#609` (`6c5ff04`, `software-library/1.1.0` vendored bundle schema), `litlfred/cat-harness-tools#773` (`e3bb65e`, `libraries:derive` / `libraries:check` vendored bundle support), and `litlfred/folio-assistant-sci#93` (`8d6daa5`, `folio-assistant-sci/libraries/` 17 nodes) merged on `main`.

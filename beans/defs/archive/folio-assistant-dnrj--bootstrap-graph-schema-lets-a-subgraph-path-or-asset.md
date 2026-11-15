---
# folio-assistant-dnrj
$schema: bean/1.0.0
title: 'bootstrap: graph.schema.json lets a Subgraph path or Asset src be absolute or climb with ..'
status: completed
type: bug
priority: normal
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T20:26:05Z
parent: folio-assistant-3o2w
---

**Category:** security (path containment). **Rule:** `scz-every-input-is-suspect`; skill `path-containment`. **Severity:** normal: a schema gap, closed today only in one consumer.

**Evidence** (bootstrap `3ce2b5d`): `schemas/graph.schema.json` describes `directories[].path` (line 41, also 273) as "relative to the declaration" and `assets[].src` (line 134, also 349) as "relative to the declaration", but both are only `{"type":"string","minLength":1}`. Nothing refuses `/etc`, `../..` or `a/../../b`. The Asset and Subgraph objects also have open `additionalProperties`.

cat-harness-tools' own zod parser refuses `..` on some locations (`schemas/kg/cat-harness.ts:505, 561, 595`), but the published JSON Schema is what other tools and a remote mount's declaration are validated against. A declaration is data from another repository, so the schema is the boundary.

**Fix:** add a `pattern` that refuses a leading `/`, a drive letter and any `..` segment to both fields (refuse, not normalise), and a test with those three cases.

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:21:00Z_ — Fixed in https://github.com/litlfred/bootstrap/pull/34 (`pattern: "^(?![/\\\\]|[A-Za-z]:)(?!.*(?:^|[/\\\\])\\.\\.(?:[/\\\\]|$)).+$"` added to `directories[].path`, `assets[].src`, `$defs.Subgraph.properties.path`, and `$defs.Asset.properties.src` in `schemas/graph.schema.json`; verified with Ajv against `/etc`, `C:/foo`, `c:\\bar`, `..`, `../..`, `a/../../b`).

_2026-10-31T20:26:05Z_ — All fix PRs merged (owner card choice A, 2026-10-31 20:22Z, thread "Drain workplan, issues and beans"); bean completed.

---
# folio-assistant-bkea
title: 'VALIDATOR: cat-openapi-config/v1 is a declared family with no resolvable validator — check:kind-validators red'
status: todo
type: bug
priority: normal
tags:
    - separation
    - validator
created_at: 2026-10-09T17:22:58Z
updated_at: 2026-10-09T17:22:58Z
---

`check:kind-validators` is red in the composed index checkout (folio-assistant#2518, 2026-10-09): `cat-openapi-config/v1` is a declared `$schema` family with **no resolvable validator**.

## What was measured

    openapi: 1 $schema famil(ies) over 1 node(s)
      ✓ folio-openapi-source/v1: 1/1 parse
      ✗ unmapped family cat-openapi-config/v1 (e.g. smart-trust/openapi/cat-openapi.config.json)
    ✗ a declared $schema family is unmapped, unresolvable, or has a node that fails it

- The node: `smart-trust/openapi/cat-openapi.config.json` (`"$schema": "cat-openapi-config/v1"`), in smart-trust's `smart-trust-openapi` directory, kind `openapi`.
- The typology declares the family: `cat-harness/openapi/typologies/openapi.json` → `nodeSchemas: { "folio-openapi-source/v1": {}, "cat-openapi-config/v1": {} }`.
- A Zod schema EXISTS for it: `OpenApiConfigSchema` in `cat-harness/openapi/schemas/openapi.ts` (tag constant `OPENAPI_CONFIG_SCHEMA_TAG`), exercised by `cat-harness/openapi/scripts/openapi.test.ts`.
- But `resolveNodeSchemas("openapi", …)` (used by `cat-harness-tools/scripts/check-kind-validators.ts`) returns only `folio-openapi-source/v1`, so the config family never joins to that schema. Whatever wires `folio-openapi-source/v1` to `OpenApiProvenanceSchema` (bean `riit`'s validator node) was never done for the config.
- It surfaced now because the separation mounts smart-trust in the index checkout; before, the check either did not reach this node or ran before the config file existed.

## Options

- (A, recommended) add the missing validator node/registration for `cat-openapi-config/v1` pointing at `OpenApiConfigSchema`, the same way `folio-openapi-source/v1` is wired (follow `riit`). The schema already exists, so this is wiring, not new shape.
- (B) drop the family from `openapi.json`'s `nodeSchemas` and stop tagging the config file — but then the config is an untyped node the kind claims, which is the defect this gate exists to catch.

## Done when
- [ ] `bun run cat check:kind-validators` reports `cat-openapi-config/v1: 1/1 parse` (no `unmapped family`) in the composed index checkout
- [ ] a test fails if the family is unmapped again (e.g. the openapi typology's every declared family resolves)
- [ ] the pin in folio-assistant `index.config.json` carries the fix

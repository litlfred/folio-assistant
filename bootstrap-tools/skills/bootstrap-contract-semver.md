---
name: bootstrap-contract-semver
description: >
  What MAJOR, MINOR and PATCH mean for bootstrap's PUBLISHED schemas and graph,
  and why the bump is computed from a diff of the generated documents rather
  than asserted. Read before changing any Zod that bootstrap's
  `schemas/*.schema.json` are generated from, and before publishing one.
---

# Bootstrap contract semver

**Owner, 2026-09-29 (bean `81tw`), choosing "bootstrap contract semver":** a
skill defining major/minor/patch for bootstrap's published schemas and graph,
with the bump **computed** by this instance's pipeline from a diff of the
generated schemas — in the spirit of the instance-versioning proposal
([#592](https://github.com/litlfred/folio-assistant/issues/592),
[`instance-versioning.md`](../../cat-harness/docs/proposals/instance-versioning.md)
§4.1): *"a version bump COMPUTED by diffing the exported graph rather than
asserted"*.

This is **not** the every-instance version the proposal designs, and the
release skills stay where they are. It is the narrower question a third party
following one of bootstrap's `$id`s actually has: **will a document that
validated yesterday fail today?**

## Why this needs its own rules

bootstrap's `schemas/*.schema.json` sit at `$id`s that are already published
and cited — from `discussion.bpmn`, from the generated skill docs and from
`.pot` catalogues in five languages. Their contract is **what validates**, and
that moves in only two directions: the set of accepted documents grows, or it
shrinks. The code-release table in `release-lifecycle` ("breaking change to a
schema type") names the category but not the direction, and the direction is
the whole question.

## The rules

| bump | the change | examples |
|---|---|---|
| **MAJOR** | something that validated at the base can now **fail** | a field removed from a closed object; a field made required; a type, enum or bound narrowed; a `pattern` or `format` added; **strictness tightened** (`additionalProperties: false` added); a conditional (`allOf` branch) added; a `$id` or `$schema` changed; a schema withdrawn |
| **MINOR** | only **widens** — everything that validated still does | an optional field added; a required field relaxed; a type, enum or bound widened; `additionalProperties: false` removed; a new schema published |
| **PATCH** | **what validates is unchanged** | `title`, `description`, `$comment`, `examples`, `default`; key order, indentation and other format-neutral changes |

Two consequences worth stating, because each reads wrong at first:

- **Adding a field can be MAJOR.** Adding it to `required` is; adding it as
  optional is MINOR. The field and its required-ness are graded separately.
- **Tightening strictness is MAJOR even though it "only" catches typos.** Bean
  `z634` adopted `additionalProperties: false` deliberately, on the measured
  ground that no producer existed yet. With a producer, the same change rejects
  a document that validated — which is the definition above, whatever the
  intent.

**A `$id` moving to the next release is not a change.** bootstrap mints each
`$id` from its declared iriBase and version (`…/bootstrap/<version>/…`), so
every release rewrites that segment while the previous release stays at its
own address. The classifier blanks the version segment before comparing; any
OTHER change to a `$id` repoints consumers and is MAJOR.

A keyword the classifier does not recognise is graded **MAJOR**. A change that
cannot be proved harmless is not called harmless.

## The bump is computed, never asserted

```sh
bun run bootstrap:semver                # against origin/main
bun run bootstrap:semver --base <ref>   # against any commit-ish
```

`bootstrap-tools/scripts/schema-semver.ts` diffs each generated
`bootstrap/schemas/*.schema.json` against the same file at the base and prints
the bump each one requires, with every graded change and its location. The
proposal's argument applies unchanged: **a commit message is a claim about a
change; a diff of the published document is the change.**

It has a **fourth answer, `could not determine`**, when the base cannot be read
— no such ref, no git, a file that will not parse. It exits non-zero and says
so. It never falls back to "patch": that would turn "I did not look" into
"nothing important changed", the one reading this exists to prevent.

The diff is over the **generated JSON Schema**, not the Zod. Zod is the
authoring tool and may be replaced (owner, 2026-09-24: *"different tools
can/will be used, but the core KG should be unchanged"*); the published
document is the contract, so it is what gets graded.

## Where it sits in the render pipeline

1. Change the Zod under `bootstrap-tools/schemas/` — the only place
   bootstrap's Zod lives since bean `xsqm` moved it down.
2. `bun run bootstrap:schemas` — regenerate. The `--check` twin is a gate.
3. `bun run bootstrap:validate` — parse bootstrap's own documents against the
   Zod, in the same CI step. A schema change that breaks a document bootstrap
   itself carries is caught here, before any consumer sees it.
4. `bun run bootstrap:semver` — read the required bump. **MAJOR needs the
   owner's say-so before merge**: it is a broken promise to whoever follows the
   `$id`, and the published `$id` does not change with it.
5. Publish — the site build copies the documents to their `$id`s.

## What this does not cover

- **The graph document.** `BootstrapGraphDocumentSchema` describes it, but
  that Zod is still in cat-harness, which bootstrap-tools may not import
  (`check:tools-closure`), and the graph is built at deploy time with no
  committed base to diff against. `bootstrap:validate` does not parse it and
  `bootstrap:semver` does not grade it; its bump is `could not determine` by
  construction. Do not report it as unchanged in the meantime.
- **Which version number gets written.** This computes the minimum bump; it
  does not write a version, and an author may always bump further.

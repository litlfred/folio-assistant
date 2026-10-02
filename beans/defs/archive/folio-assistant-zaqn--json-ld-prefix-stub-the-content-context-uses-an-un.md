---
# folio-assistant-zaqn
title: 'JSON-LD PREFIX = STUB: the content context uses an undeclared `folio:` prefix, so every content term expands to a meaningless IRI'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T07:22:19Z
updated_at: 2026-09-23T08:48:57Z
parent: folio-assistant-zzmr
---

## What is wrong

`CONTENT_CONTEXT` in `cat-harness/schemas/jsonld.ts` (served as `ns/content/v1.jsonld`) declares the prefix `fac` but writes 20 terms as `folio:…`. No `folio` prefix is declared, so a JSON-LD processor reads `folio` as a URI SCHEME: `"@type": "folio:Definition"` expands to the absolute IRI `folio:Definition`. Verified 2026-09-23 with `jsonld.expand`. 1,737 committed `.jsonld` files carry `folio:` terms.

That is the exact hazard the module header warns about ("a well-formed IRI that means nothing and joins with nothing").

## Why no gate caught it

- `gen:jsonld:check` compares generated output with its source, and both are wrong in the same way.
- kg-export's "every property declared" rule covers the KG context, not the content context.

## Decision (owner, 2026-09-23): prefix = stub

A namespace is `<canonical>/<stub>/ns#`, so its prefix is that same word:
`bs` → `bootstrap`, `cat` → `cat-harness`, `fac`/`folio` → `folio-assistant-core`. One word in three places instead of three words that must agree.

## Todo

- [x] NS_PREFIXES keyed by stub; content context and type tables use `folio-assistant-core:`
- [x] gate: every compact IRI in a published context / type table has a declared prefix, and every prefix equals its namespace's stub
- [x] regenerate the JSON-LD files (gen:jsonld)
- [x] document the rule in the skills (kg-export, vocabulary / directory conventions) and on the gate's Tool node
- [x] bun run gates green; PR opened (#1016)

## Progress 2026-09-23

- Gate added to `check-context-emission.ts` (`checkPrefixDeclaration`), 9 new tests. Falsified: restoring the old committed context gives rc=1 with `folio ×20` + `fac` misspelt; the fixed tree gives rc=0.
- `gen:jsonld` regenerated 1,657 files. 91 ORPHANED block files (no generator writes them) were rewritten in place — owner's choice over pruning; the orphan question is bean `xwi8`.
- Expanded a real smart-base block with the new context: 0 IRIs outside http(s).
- NOT renamed: the CSVW tabular `fac:` keys. CSVW local contexts allow only `@language`/`@base`, so no prefix can be bound there — bean `792y`.
- Skills: `kg-export` §"A prefix is the stub"; `directory-conventions` §"Why Zod" (owner's grounds, house rule labelled); `tabular-metadata`, `swimlane-glossary`, `graph-detanglement` spellings. Tool node: `context-prefixes`.
- GitHub issue #1015.

## Done when

A sample block expands to `https://litlfred.github.io/folio-assistant/folio-assistant-core/ns#Definition`, and a context that uses an undeclared prefix fails a gate.

## Summary of Changes

Merged in #1016 (`12a61867`) on the owner's "merge it", 2026-09-23.

- **Prefix = stub.** `NS_PREFIXES` is keyed by instance stub (`bootstrap`, `cat-harness`, `folio-assistant-core`); `stubOfNamespace()` reads it back. The content context and every JSON-LD emitter write `folio-assistant-core:`; the unbound `folio:` is gone.
- **The missing gate direction.** `check:context-emission` gained `checkPrefixDeclaration`: a prefix SPOKEN as a key or `@type` must be bound; a binding onto our own `…/<stub>/ns#` must be spelt `<stub>` and name a declared instance; an unresolvable context is "could not determine". Falsified both ways; 9 tests.
- **Regenerated.** `gen:jsonld` plus 91 orphaned block files rewritten in place (owner's choice over pruning). A real block expands with 0 IRIs outside http(s).
- **Documented.** Skills: `kg-export` §"A prefix is the stub"; `directory-conventions` §"Why Zod" (the owner's three functional grounds, and the `.ts`-hallucination observation labelled an unscientific house rule). Tool node `context-prefixes`.
- **Process slip, recorded.** The first two commits were pushed while local gates were still running; CI caught four failures the local run also found (bean parents, the new Tool's sidecar, tools viewer). Fixed in `440cc48e`.
- **Issue #1015 was auto-closed** by "Closes #1015" in the PR body — the agent's wording, not the owner's sign-off. Reported on the issue for the owner to reopen if wanted.

Follow-ups: `792y` (CSVW keys need absolute IRIs), `xwi8` (orphaned blocks: keep or prune).

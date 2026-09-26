---
# folio-assistant-lvw0
title: 'PUBLISHING BLOCKED: the locale .jsonld exports re-publish the QA findings the core strips, and add an undeclared sourceLanguage'
status: in-progress
type: bug
priority: critical
created_at: 2026-09-26T13:57:48Z
updated_at: 2026-09-26T14:00:18Z
parent: folio-assistant-bzyu
---

## What is blocked

`publish:verify` fails on the built site, so `deploy to gh-pages` is **skipped**
and nothing is published. The live site is a previous publish. Tracking issue
opened automatically by `processes/publish-alert.bpmn`:
[#1406](https://github.com/litlfred/folio-assistant/issues/1406), on main's own
publish of `430052ad`.

```
jsonld-expand: 20 finding(s) — 156 document(s) checked
  cat-harness.{ar,es,fr,ru}.jsonld: invalid property (danglingLinks)
  cat-harness.{ar,es,fr,ru}.jsonld: invalid property (problems)
  cat-harness.{ar,es,fr,ru}.jsonld: invalid property (sourceLanguage)
  cat-harness.{ar,es,fr,ru}.jsonld: invalid property (undeclaredSchemaModules)
  cat-harness.{ar,es,fr,ru}.jsonld: invalid property (undeclaredTerms)
```

5 properties × 4 locales = 20. `cat-harness.jsonld` — the English core — is
**not** among them, and that asymmetry is the whole diagnosis.

## Root cause — two defects, read off the source

**1. The locale exporter publishes the UNSTRIPPED export.**

`publishedDocument()` (`cat-harness/scripts/kg-export.ts:635`) exists to remove
`undeclaredTerms`, `undeclaredSchemaModules`, `danglingLinks` and `problems`
before publishing — they are a QA reviewer's findings, relocated to
`test/results/` by the owner's 2026-09-19 rule, and their `@context` terms were
removed *with* them, deliberately (`kg-export.ts:564-574`).

It has exactly one production call site:

```
kg-export.ts:2538   const published = { ...publishedDocument(data), ...stagingFields() };
```

`kg-locale-export.ts:387` does not use it:

```ts
const core = (await buildExport({ baseUrl: opts.baseUrl, instanceRoot: opts.instanceRoot })) as ...
```

so every locale document is translated from the raw `Export` and re-publishes
the four fields whose terms were removed. That accounts for 16 of the 20.

**2. `sourceLanguage` is written and never declared.**

`kg-locale-export.ts:314` adds it to the root:

```ts
(doc as { sourceLanguage?: string }).sourceLanguage = sourceLocale;
```

`sourceLanguage` does not occur anywhere in `kg-export.ts`, so `buildContext()`
does not declare it. That is the remaining 4.

It is real data the locale document must carry — the language its untagged
strings are in — so the fix is a context term, not a strip.

## Why `undeclaredRootTerms` did not catch it

That guard is fatal, and it runs in `kg-export.ts` against the assembled
**core** document. The locale documents are assembled in a different file and
never pass through it. The check exists and the path around it does not call
it — same shape as the `staging` field in #340 that its own docblock records.

## Done when

- [ ] `kg-locale-export.ts` translates `publishedDocument(core)`, not `core`
- [ ] `sourceLanguage` is declared in `buildContext()`, beside `generatedAt`
      and the `sourceCommit*` fields
- [ ] `undeclaredRootTerms` runs against each locale document too, fatally —
      otherwise the next root field added there reopens this
- [ ] falsified by breaking: reverting either fix must make `publish:verify`
      red again, and removing the guard must let a planted root field through
- [ ] a clean publish of main closes #1406

## Provenance

Diagnosed 2026-09-26 from source and from #1406's own output. Not reproduced by
building the site locally — the two call sites and the absent declaration are
read directly, and the 5 × 4 arithmetic matches the reported findings exactly,
but a local `publish:verify` on a built `_site` is the confirmation this bean
has not spent.

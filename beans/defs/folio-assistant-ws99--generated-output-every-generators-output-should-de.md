---
# folio-assistant-ws99
title: 'GENERATED OUTPUT: every generator''s output should declare its writer — five write into docs/ and none did'
status: in-progress
type: task
created_at: 2026-09-24T06:27:05Z
updated_at: 2026-09-29T00:00:00Z
parent: folio-assistant-vke6
---

Issue #1254. Found while building check:reference-direction (#1219, bean zhg2): gen-skill-docs, gen-schema-docs and gen-uml-overview wrote 769 occurrences of undeclared generated output into docs/, 54% of that check's original findings. docs/ is a content graph and correctly so, so the directory cannot answer for a generator's output inside it — the file must. Markers added in PR #1222 for the three; this is the gate that closes the class.

## Summary of Changes

PR against #1254, branch `claude/ws99-generators-declare`. The class the bean
names is FIVE generators writing into `docs/`; PR #1222 closed three
(`gen-skill-docs`, `gen-schema-docs`, `gen-uml-overview`) and this closes the
remaining two, plus the two JSON families one of them also owns.

**Two generators now declare, in their own output:**

- `folio-assistant-core/scripts/glossary-page.ts` — the writer, named once as
  `GENERATED_BY` and emitted in three forms because three readers ask three
  ways: the HTML comment a person sees (unchanged), a `generated:`
  front-matter key on both page templates, and a top-level `_generated` in the
  JSON it writes. 6 glossary pages, 20 `*.skos.jsonld`, 18 extracted
  `*.glossary.json` — 44 files.
- `cat-harness/scripts/gen-docs-pages.ts` — a `generated:` front-matter key on
  every page it writes (20). It had carried the HTML banner since `06e3` and
  nothing else, so its output graded as authored prose too.

**The registry route was rejected.** `folio-glossary/v1` could have been
declared `generated: true` in the graph-kind registry, which would have
exempted these files without touching a generator. It also covers AUTHORED
glossary terms (`folio-assistant-core/glossary/*.glossary.json`), so the flag
would have exempted content a person wrote — the `qa-checkers-dak.ts` failure
mode. Per-file declaration only.

**One checker change, on the file's own stated principle.**
`declaresGenerated` in `check-reference-direction.ts` matched `_generated` as
the FIRST key of a JSON file, which made position part of the contract:
`$schema` and `@context` each have a reader that looks for them at the head, so
a file could not declare itself without moving the key that says what it IS.
It now PARSES `.json`/`.jsonld` and reads the top level in any position — what
the same file's `isGeneratorWritten` already does, for the reason its docblock
gives. Markdown keeps the head-only front-matter route unchanged. Pinned by 11
tests in `cat-harness/schemas/reference-direction-declaration.test.ts`,
including the two that must stay FALSE: `_generated` nested deeper in a
document, and a Markdown page that merely discusses generation.

**Measured, `bun run check:reference-direction`, before → after:**

| | before | after |
|---|---|---|
| wrong-direction | 790 in 211 files | 688 in 189 files |
| files skipped by their own declaration | 476 | 536 (+60) |
| multi-destination not in PENDING | 31 | 20 |

Two `PENDING` entries had to be DELETED, and that is the first time the list's
set comparison has fired for a good reason: `cat-harness/docs/ig-publisher.md`
and `cat-harness/docs/publication-workflow.md` were held there as prose with no
single destination. They are not prose — `gen-docs-pages.ts` writes both, and
once it says so they are not read at all. Neither file was edited to earn that;
the generator was.

**NOT done, and why — the 5 translated `docs/<locale>/publication-workflow.md`.**
The brief expected these to fall too, which would have put the last number at
15. They did not, and the reason is a finding rather than an omission: **no
program writes them.** `gen-docs-pages.ts` writes `join(OUT_DIR,
"<slug>.md")` and never a locale directory; `po-inject.ts` SKIPS front matter
and is a library, not a CLI; the `translation_inject` MCP tool writes to
`translations/<locale>/<file>.md`, not `docs/<locale>/`. The 30 committed
translated pages under `docs/{ar,es,fr,ru,zh}/` were landed by hand (bean
`t8g3`, #206) with hand-written `lang` / `translation_status` /
`translation_source` front matter, and each carries a copy of the English
page's banner claiming `gen-docs-pages.ts` writes it and "the next run
overwrites it" — which is false for the copy. Adding `generated:` to them by
hand would have been an unverifiable claim that exempts a file from a check,
which is the defect this bean exists to close, pointed the other way. Left for
a ruling; the false banner is worth a bean of its own.

Bean stays `in-progress`: the five-generator class is closed, the translated
copies are not.

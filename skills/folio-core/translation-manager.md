---
name: translation-manager
description: >-
  Translation lifecycle management for folio content. Covers gettext PO/POT
  extraction and injection, TranslationNode manifests as KG nodes,
  official vs unofficial translations, staleness tracking, sign-off workflow,
  automatic badge rendering, and the poSources fallback resolution chain.
capability: translation
package: folio-core
---

# Translation manager

> Skill id: `translation-manager` · Capability: `translation` · Package:
> `folio-core`

Manage the translation lifecycle for folio content. This skill covers the full
round trip from source content to translated content, including extraction,
translation, injection, quality assurance, sign-off, and automatic badge
rendering.

## Reference

The authoritative documentation is
[`docs/translation-support.md`](../../docs/translation-support.md). Read it
before using this skill. This file is the operational checklist, not the
architecture.

## The two-axis model

A content node varies along two axes:

1. **Format** — `.md` (Markdown), `.lean` (Lean 4), `.tex` (LaTeX), `.bpmn`,
   `.dmn`, etc.
2. **Language** — BCP 47 locale tags (`en`, `fr`, `es`, `ar`, `zh`, `ru`).

The format axis is handled by companions. The language axis is handled by the
PO/POT pipeline with `TranslationNode` manifests in `translations/<locale>/`.

## TranslationNode — .po/.pot files as KG nodes

Each `.po`/`.pot` pair is wrapped by a `.ts` manifest that makes it a
**first-class node in the knowledge graph**:

```typescript
import type { TranslationNode } from "../../schemas/translation";

const node: TranslationNode = {
  label: "trans:fr/index",
  locale: "fr",
  sourceFile: "docs/index.md",
  potFile: "translations/fr/index.pot",
  poFile: "translations/fr/index.po",
  status: { locale: "fr", official: false, generatedBy: "agent" },
  coverage: { translated: 37, total: 37, pct: 100 },
};
export default node;
```

The manifest carries the status, coverage, and QA results inline — no
separate `status.json` or `.qa.json` files.

## PO source resolution (fallback behavior)

Content blocks can declare explicit PO sources via `poSources[]` on
`BlockBase`. When not declared, the pipeline resolves by convention:

1. **Block-level:** `translations/<locale>/<block-stem>.po`
2. **Chapter-level:** `translations/<locale>/<chapter-slug>.po`
3. **Folio-level:** `translations/<locale>/global.po`
4. **Dependency walk:** walk `harness.config.json` dependencies depth-first

When `poSources` is declared, only the listed files are consulted (no
fallback). Later entries override earlier for the same msgid.

## What is translatable

| Content | Translatable? | Notes |
|---|---|---|
| Block titles | ✅ | From `.ts` manifests |
| Prose bodies (`.md`) | ✅ | Segmented by paragraph |
| Chapter/section titles | ✅ | From `chapter.ts` / `section.ts` |
| Kind headings | ✅ | "Definition", "Theorem", etc. → locale catalogue |
| LaTeX math | ❌ | Universal notation |
| Block labels | ❌ | Structural identifiers |
| Code blocks | ❌ | Programming language content |
| Lean companions | ❌ | Formal mathematics |
| FHIR resources | ⚠️ | Use FHIR's own `designation` system, not gettext |

## Workflow

### 1. Extract (POT generation)

```sh
bun run content/pipeline/pot-extract.ts [--chapter <dir>] [--block <label>]
```

Or use the `translation_extract` MCP tool. Produces `.pot` files at the
configured granularity.

### 2. Translate

Options, in order of preference:

1. **Existing `.po` from smart-base** — if the DAK already has translations
   from Weblate/Crowdin, use them.
2. **FHIR/translation-utils** — the `po-translate` CLI for batch machine
   translation via DeepL/Google Translate. Tags results `# fuzzy`.
3. **Agent translation** — LLM translation of `.pot` → `.po`. Also tagged
   unofficial.
4. **Human translation** — the gold standard.

### 3. Inject (PO → translated Markdown)

```sh
bun run content/pipeline/po-inject.ts --locale <locale> [--chapter <dir>]
```

Or use the `translation_inject` MCP tool. Reads `.po` files and produces
translated `.md` in `docs/<locale>/` for docs pages, or in the content
directory for content blocks.

### 4. Create TranslationNode manifest

After injection, create or update the `.ts` manifest:

```sh
# The pipeline does this automatically, or create manually:
translations/<locale>/<stem>.ts
```

The manifest carries status, coverage, and round-trip QA results inline.
Validate with `TranslationNodeSchema` from `schemas/translation.ts`.

### 5. Round-trip QA

After injection, run round-trip translation QA:

```sh
bun run content/pipeline/translation-qa.ts --locale <locale>
```

Or use the `translation_validate` MCP tool for coverage and staleness.
**Semantic verification is per block and lives in the sidecar**, not in a
node-level summary field: `TranslationNode.roundTripQA` was removed with the
numbers it held. See §"Per-block translation QA" below, and route drift to a
human reviewer.

### 6. Sign-off

A human reviewer signs off at the desired level:

```sh
bun run content/pipeline/translation-signoff.ts --locale <locale> --level <block|section|chapter|folio> [--path <content-path>]
```

Or use the `translation_signoff` MCP tool. Updates the `TranslationNode`
manifest with sign-off metadata and source hash.

### 7. Staleness watch

On every content change, the pipeline checks whether any official translation's
`sourceHash` no longer matches the source `.md`. Stale translations are flagged
in the viewer and in `translation_status` output.

## Per-block translation QA, and the agentic round trip

Two sweeps, two subjects, and confusing them is how a site reports a
translation nobody measured.

- **`translation-qa-sweep.ts`** measures the docs **site**: how much of each
  page exists in each language. It writes `docs/_data/translation-qa.json` and
  feeds the badge under a page title.
- **`translation-block-qa.ts`** measures a **block**, one sidecar per
  `(block, locale)`: `<stem>.<locale>.translation-qa.json`, in the
  `block-qa/v1` entry shape, which is what the per-block `TR` icon opens.

```sh
bun run translation:block-qa          # write the sidecars
bun run translation:block-qa:check    # fail if any is stale
```

### What a script may claim, and what it may not

Three criteria are deterministic and carry a `script` witness:
`translation-coverage`, `translation-terms-preserved` (acronyms, numbers and
URLs that must survive translation and did not — the class a fluent
mistranslation passes) and `translation-not-echo` (a "translation" identical to
its source; a *warn*, because that is right for a proper noun and wrong for a
sentence).

`translation-semantic-roundtrip` is written **with no entry**. A round trip
asks whether the MEANING survived, and that needs a translator that has not
seen the original. The only back-translation available to a script here is the
PO's own `msgid→msgstr` map read backwards, which returns the source exactly,
always: a perfect similarity score measuring the lookup table. **Do not fill
this criterion mechanically.** A green tick nobody should trust is worse than a
gap that says it is a gap — a reader who sees the tick stops asking.

> This was not hypothetical. `translations/fr/index.ts` carried
> `roundTripQA: { fail: 21, total: 36, method: "jaccard-word-overlap" }`, and
> its own `description` explained those failures away as expected "with limited
> vocabulary back-translator" — a measurement whose author has to explain it
> away is about the instrument, not the translation. The generator's
> back-translation map held **6 entries for 36 strings**: every string nobody
> had back-translated scored 0 similarity and was counted as drift, so `fail:
> 21` was a count of absences. A second script back-translated by applying a
> 40-pair word-substitution table to the French and wrote the result as a
> `block-qa/v1` sidecar with an **agent** reviewer.
>
> All of it is removed — the numbers, the `roundTripQA` field, the page badge
> that displayed them, and both scripts.

### The agentic round trip — a PAIR of agents, and the separation is the measurement

| agent | is given | produces |
|---|---|---|
| **back-translator** | the target-language text, and nothing else | an independent rendering back into the source language |
| **adjudicator** | the original and the back-translation, never the target text | `pass` / `warn` / `fail`, with each drift named |

Three rules make it a measurement rather than a ritual:

1. **Neither agent sees what would let it shortcut.** A back-translator shown
   the English writes the English back and the check passes vacuously. An
   adjudicator shown the French can talk itself into any reading of the
   back-translation.
2. **The back-translator must use no tools, and must say so.** The source is in
   the repository; an agent with filesystem access can find it, and then the
   verdict measures its search. Ask for a `TOOLS_USED` line and record the
   answer.
3. **One agent doing both halves is not this check.** It compares a text with
   its own paraphrase of itself.

Tell the adjudicator explicitly what is *not* drift — synonyms, articles,
re-ordering — and what is: a claim added, dropped, weakened, strengthened or
reversed; a term of art swapped for something that means a different thing; a
named entity or a quantifier moved. Without that, a round trip degenerates into
a style review, and every translation "fails".

Record the result with:

```sh
bun run content/pipeline/translation-roundtrip.ts --payload <file.json>
```

It writes **both** agents as witnesses. The adjudicator's entry carries the
verdict and leads the criterion (the first entry is the operative one
everywhere in this repo); the back-translator's sits behind it with
`result: "n/a"` and the back-translation itself in `notes`, because a reader
asking "on what basis?" needs the intermediate text and a reader asking "who
did this?" needs both names. `agent_model` is optional — absent renders as
"not recorded" in the panel rather than as a blank.

### Two traps this process has already sprung

**A script sweep must not clobber an agent's verdict.** `translation-block-qa`
writes `translation-semantic-roundtrip: []` on every run. Before
`mergeCriteria`, the next unrelated re-run deleted the round trip a pair of
agents had produced, silently and with nothing in the output to say so. The
rule: **a sweep replaces only entries whose reviewer is itself**, and carries
everything else through.

**The verdict is hashed to the text it was about.** The entries hash the `.md`,
the `.ts` and the `.po`, so editing the source stales every locale's round trip
and editing a translation stales that locale's. This matters more for an agent
ruling than a script one: nobody can cheaply re-run it, so an agent verdict is
exactly the kind that quietly outlives its subject.

## Automatic badge rendering

Translation badges are **automatically rendered** on every docs page by
`docs-ui.js`. There is no need to manually add badge includes or front matter.

### How it works

1. **`head_custom.html`** publishes a `<script type="application/json"
   id="fa-translation-meta">` block on every page, reading from page front
   matter
2. **`docs-ui.js`** reads that block and auto-injects into the page title:
   - **🌐 Language coverage badge** — `0/5 languages` (grey), `1/5` (amber),
     `5/5` (green)
   - **⚠️ Unverified warning** — auto-injected when `translation_status:
     unverified`

### Front matter for the translation pipeline to stamp

The translation pipeline stamps this front matter on generated pages:

```yaml
# Source pages (English):
lang: en
available_locales: ["fr"]          # locales with translations

# Translated pages:
lang: fr
translation_status: unverified     # or "official"
translation_source: index.md       # source file
available_locales: ["fr"]
```

The `qa_translation_*` keys are **gone**, along with the badge that read them.
They were stamped from a node-level round trip whose back-translation map held
6 entries for 36 strings, so every string nobody had back-translated was
published as semantic drift. Per-block QA replaces them: the `TR` icon beside
each block opens `<stem>.<locale>.translation-qa.json`, where a verdict names
the witness that reached it.

**Do not** manually add `{% include translation-warning.html %}` to pages —
`docs-ui.js` handles it automatically. (`qa-translation-badge.html` is deleted,
not deprecated: it rendered the removed numbers.)

## Official vs unofficial

| Attribute | Official | Unofficial |
|---|---|---|
| Human sign-off | ✅ Required | ❌ Not required |
| Viewer badge | ✅ Green | 🔄 Grey/amber |
| Source hash tracking | ✅ Yes | ❌ No |
| Staleness detection | ✅ Yes | N/A |
| Can be shown in viewer | Always | Configurable (`officialRequired` in config) |

## Six UN languages

The default `supportedLocales` in `harness.config.json`:

| Code | Language | Native |
|---|---|---|
| `ar` | Arabic | العربية |
| `zh` | Chinese | 中文 |
| `en` | English | English |
| `fr` | French | Français |
| `ru` | Russian | Русский |
| `es` | Spanish | Español |

Folios may add or remove locales. The viewer reads the list from config.

## translations/ directory rules

The `translations/` directory contains **only** three file types:

1. `.pot` — POT templates (extractable strings)
2. `.po` — PO translated strings
3. `.ts` — TranslationNode manifests (KG nodes)

**Do not** put `.md`, `.qa.json`, or `status.json` files in `translations/`.
Rendered output lives in `docs/<locale>/`; QA and status are properties of
the TranslationNode manifest.

## WHO smart-base integration

The WHO `smart-base` repository defines the formal actor
`SGAuthoring.Persona.Translator` with skill requirements
`SGAuthoring.Skills.TranslateContent` and
`SGAuthoring.Skills.ReviewTranslations`.

Follow the principle in
[`smart-base-tools.md`](../authoring-who-smart-guidelines/smart-base-tools.md):
**load it; never vendor it.** The translation subsystem is invoked from the
smart-base checkout, not copied.

## IG Publisher i18n

For FHIR IG folios, the IG Publisher's own i18n system is used in parallel:

- `i18n-default-lang` in `sushi-config.yaml` — source language.
- `i18n-lang` — target languages.
- `translation-sources` — path to `input/translations/{lang}/` containing
  per-resource `.po` files.
- Run with `-generation-off -validation-off` flags for fast translation-only
  builds.

The prose translation pipeline (this skill) and the FHIR resource translation
pipeline (IG Publisher) are complementary and independent.

## Do not

- **Do not manually add badge includes.** `docs-ui.js` renders them automatically
  from front matter; the `{% include translation-warning.html %}` call is
  deprecated.
- **Do not publish a semantic-QA number a script cannot establish.** A
  back-translation from this repo's own PO map, or from a word-substitution
  table, scores the table rather than the translation — and a string with no
  back-translation at all scores 0 and reads as drift. If no independent
  back-translator has run, the criterion has no verdict, and saying so is the
  honest output.
- **Do not put non-PO files in translations/.** Only `.pot`, `.po`, and `.ts`
  manifests belong there. Rendered `.md` goes in `docs/<locale>/`.
- **Do not vendor smart-base translation scripts.** Load from checkout.
- **Do not translate math, labels, or code.** Exclude in extraction.
- **Do not auto-sign-off.** Official status requires a human.
- **Do not treat staleness as "wrong".** A stale translation is still useful;
  it just needs re-review.
- **Do not conflate FHIR resource translation with prose translation.** They
  are different pipelines with different tooling.
- **Do not auto-remove staging previews.** Require `staging:cleanup` label.

## Content-type-specific translation tools

Each content type declares what formats it can translate and what scripts
handle each format. See `schemas/translation-tools.ts` for the full
registry.

| Content type | Formats | RTL |
|---|---|---|
| **document** | Markdown | ✅ |
| **paper** | Markdown + LaTeX | — |
| **dak** (WHO L2) | Markdown + PlantUML + SVG + ArchiMate + Excel + BPMN | ✅ |
| **ig** (WHO L3) | Markdown + FSH + FHIR JSON | ✅ |

The generic pipeline (`pot-extract.ts`, `po-inject.ts`) handles Markdown.
Adapter-specific tools extend it with format-specific extractors. The
Python originals from smart-base live in `scripts/translation/` and are
referenced in the registry.

### RTL support

Arabic (and Hebrew, Farsi, Urdu) pages are detected at load time by
`docs-ui.js` and get `dir="rtl"` on `<html>`. The CSS in `docs-ui.css`
provides smooth 0.4s transitions for sidebar and content layout:

- Sidebar slides to the right side
- Content flows RTL
- Mermaid diagrams and badges stay LTR
- BPMN diagrams need re-rendering with translated labels

### Staging review

When presenting translated content for review, use the `staging-review`
skill to provide before/after URL comparison tables. See
`schemas/staging.ts` for the `StagingComparison` schema.


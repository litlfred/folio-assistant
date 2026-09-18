---
layout: default
title: Translation manager
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/translation-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/translation-manager.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/translation-manager.md){: .fa-edit-source }

{% raw %}
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
  roundTripQA: { pass: 11, warn: 4, fail: 21, total: 36 },
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
4. **Dependency walk:** walk `folio.config.json` dependencies depth-first

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

Or use the `translation_validate` MCP tool. Back-translates and compares
meaning. Results are stored in the `TranslationNode.roundTripQA` field.
Routes drift to a human reviewer.

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
   - **QA badge** — only on translated pages with `qa_translation_total > 0`
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
qa_translation_pass: 11            # round-trip QA results
qa_translation_warn: 4
qa_translation_fail: 21
qa_translation_total: 36
qa_coverage_pct: 100
```

**Do not** manually add `{% include qa-translation-badge.html %}` or
`{% include translation-warning.html %}` to pages. These are now deprecated
includes — `docs-ui.js` handles everything automatically.

## Official vs unofficial

| Attribute | Official | Unofficial |
|---|---|---|
| Human sign-off | ✅ Required | ❌ Not required |
| Viewer badge | ✅ Green | 🔄 Grey/amber |
| Source hash tracking | ✅ Yes | ❌ No |
| Staleness detection | ✅ Yes | N/A |
| Can be shown in viewer | Always | Configurable (`officialRequired` in config) |

## Six UN languages

The default `supportedLocales` in `folio.config.json`:

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
  from front matter. The `{% include qa-translation-badge.html %}` and
  `{% include translation-warning.html %}` calls are deprecated.
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
{% endraw %}

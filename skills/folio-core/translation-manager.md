---
name: translation-manager
description: >-
  Translation lifecycle management for folio content. Covers gettext PO/POT
  extraction and injection, official vs unofficial translations, staleness
  tracking, sign-off workflow, and integration with WHO smart-base's
  translation subsystem and FHIR IG Publisher's i18n support.
capability: translation
package: folio-core
---

# Translation manager

> Skill id: `translation-manager` · Capability: `translation` · Package:
> `folio-core`

Manage the translation lifecycle for folio content. This skill covers the full
round trip from source content to translated content, including extraction,
translation, injection, quality assurance, and sign-off.

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
`translations/<locale>/` subdirectory convention.

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
translated `.md` in `translations/<locale>/`.

### 4. Round-trip QA (bean `ktt2`)

After injection, run round-trip translation QA:

```sh
bun run content/pipeline/translation-qa.ts --locale <locale>
```

Or use the `translation_validate` MCP tool. Back-translates and compares
meaning. Routes drift to a human reviewer.

### 5. Sign-off

A human reviewer signs off at the desired level:

```sh
bun run content/pipeline/translation-signoff.ts --locale <locale> --level <block|section|chapter|folio> [--path <content-path>]
```

Or use the `translation_signoff` MCP tool. Updates `status.json` with the
sign-off metadata and source hash.

### 6. Staleness watch

On every content change, the pipeline checks whether any official translation's
`sourceHash` no longer matches the source `.md`. Stale translations are flagged
in the viewer and in `translation_status` output.

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

- **Do not vendor smart-base translation scripts.** Load from checkout.
- **Do not translate math, labels, or code.** Exclude in extraction.
- **Do not auto-sign-off.** Official status requires a human.
- **Do not treat staleness as "wrong".** A stale translation is still useful;
  it just needs re-review.
- **Do not conflate FHIR resource translation with prose translation.** They
  are different pipelines with different tooling.

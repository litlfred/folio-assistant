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
4. **Dependency walk:** walk `<name>.config.json` dependencies depth-first

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

## The exported GRAPH per locale

The pipeline used to end at the rendered page: a `.po` was injected into a
diagram and an SVG rendered per locale, while the graph a machine consumes was
produced once, in the source language. `bun run kg:locale` closes that
(`kg:locale:bootstrap` for the nested instance, `kg:locale:check` in the gate
set). Bean `jmpb`.

Four rules, and the first is the owner's and is the one an implementation
breaks by default.

**1. The core graph must not reference its translations.** No
`hasTranslation`, no `availableLocales`, no `translationOf`, no per-locale
`@id`, no locale key in the `@context`. The obvious implementation hangs a
pointer off each node; that grows the core by an edge per locale per node and
makes bootstrap's graph reference artefacts it does not own and cannot
validate. The arrow runs **one way** — a per-locale document references the
core, never the reverse — and the core is complete with no translation
existing. The same relation
[`board-diagram-interchange`](board-diagram-interchange.md) states for a board
and its folio. `localeDocumentsUnreferenced` checks it rather than trusting it.

**2. A translated node keeps its `@id`.** A translation is not a new term.
Locale-suffixed IRIs are ruled out by that, not chosen against.

**3. The language tag rides the VALUE, never the document.** A blanket
`"@language": "fr"` would assert French over every string that fell through —
and fall-through is the normal case, because `parsePo` takes only non-empty
`msgstr` and skips fuzzy entries. A translated value is
`{"@value": …, "@language": …}`; a fall-through stays a plain string under the
document's declared `sourceLanguage`. Fall-through is then visible *in the
data* rather than inferable from a coverage number.

**4. A catalogue is scoped to the asset it was extracted from.** This one was
learned the expensive way. The first implementation merged every `.po` under a
locale and reported *"1 applicable msgid, 40 substitutions"* in three
locales — the msgid was **`"yes"` → `"oui"`, from `index.po`, a docs page**,
matching 40 BPMN gateway branch labels. `oui` is the right French for that
label, which is exactly why it had to be caught by provenance rather than by
reading the output: the result looked right while the report claimed diagram
translation was under way in three locales and **no diagram catalogue existed
in any of them**.

So a `.po` is read only when its stem names an asset the graph projects. A
residual is accepted and named: a msgid from diagram A applies to an identical
string on a node from diagram B — not a new assumption, since `kg-export`
already dedupes lane-derived `Role` nodes by lane name across every diagram.

**What the gate is not.** `kg:locale:check` says nothing about how much is
translated. Measured 2026-09-22: 58 of this instance's 62 `.pot` templates are
diagrams and **none has a `.po` in any locale**, so the exporter writes nothing
and reports every locale saying so. A locale with nothing to say is
**reported**, never a missing file a reader cannot tell from a broken build;
`--all-locales` emits a source-language copy per locale for the other reading.

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
did this?" needs both names.

**Record `model` with `modelSource`, or not at all.** A subagent's serving
model is not directly observable from the session that dispatched it: it
inherits the parent unless the harness overrides, and the hand-back does not
say which model served the turn. A bare model string on an agent witness is
therefore an inference printed as a fact — the same move as the round-trip
numbers this skill tells you not to write. `modelSource` states how the
identifier was established (for example: read from `get_session` at record
time, subagent inheritance assumed, not independently observed), and the panel
renders it beside the model. Absent both, the panel prints "not recorded",
which is a true statement and an acceptable one.

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
available_locales: ["en", "fr"]    # every locale the page can be read in

# Translated pages:
lang: fr
translation_status: unverified     # or "official"
translation_source: index.md       # source file
available_locales: ["en", "fr"]
```

### The terminology glossary — `translations/<locale>/glossary.po`

`translation-terms-preserved` can see that a source term is absent from a
translation. It cannot see whether that is a correct localisation or a silent
loss: `WHO` missing from a French sentence is either `OMS` or a dropped term,
and guessing either way is worse than saying so. The glossary is how a folio
tells it which.

| entry | meaning | when the term is absent |
|---|---|---|
| `msgstr "OMS"` | the expected form, pinned | **fail** — the glossary said what it should be |
| `msgstr "FHIR"` (identity) | must survive verbatim | **fail** |
| `#, localised` | rendered in the target language, form NOT pinned | **pass** |
| no entry | unknown | **warn** |

**`#, localised` exists so a glossary needs no translated content.** Pinning a
form means authoring target-language material; the flag says the one thing the
checker needs — *this term gets localised, I am not pinning how* — and it is
reviewable by someone who reads only English. Pin a form when you want the
stricter check.

**It is a reading rule and cannot become a mute button**, which is the property
to preserve if you touch it. `localised` only converts a would-be finding about
that term into a pass: it never reaches `strict` tokens (a URL or a number
consults no glossary — nothing localises a `3`), it cannot act on a term it does
not name, an entry with neither a form nor the flag is *unfinished* rather than
permission, and each locale's file is read alone, so marking a term in French
says nothing about Arabic. Every one of those is a test in
`translation-block-qa.test.ts`.

The file is hand-authored and has no POT — `schemas/translation.ts` declares
that slot, and `TranslationNode.potFile` is optional for exactly this. Bean
`he0e`.

**`available_locales` includes the SOURCE language, and that is not a
formality.** It is the list a reader's language bar and coverage badge are
computed from — "which languages can I read this page in" — and the page is
certainly readable in the one it was written in. It is *not* the list of
translations that exist, which is what `availableLocales()` in
`content/pipeline/po-resolve.ts` returns by resolving
`translations/<locale>/<stem>.po`; that lookup can never name the source
language, because there is no `translations/en/` and there never will be. Use
`localesAvailableFor()` in `content/pipeline/translation-index.ts` to go from
one to the other.

Both halves of the corpus must stamp the same meaning. They did not until issue
#687: the generator stamped the PO-derived list while the hand-authored
translated pages stamped the full set, so `docs/fr/index.md` rendered a badge
reading `6/5 languages` — a numerator larger than its denominator, which is the
shape a disagreement about what a field means takes when it finally surfaces.

The `qa_translation_*` keys are **gone**, along with the badge that read them.
They were stamped from a node-level round trip whose back-translation map held
6 entries for 36 strings, so every string nobody had back-translated was
published as semantic drift. Per-block QA replaces them: the `TR` icon beside
each block opens `<stem>.<locale>.translation-qa.json`, where a verdict names
the witness that reached it.

`docs-ui.js` injects the unverified-translation warning itself, from the page's
own front matter. **There is no include to add**:
`_includes/translation-warning.html` is deleted, not deprecated, as is
`_includes/language-selector.html` — `buildLanguageBar` renders the six UN
languages and greys out the ones not yet translated, which the include only
promised in a comment. (`qa-translation-badge.html` went the same way: it
rendered the removed numbers.)

## The navbar filters by locale
{: #the-navbar-filters-by-locale }

Reported by the owner, 2026-09-19:

> translations are still not handled right. i have english selected, but i see
> the translated pages in LHS navbar. the `fr/` `ru/` etc. sub-dirs need to be
> explicitly labeled as translated content in the graph and not shown in navbar
> unless that locale is selected. (if not present, fall back to source
> language)

Three rules, and each is enforced somewhere different because each can break
somewhere different.

### 1. A page is a translation because the PAGE says so

Three fields in its own front matter, and nothing else anywhere:

```yaml
lang: fr                              # this page is French
nav_exclude: true                     # keep it OUT of the static nav
translation_source: index.md          # which page it expresses
```

`content/pipeline/translation-index.ts` walks the site and reads those. A page
with no `lang` is the instance's **source language** — absent means the
default, not unknown.

**Never match a directory name against a list of language subtags.** That is
the *"distinguishable by extension … a coincidence of the current layout, not a
contract"* defect #263 named, moved to directory names, and it is wrong in both
directions: a folio with a `no/` chapter (Norwegian, or the English word) is
silently hidden from its own navbar, and a `pt-BR/` or `translated-fr/`
directory is silently shown as source. Neither announces itself — the navbar
simply has the wrong entries in it. Put the French page at `accueil-fr.md`
beside its source and it is indexed correctly; put an English page in a folder
called `fr/` and it is left alone.

**There is deliberately no `translated-content` graph kind.** A first draft of
PR #351 added one, with a `locale` field on `ContentDirectory` and one
`cat-harness.json` entry per locale subtree — ten entries for five locales
across two subtrees. It worked and it was the wrong axis: it restated what all
ten files already said, and it grew as O(locales × subtrees). The owner's
framing is what settles it:

> narrative/audio/visual content with text should be translatable. its not so
> much the node schema itself but its content (e.g. markdown, bpmn) should be
> translatable.

Translatability is a property of a **format within a content type**, and that
model already exists: `schemas/translation-tools.ts` declares, per content
type, which formats have an extract/inject pair — Markdown, LaTeX, PlantUML,
SVG, ArchiMate, Excel, BPMN, FSH, FHIR JSON — and `isTranslatable(contentType,
extension)` is the predicate. The index asks it rather than inventing a second
answer, so a `.json` beside a page is data and never a language.

`translations/` **is** declared, as `translation-sources`. That one earns a
kind: a `.po` catalogue is not content in any language, so no file inside it
can declare one.

**There is no `nav_order` on a translated page.** It stands where its *source*
stands, because it replaces that item rather than joining the list. A
`nav_order` beside a `nav_exclude` is two facts that contradict each other, and
the check refuses it.

### 2. `nav_exclude` is the half that JavaScript cannot do

just-the-docs builds the navbar **at build time**, from front matter, on a
static site serving the same HTML to every reader. It cannot know which locale
anybody chose, so a translated page left in the nav is in it **for everybody** —
which is the reported bug exactly. A script can swap a nav item; it cannot
un-render one without a flash of the wrong nav first.

So the translations leave the static nav entirely, and a reader with no
JavaScript gets the **source-language** navbar — the correct degraded answer
rather than an arbitrary one.

### 3. The swap, and the fallback that is not a code path

`content/pipeline/translation-index.ts` writes `docs/_data/translations.json`; `_includes/head_custom.html` publishes it
into every page as `#fa-translation-index`; `mountNavLocale` in
`docs/assets/js/docs-ui.js` reads it.

With a non-source locale selected, each nav item that **has** a page in that
locale is rewritten in place — same position, same parent, translated title,
translated href, and its own `dir` so an Arabic item inside an English column
is not laid out backwards.

**Fallback is the absence of a rewrite.** An item with no page in the selected
locale is not touched, so it keeps its source-language title and link. There is
deliberately no branch for it: a fallback implemented as its own code path is a
code path that can be wrong, and this one cannot be.

Which locale is "selected", in precedence order: `?lang=` on the URL, then the
page's own `lang` when the page *is* a translation, then the remembered
`fa-locale`, then the source language. A locale the index has never heard of is
not honoured — labelling the navbar `tlh` while every item is in English is a
claim the page cannot support.

### Three states, and the third is why the index is published as `null`

| `data-fa-nav-index` | when | what the navbar does |
|---|---|---|
| `ok` | the index parsed and holds pages | filter it |
| `empty` | it parsed and holds none | nothing to swap; every item is source language |
| `unknown` | no island, unparseable, or `index: null` because the data file was absent at build time | left **exactly** as built |

`empty` and `unknown` produce the same navbar and are **not the same answer**:
one is *"this folio has no translations"*, the other is *"this build could not
tell"*. A build that could not determine the translation set must never render
as a folio that has none — so `translation:index` exits **2** rather than
writing a partial index over a complete one, and the deploy fails rather than
publishing it.

### Adding a locale

1. Write the pages, each carrying `lang`, `nav_exclude: true` and
   `translation_source`. Where they sit is up to you — the convention here is
   `<dir>/<locale>/<page>.md`, and nothing depends on it.
2. `bun run translation:index` and commit `docs/_data/translations.json`.

There is no third step and no declaration to remember. The thing that IS easy
to forget is `nav_exclude`, which is why `translation:index:check` fails
without it: a translated page left in the static nav is in it for every
reader, whatever locale they chose, which is the bug this section records.

## Official vs unofficial

| Attribute | Official | Unofficial |
|---|---|---|
| Human sign-off | ✅ Required | ❌ Not required |
| Viewer badge | ✅ Green | 🔄 Grey/amber |
| Source hash tracking | ✅ Yes | ❌ No |
| Staleness detection | ✅ Yes | N/A |
| Can be shown in viewer | Always | Configurable (`officialRequired` in config) |

## Six UN languages

The default `supportedLocales` in `<name>.config.json`:

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

- **Do not manually add badge includes.** `docs-ui.js` renders them
  automatically from front matter. The include it replaced is **deleted, not
  deprecated** — an include that still exists is one somebody adds back.
- **Do not publish a semantic-QA number a script cannot establish.** A
  back-translation from this repo's own PO map, or from a word-substitution
  table, scores the table rather than the translation — and a string with no
  back-translation at all scores 0 and reads as drift. If no independent
  back-translator has run, the criterion has no verdict, and saying so is the
  honest output.
- **Do not infer a locale from a directory name.** `docs/fr/index.md` is
  French because it says `lang: fr`. A subtag match is wrong in both
  directions and neither failure announces itself — see
  [The navbar filters by locale](#the-navbar-filters-by-locale).
- **Do not add a graph kind for translated content.** It is the same kind of
  thing as the page it translates, differing by a field the file declares.
  Translatability is a property of a FORMAT within a content type —
  `schemas/translation-tools.ts` and `isTranslatable` — not of a directory.
- **Do not leave a translated page in the static nav.** `nav_exclude: true` is
  what keeps it out, and no amount of client-side work substitutes for it: the
  nav is built once, for every reader, before anybody has chosen a locale.
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


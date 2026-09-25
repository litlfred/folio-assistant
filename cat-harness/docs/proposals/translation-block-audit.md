---
title: "Translation support by block kind"
kind: proposal
issue: 206
bean: folio-assistant-t8g3
summary: >-
  An audit, not a change. For each of the 16 block kinds: where its reader-visible text lives, whether the gettext pipeline extracts it, injects it, renders it and QAs it, and what breaks. No kind is fully supported. Prose is partial. The math kinds are extracted but their math is corrupted in the msgid. Captions, titles and figure descriptions sit in the `.ts` manifest, and nothing extracts them. No build renders a translated block. The storage check against the owner's model: the `.po` files match it, but the `.pot` does not. There is no single source template: one copy of the `.pot` is written per target locale, which comes to 363 templates beside 19 catalogues.
---

# Translation support by block kind
{: .no_toc }

Bean `folio-assistant-t8g3`, under
[#206](https://github.com/litlfred/folio-assistant/issues/206). The owner asked
for an **audit** of which content block kinds support translation. This page is
that audit. **Nothing here changes code.** Each gap names the fix it would need.
None of the fixes is implemented.

Measured on 2026-09-24 against `1ff78b93731`. Every claim cites a file and line
under `cat-harness/`. The extraction results in the table came from running
`extractMarkdown` and `injectMarkdown` over a minimal, realistic `.md` body for
each kind (§"How this was measured"). They were not inferred from function
names.

1. TOC
{:toc}

## The answer in one paragraph

**No block kind is supported end to end, and the reason is the same for all
16: nothing renders a translated block.** The pipeline runs one kind-agnostic
Markdown state machine over a block's `.md` body. It extracts the body and
injects a `.po` back into it. It never reads the `.ts` manifest, and no build
consumes what it injects.

That machine works best on plain prose, so `prose` is **partial**. The seven
math kinds, and `example`, `remark` and `algorithm`, are also extracted, but
their math is **corrupted** in the msgid, because the `_…_` and `*…*` italic
strippers run inside `$…$`. `equation`, `diagram` and `figure` are effectively
**unsupported**, because their translatable text is in the manifest (a caption
or a description) or is diagram source that the extractor skips. `table` is
partial: its cells are extracted, but a `|` inside math splits a cell in two.

## The table

"Extracted" means the text reaches a msgid through `extractMarkdown`
(`content/pipeline/pot-extract.ts:180`). "Injected" means `injectMarkdown`
(`content/pipeline/po-inject.ts:245`) substitutes a translation. "Rendered"
means a translated block reaches a reader in some output. "QA'd" means
`translation-block-qa.ts` measures it.

**The same four facts hold for EVERY row, so the table does not repeat them:**

- **The `title` in the `.ts` is never extracted.**
  `extractFromManifest` (`pot-extract.ts:379`) is the only manifest
  extractor, and it has **no production caller**. It is imported only by
  `content/pipeline/translation.test.ts:12`. The translation tools call
  `extractMarkdown` alone (`src/tools/translation.ts:98`).
- **Nothing renders a translated block.** The Markdown render reads the
  source `.md` (`content/pipeline/render-markdown.ts:282`) and emits it
  verbatim (`:137`). It takes a `locale` (`:80`), but only for the kind
  heading, and none of its callers passes one
  (`scripts/build-document-site.ts:175`,
  `adapters/document/tools/render.ts:551`). The LaTeX render has no locale
  at all. The docs site's translated pages are whole hand-placed pages under
  `docs/<locale>/`, found by front matter
  (`content/pipeline/translation-index.ts`), not blocks.
- **The QA sweep is kind-blind.** `translation-block-qa.ts:860` walks every
  block, and `measureBlock` (`:378`) measures only the strings that
  `extractMarkdown` returns. The `.ts` is **hashed** for staleness (`:537`)
  but its text is never measured. One block sidecar exists in the corpus:
  `test/results/translation-qa/content/docs/crdm-methodology/overview.fr.translation-qa.json`,
  a `prose` block.
- **Injection deletes every blank line in the file**
  (`po-inject.ts:433`), including when nothing is translated. This merges
  adjacent paragraphs, so it affects every kind (gap G2).

| kind | reader-visible text lives in | extracted | injected / rendered | QA'd | hazards (measured) | verdict |
|---|---|---|---|---|---|---|
| `definition` | `.md` body; `title` (`schemas/types.ts:411`) | body yes, but math is **corrupted**; title no | body injected, math and markup damaged; not rendered | body only | `\pi_K = \pi_1(…)` → msgid `\piK = \pi1(…)`. `$$…$$` inside a paragraph joins the prose into one msgid | partial |
| `theorem` | `.md`; `title`; Lean via `lean.ref` (never text) | body with math corrupted; title no | as above; not rendered | body only | `$a_i$ and $b_j$` → `$ai$ and $bj$`. `\begin{align}` is split into 4 msgids, and its `- 1 &\le` row is parsed as a **list item** | partial |
| `lemma` | `.md`; `title` | body; list items yield one msgid each | injected; not rendered | body only | Math reaches the translator inside every list item | partial |
| `proposition` | `.md`; `title` | body with math corrupted | injected; not rendered | body only | `$a*b*c = c*b*a$` → `$abc = cba$`: the star-italic stripper runs inside math | partial |
| `corollary` | `.md`; `title` | body | injected; not rendered | body only | Numbers in math such as `137.036` are "strict" invariants in QA (`translation-block-qa.ts:236`). That is correct, but they are only checkable when the math is not corrupted | partial |
| `conjecture` | `.md`; `title` | body; **inline code and link targets are dropped** | injected, and the code span and URL are **lost** from the output; not rendered | body only | `` `QOU.Knot.volume` `` disappears from the msgid, and so from the translated line | partial |
| `proof` | `.md`; `title` | body | injected, and `[lem:step](#lem:step)` loses its target; not rendered | body only | Cross-reference links become plain text, so a translated proof has no working cross-refs | partial |
| `algorithm` | `.md` (prose + fenced pseudocode); `title` | prose yes; fenced code correctly skipped | injected; `` `kauffman(w)` `` is lost ("Compute the Kauffman bracket via ."); not rendered | body only | Inline code in a step is deleted | partial |
| `example` | `.md`; `title` | body | injected; not rendered | body only | `:refterm[…]{#…}` and `\cite{…}` reach the msgid **verbatim**, and survive only if the translator copies them | partial |
| `remark` | `.md`; `title` | body | injected, but the blank line after a `>` quote is deleted, so the next paragraph is **absorbed into the blockquote**; not rendered | body only | Lazy continuation after G2 | partial |
| `simulator` | `.md`; `title`; `defaultView.title` / `views[].title` (`types.ts:856`); the `.html` app | `.md` only; view titles and the app, no | `.md` injected; not rendered | body only | `` `bach-2013` `` is dropped. The app's own strings are out of scope for gettext here | partial |
| `prose` | `.md` only (no `title` is required) | yes | injected, with inline code, links and emphasis stripped; not rendered as a block | **yes**: the one existing block sidecar | "a `` `.ts` `` manifest" → msgid "a  manifest" | partial |
| `equation` | `.md` that is all math, or `tex` in the `.ts` (`types.ts:965`) | the whole `$$…$$` becomes a msgid; `tex` no | injected (the translator is handed LaTeX); not rendered | body only | `\int_0^1 x_i\, dx_j` → `\int0^1 xi\, dx_j`. Rows of `\begin{cases}` that start with `-`/`+` become list items | unsupported (should be excluded) |
| `diagram` | `caption` (`types.ts:978`); `tex` (`:976`); fenced `mermaid`/`tikzcd` in `.md` | fenced source skipped (so **mermaid labels cannot be translated**); unfenced `\begin{tikzcd}` **leaks** as a msgid; caption no | caption rendered only in LaTeX, verbatim (`render-latex.ts:1168`, `:1178`); the Markdown render emits no caption | body only | tikz source handed to a translator | unsupported |
| `table` | `.md` pipe table; `caption` (`types.ts:994`); `tex` (`:992`) | cells yes, including numbers (`0.511`) as msgids; caption no; `tex` no | cells injected, but a cell holding `$` + absolute-value bars around `\psi` + `^2$` is split at each bar, so the msgids are `\psi` and `^2$`, and the injected row **gains a column**; caption rendered only in LaTeX (`render-latex.ts:1213`) | body only | a pipe character inside math or code breaks the row (`pot-extract.ts:337`, `po-inject.ts:398`) | partial |
| `figure` | `caption`, `narrative.text` (`types.ts:1024`, `:1028`); image alt in `.md` if present | alt text yes; caption and narrative no | **the image is deleted**: the `![alt](file)` line is replaced by the translated alt text. Not rendered; LaTeX has no `figure` case and throws (`render-latex.ts:1237`) | body only | The alt text and the caption are different fields with different jobs, and only the one that lives in the `.md` is reachable | unsupported |

## How this was measured

A scratch script ran `extractMarkdown` over one small body per kind. It then
ran `injectMarkdown` with a fake catalogue that wraps every msgid as
`FR[…]`, which makes it visible what injection does to structure. This
instance holds **no** math-kind block: its corpus is 157 `prose` blocks under
`content/docs/`. So the math samples were written for the probe, in the
shapes the paper adapter documents. Selected outputs, verbatim:

```text
definition  L1: "A knot is a smooth embedding $K\\colon S^1 \\hookrightarrow S^3$, considered
                 up to ambient isotopy. The knot group is $$ \\piK = \\pi1(S^3 \\setminus K). $$"
proposition L1: "The map $f(xi) = yj$ is injective, and $abc = cba$ holds in the centre."
theorem     L3: "\\begin{align} \\DeltaK(t) &= \\sum{i} a_i t^i \\\\"
            L5: "1 &\\le |x| \\le 1"          ← the "- 1" row, taken as a list item
table       L4: "\\psi"  and  "^2$"            ← from "$|\\psi|^2$"
            injected:  | FR[proton] | FR[938.272] | $| FR[\\psi] | FR[^2$] |
figure      injected:  FR[Incidence of malaria by region, 2020]   ← image gone
            injected:  FR[Source: WHO World Malaria Report.]     ← now the same paragraph
```

The blank-line defect, reduced to its minimum, with an **empty** catalogue:

```text
injectMarkdown("Para one here.\n\nPara two here.\n", new Map())
  → "Para one here.\nPara two here."   (changed: false)
```

The existing tests do not catch it: they assert with `toContain`
(`content/pipeline/translation.test.ts:369-370`), and a merged paragraph still
contains both sentences.

## The gaps, and the fix each would need

Ordered by how much of the table each one explains.

**G1: Math is not protected from the extractor or the injector.** The
cleaning patterns (`pot-extract.ts:58-61`) run over math: `_…_`, `*…*` and
backtick spans are stripped inside `$…$`. Display math joins the surrounding
paragraph (`pot-extract.ts:193`), and math rows that start with `-`, `+` or
`>` match the list and blockquote patterns (`:75-76`). *Fix:* tokenise
`$…$`, `$$…$$`, `\(…\)`, `\[…\]` and `\begin{…}…\end{…}` into opaque
placeholders before cleaning, in the same way Liquid output is already
tokenised (`pot-extract.ts:118-122`), and restore them in `po-inject.ts`.
Treat a paragraph that is only display math as non-translatable. The same
change must go into both files, because the injector looks translations up by
the **cleaned** msgid (`po-inject.ts:265`). This is what
`translation-manager.md`'s "Do not translate math … Exclude in extraction"
already claims happens.

**G2: Injection deletes every blank line.** `po-inject.ts:433` filters out
every `""` line, not only the continuation lines it blanked itself. This merges
paragraphs, absorbs text into a preceding blockquote, and glues a figure's
image line to its source line. *Fix:* record the indices blanked by the
paragraph collapse (`:283-286`), remove only those, and assert whole-output
equality in the tests.

**G3: Inline markup is stripped from the msgid and never restored.** Code
spans, link targets, bold and italic, and images are removed by
`cleanMarkdownText` (`pot-extract.ts:127-139`). Injection then replaces the
**whole** line with the msgstr (`po-inject.ts:283`), so the translated block
loses its code, its cross-references and, for an image line, the image itself.
*Fix:* emit placeholders instead of stripping (for example `{code0}` and
`<a0>…</a0>`, flagged `python-brace-format` as the Liquid variables already
are, `pot-extract.ts:462-465`), and restore them on injection.

**G4: Manifest text is never extracted.** The fields are `title` on every
kind, `caption` on `diagram`, `table` and `figure`, `narrative.text` on
`figure`, `defaultView.title` and `views[].title` on `simulator`, and
`Chapter.title` and `Section.title` (`types.ts:1183`, `:1123`).
`extractFromManifest` covers `title` only and is called by nothing. *Fix:*
extend it to the full field list, call it from the same places that call
`extractMarkdown`, and give each msgid a `msgctxt` naming the field. A
caption and a body sentence can be identical and still need different
translations.

**G5: No translated render path exists for blocks.** *Fix:* a locale-aware
build that, per block, resolves `.po` files with `resolvePoSources`
(`po-resolve.ts:101`), injects the body, looks up the manifest msgids from G4,
and passes `locale` through to `renderBlockMarkdown` so the kind heading
agrees. The LaTeX path needs the same inputs. Until then, every "injected"
cell above ends at a `.md` file in `translations/<locale>/` that nothing
reads.

**G6: `|` inside math or code breaks table rows.** A row is split on every
pipe (`pot-extract.ts:337`, `po-inject.ts:398`). *Fix:* split only on pipes
that are outside math, code spans and escapes. G1's tokenisation gives this
for free if it runs before the split.

**G7: Diagram source has no extractor.** Skipping fences is right for tikz,
where the text is mathematics. It is wrong for mermaid, whose node labels are
prose. *Fix:* a mermaid label extractor modelled on `bpmn-translate.ts`, which
already separates labels from ids. The captions come from G4.

**G8: The skill describes a pipeline that is not there.**
`skills/folio-core/translation-manager.md` has five such claims:

- `:82` and `:84`: block titles and chapter and section titles are
  translatable "from `.ts` manifests". Nothing extracts them (G4).
- `:85`: kind headings go to "a locale catalogue". They are a TypeScript map,
  `KIND_HEADINGS` (`schemas/translation.ts:398`), not a `.po`.
- `:152` and `:173`: `bun run content/pipeline/pot-extract.ts` and
  `po-inject.ts` are given as CLIs. Neither file has an `import.meta.main`
  block, so both commands do nothing.
- `:170-178`: injection writes to `docs/<locale>/`. The MCP tool writes
  `translations/<locale>/<basename>.md` (`src/tools/translation.ts:160-163`),
  which `:659` forbids.
- `potGranularity` (`schemas/translation.ts:382`) is declared and read by
  nothing.

*Fix:* correct the skill to what runs, and make each future fix update the
row it closes.

**G9: The storage model.** See the next section.

**Outside translation, found on the way.** The LaTeX renderer has no `figure`
case, so `renderBlock` **throws** `Unknown block kind: figure`
(`render-latex.ts:1236-1237`, reproduced). The Markdown renderer emits no
`caption` for any kind. Either one means a translated caption would have
nowhere to appear.

## Storage model: the owner's statement against the code

The owner (verbatim): *"source = pot, translations in the .pot file per
locale"*. This audit reads it as follows: the source strings are the `.pot`
template, and each locale's translations sit in a per-locale `.po` beside it.

| part of the model | what the code does | matches? |
|---|---|---|
| translations are per locale, in `.po` | `translations/<locale>/<stem>.po`, resolved block → chapter → `global.po` → dependencies (`po-resolve.ts:122`, `:225-242`). The root is the declared `translation-sources` graph, `translations/` (`cat-harness.json`, `po-resolve.ts:81`) | **yes** |
| the source is **one** `.pot` | **No single template exists.** Each writer puts a **copy per target locale**: `translate-bpmn.ts:187-189` (`translations/<loc>/processes/<stem>.pot`, stamped `Language: <loc>` at `:269`), `translate-kg-viewer.ts:116` (`translations/<loc>/kg-viewer.pot`). `schemas/translation.ts:6-21` documents per-locale `.pot` as the layout | **no** |
| … measured | 363 `.pot` files beside 19 `.po` files. 355 of the templates are 71 diagrams × 5 locales. For all 71, the copies differ **only** in the `Language:` and creation-date header lines. `kg-viewer.pot` is the same. No diagram has a `.po` in any locale | — |
| … and a second, conflicting writer | `translation_extract` writes `translations/<source-locale>/<name>.pot`, with the source locale defaulting to `en` (`src/tools/translation.ts:56`, `:104-106`). But `docs/assets/js/docs-ui.js:107` says "there is no `translations/en/` and there never will be", and the directory does not exist. **Two writers disagree** about where the template lives | **no** |
| … and page templates are partial | `index.po` exists in all 5 locales, but `index.pot` only in `fr`. `agent-onboarding.pot` and `crdm-methodology.pot` also exist only in `fr`. Four locales' page `.po` files have no template beside them | **no** |
| only `.pot`, `.po` and manifests in `translations/` | `translation_signoff` writes `translations/<locale>/status.json` (`src/tools/translation.ts:307-309`; `translations/fr/status.json` is committed), and `translation_inject` writes `.md` there (`:160-163`). The skill forbids both (`translation-manager.md:599-609`) | **no** |
| translated strings live in `.po` | kind headings live in `KIND_HEADINGS` in TypeScript (`schemas/translation.ts:398`) | **no**, for this one table |

**Summary.** The `.po` half matches the owner's model. The `.pot` half does
not: templates are duplicated into every target-locale directory and are
byte-identical except for their headers. The only writer that tries to keep one
source template (`translation_extract`) puts it in a directory that another
module asserts will never exist. **Not changed here.** Moving to one template
at the root of `translations/` (or at `translations/<source-locale>/`) would
touch `translate-bpmn.ts`, `translate-kg-viewer.ts`,
`gen-translation-status.ts`, `kg-locale-export.ts` and the `TranslationNode`
examples. It is a decision for the owner, not for an audit.

## What this page does not do

- It does not fix any gap. Each gap names the change it needs, and none is
  made.
- It does not audit the DAK or IG block kinds in `schemas/dak-blocks.ts`. The
  request named the 16 in `BLOCK_KINDS`.
- It does not assess translation *quality*. That is the round trip in
  `translation-roundtrip.ts`, which is kind-agnostic and records agent
  verdicts. It adds nothing per kind.

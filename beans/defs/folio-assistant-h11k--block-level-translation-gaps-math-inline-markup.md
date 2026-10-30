---
# folio-assistant-h11k
$schema: bean/1.0.0
title: 'BLOCK TRANSLATION GAPS: math placeholders, inline-markup placeholders, manifest extraction, locale render path'
status: in-progress
type: task
priority: high
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T13:59:00Z
parent: folio-assistant-slw1
---

Split from folio-assistant#206, which closed on 2026-10-30 because every requirement it listed is on main. These are the open gaps from `cat-harness/docs/proposals/translation-block-audit.md`, as measured on main on 2026-10-30.

## Done when
- [x] G1: math is protected through extraction. Today `$a*b*c$` comes out as `$abc$`, and a `- x + y` row inside `$$…$$` is read as a list item. Subscripts already survive.
- [x] G3: code spans and link targets are kept as placeholders. Today `` `f(x)` `` is dropped.
- [x] G4: `extractFromManifest` is called from the pipeline, not only from tests.
- [x] G5: blocks have a translated render path.

G1 comes first, because the owner's content is mathematical.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

## Implementation (`litlfred/cat-harness-tools#898`)

- **PR:** https://github.com/litlfred/cat-harness-tools/pull/898 (`h11k-block-translation-gaps`)
- **G1:** `cleanMarkdownWithTokens` in `pipeline/pot-extract.ts` tokenises inline and display math (`$…$`, `$$…$$`, `\[…\]`, `\(…\)`, `\begin{…}…\end{…}`) before link, emphasis, and HTML tag stripping; `extractMarkdown` and `injectMarkdown` skip multi-line and single-line display math blocks (`MD_MATH_ENV_OPEN_RE`, `$$`, `\[`); `isTranslatable` strips math/code/liquid/link tokens via `stripNonTranslatableTokens`; `splitTableCells` masks math and code spans before splitting pipe-delimited table rows.
- **G3:** `cleanMarkdownWithTokens` emits `{code0}`, `{code1}`, … for inline code spans and `<a0>…</a0>`, `<a1>…</a1>`, … for markdown links; `formatPot` flags `{code\d+}` with `#, python-brace-format`; `injectMarkdown` restores `{codeN}`, `<aN>…</aN>`, `{lqd_…}`, and standalone `![alt](src)` wrappers (with legacy fallback for pre-G3 `.po` catalogues).
- **G4:** `extractFromManifest` (with `parseManifestSource`) extracts `title`, `caption`, `narrative`, `defaultView.title`, `views[i].title`, `abstract`, `sections[i].title` (and `subsections`), and `chapters[i].partTitle` with `msgctxt`, and is wired into `src/tools/translation.ts` (`translation_extract`, `translation_validate`), `pipeline/translation-block-qa.ts` (`measureBlock`, `buildReport`), and `scripts/translation/simulate-translation.ts`.
- **G5:** `translateBlockFields`, `translateManifestText`, and `translateBlockEntry` translate block/chapter/section manifests and `.md` narrative bodies via `resolvePoSources` + `mergePoSources` + `parsePo` + `injectMarkdown` in `pipeline/render-markdown.ts` (`renderBlockMarkdown`, `renderSectionMarkdown`, `renderChapterMarkdown`, `buildDocumentMarkdown`), `pipeline/render-latex.ts` (`renderBlock`, `renderSection`, `renderChapter`), and `pipeline/build.ts` (`buildPaper`).

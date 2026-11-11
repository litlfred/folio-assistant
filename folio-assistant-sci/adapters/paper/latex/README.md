# Paper print template

`paper-preamble.tex` is the generic LaTeX preamble for a **paper** folio:
document class and packages, page geometry, section formats, theorem styles,
the LeanBlueprint macros, the Lean status marks and margin annotations, the
unicode safety maps, and the macros the paper renderer emits (`\blockannot`,
`\sectionannot`, `\chapterannot`, `\defterm`/`\refterm`, `\uses`,
`\proofstatuslegend`). `paper-preamble.test.ts` pins that contract.

## Where it came from (owner decision D1, 2026-10-04)

The platform's shared preamble, `cat-harness/latex/preamble.tex`, was deleted
in `34a70659c7` (bean `0uu2`) on the grounds that litlfred/qou held it as
`main.tex`. qou's copy was the **corrected** one: on 2026-08-22 it removed 16
macros whose names were author typos (`\pic` silently printed `\pi`). After the
deletion no source copy existed anywhere, so no paper PDF could be regenerated.

This file is qou `main.tex` lines 1–827 at `ddd4841b8ce`, the part
`generate-main-tex` inlines from `--preamble` (everything above its generated
`Paper macros` section), **minus 32 lines moved to qou's own notation
fragment**:

- `\bigbowtie`, `\varTheta` (with its comment), `\pp`, `\unicode`, `\yng`;
- the two unicode maps that encode a font choice, `𝓑`→`\mathcal{B}` and
  `𝔙`→`\mathfrak{V}` (decision D2: of 296 maps, the only notation);
- the comment recording the 2026-08-22 typo-macro removal, which documents
  qou's notation history.

No line was edited. The template plus the fragment reproduce the 828-line
original as a line multiset (796 + 32). Plan and inventory: qou
`docs/audits/2026-10-04-workplan-and-migration/PDF_report.md` (story P1), issue
#2117.

## How it is wired

`PaperContentAdapter` (`../index.ts`) exports `PAPER_PREAMBLE_PATH` and exposes
it as `PaperContentAdapter.preamblePath`. When `generate-main-tex.ts` or
`build.ts --generate-main` runs without `--preamble`, it obtains this template
from the paper adapter through `resolveRenderTarget("paper")` /
`resolveAdapterPreamble("paper")` (bean `4dj5`, issue #2117 P2/P5):

```sh
bun run cat-harness-tools/pipeline/generate-main-tex.ts <paper.ts>
```

A folio's own notation fragment is not yet read by the pipeline (qou story Q1).

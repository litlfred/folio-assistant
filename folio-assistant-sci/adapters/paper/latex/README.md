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

## Not yet wired

`generate-main-tex.ts` still defaults `--preamble` to the deleted path. Pointing
that default at this file from cat-harness would make the core depend on sci,
which inverts the layering, so the wiring is its own step (P2: the paper adapter
supplies the template through the renderer contribution; P5: `publish.yml`).
Until then, pass it explicitly:

```sh
bun run cat-harness/content/pipeline/generate-main-tex.ts <paper.ts> \
  --preamble folio-assistant-sci/adapters/paper/latex/paper-preamble.tex
```

A folio's own notation fragment is not yet read by the pipeline either (qou
story Q1).

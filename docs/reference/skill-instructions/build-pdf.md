---
layout: default
title: /build-pdf
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/build-pdf.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/build-pdf.md) — do not edit here.

{% raw %}
# /build-pdf

Builds the PDF locally to save CI minutes: the monolithic `main.pdf` and
the split per-chapter PDFs.

## Resolve the paper and the folio-assistant path first

Content-agnostic — take these as inputs rather than assuming a layout:

```sh
# The folio's papers (each has <paper>/<paper>.ts)
ls content/*/[!.]*.ts | xargs -n1 dirname | sort -u
```

- `PAPER` — the paper directory under `content/`. Never hardcode one; if
  the folio has several, ask which to build.
- `FA` — path to the folio-assistant checkout. It is a sibling
  (`../folio-assistant`) in the common layout, but do not assume:
  resolve it and fail loudly if it is missing, rather than emitting a
  path that silently does not exist.
- `BUILDER_IMAGE` — the folio's LaTeX builder image, from the folio's own
  CI config. There is no platform default; a folio that has not published
  one must install `latexmk` natively.

## Behavior

1. Generate `main.tex` and the per-chapter `.tex` files:

   ```bash
   bun run --preload ../scripts/preload-registry.ts "$FA/content/pipeline/build.ts" \
     "content/$PAPER/$PAPER.ts" \
     --out-dir chapters/ \
     --generate-main \
     --main-out main.tex \
     --preamble "$FA/latex/preamble.tex"
   ```

2. Compile with `latexmk`, falling back to the folio's builder image when
   `latexmk` is not available natively:

   ```bash
   latexmk -pdf main.tex \
     || docker run --rm --entrypoint "" -v "$(pwd)":/work -w /work \
          "$BUILDER_IMAGE" latexmk -pdf main.tex
   ```

   If neither is available, say so — do not report a PDF that was not
   built.

3. Split into per-chapter PDFs:

   ```bash
   mkdir -p chapters-pdf/
   python3 "$FA/scripts/split-pdf-by-chapter.py" \
     --input main.pdf \
     --output-dir chapters-pdf/
   ```

4. Report the output paths (`main.pdf`, `chapters-pdf/`).

## Related

`docs-generation` covers the builder-image fallback in more detail;
`latex-preflight` and `latex-validation` catch source problems before a
compile is attempted.
{% endraw %}

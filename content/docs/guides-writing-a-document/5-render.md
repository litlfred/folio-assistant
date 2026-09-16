```
content/**  →  document_render_md   →  build/<slug>.md
                                    →  document_render_html  →  build/<slug>.html
                                    →  document_render_pdf   →  build/<slug>.pdf
```

**Read the Markdown first.** It is the only place the whole document appears in
reading order in one file, and ordering problems are invisible block-by-block.
Look for sections that came out empty, blocks in an order that does not read,
and the `> **Missing block:**` marker.

HTML needs only `pandoc`. PDF additionally needs one TeX-free engine —
`weasyprint` (recommended), `prince`, or `wkhtmltopdf`:

```sh
apt install pandoc
pip install weasyprint
```

If none is installed, `document_render_pdf` says which are missing and stops.
It does **not** fall back to `latexmk`, even where TeX is present: a PDF that
silently came out of LaTeX would misreport what the folio needs to build, and
the next person on a clean machine pays for that.

Both renderers take a `css` path relative to the repo root. Keep the stylesheet
in the folio — a house style is content — and put the print rules (`@page`,
page breaks, running heads) in the same file as the screen rules, so the two
outputs cannot drift.

The agent renders a PDF (and/or HTML) with the paper adapter.

> **You:** Render the PDF and show me a preview.
>
> **Assistant:** *(calls `paper_render_pdf`, then `paper_preview`)* Rendered
> `harmonic-series.pdf` (3 pages). Preview below.

![Mock screenshot: rendered PDF preview in the viewer](../assets/img/mock-viewer.svg)

You can set rendering preferences (engine, scope, math renderer) via the
`paper_preferences` tool:

> **You:** Use lualatex and render only the theorem section next time.
>
> **Assistant:** *(calls `paper_preferences action=set latex_engine=lualatex render_scope=section`)* Saved.

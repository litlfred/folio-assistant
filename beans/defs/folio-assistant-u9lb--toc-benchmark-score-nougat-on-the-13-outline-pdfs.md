---
# folio-assistant-u9lb
title: 'TOC benchmark: score Nougat on the 13 outline PDFs (needs huggingface.co) (#2302)'
status: todo
type: task
created_at: 2026-10-06T18:05:01Z
updated_at: 2026-10-06T18:05:01Z
parent: folio-assistant-slw1
---

Follow-up to bean cp3v / PR #2303 (issue #2302). Needs an agent with network access to huggingface.co (Nougat weights); the cp3v session's container is denied it.

Branch from claude/compassionate-johnson-rzv00r and open a PR INTO that branch (or into main once #2303 has merged). Do not edit _pdf_headings.py.

## Steps
- [ ] pip install nougat-ocr (weights: facebook/nougat-small; nougat-base if a GPU is available)
- [ ] List the PDFs: python3 -c "import glob,pymupdf;[print(p) for p in glob.glob('**/*.pdf',recursive=True) if 'node_modules' not in p and len(pymupdf.open(p).get_toc())>=5]" (13 files on 2026-10-06)
- [ ] Run: nougat <pdf> -o /tmp/nougat-mmd -m 0.1.0-small (one <stem>.mmd per PDF). Skip the 534-page iHRIS handbook on CPU and say so.
- [ ] Score: python3 cat-harness/scripts/toc-benchmark.py --methods regex,font,layout,nougat --nougat-mmd /tmp/nougat-mmd --json /tmp/nougat.json
- [ ] Add a nougat row and per-document column to cat-harness/docs/research-and-analysis/toc-extraction.md; note link F1 is not measurable (Nougat marks no page boundaries), and record model, device and wall time
- [ ] python3 cat-harness/scripts/tests/pdf-toc-layout.test.py stays green; commit, push, PR

## Done when
The report carries measured Nougat numbers next to layout's 0.86 title F1, with the run conditions stated, or says exactly what prevented the run.

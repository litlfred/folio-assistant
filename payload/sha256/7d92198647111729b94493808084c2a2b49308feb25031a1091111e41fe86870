---
# folio-assistant-2akf
$schema: bean/1.0.0
title: 'document-export: pin the Word styling with a reference.docx so the pandoc version cannot change the PDF''s pages and lines'
status: todo
type: task
created_at: 2026-11-06T05:56:50Z
updated_at: 2026-11-06T05:56:50Z
parent: folio-assistant-dthl
---

Found 2026-11-06 (dth-hrh#104 previews). The same commit exported on the GitHub runner (pandoc 3.7.0.2, LibreOffice 26.2) gives a 169-page, 2514-line PDF; in a Claude container (pandoc 3.1.3, LibreOffice 24.2) 143 pages, 2162 lines. Cause: pandoc 3.7's default reference docx uses the Aptos theme font; 3.1.3's uses Cambria/Calibri. Laying out the CI .docx locally gives 166 pages in Inter (the local Aptos stand-in); on the runner it falls back to DejaVu Serif. Installing metric fonts (cat-harness-tools#1556) does not fix it. Fix: ship a reference.docx with document-export.ts (explicit fonts with free metric-compatible stand-ins, e.g. Caladea/Carlito or Liberation) and pass --reference-doc, so a page-and-line citation does not depend on where the PDF was built. Record the reference doc's sha256 in the export manifest.

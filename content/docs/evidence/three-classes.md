Retrieval fans out across **three classes that are not interchangeable**, and
keeping them apart is the point of the parallel gateway:

**Trusted sources — L1.** Ingested primary literature under `library/`: the
`sections/*.md` tree and, where a document was scanned, `ocr/page-NNN.txt`.

> **Known blind spot.** A document that was OCR'd but never re-run through
> `pdf-structure.py` has only a stub in `sections/`, so a sections-only search
> misses it entirely. Measured: **26** `library/*/ocr/` trees against **11**
> `structure.json` recording `"text_source": "ocr"`. See [Document
> ingestion](document-ingestion.html).

**Trusted content — L2 DAKs, L3 IGs.** Already-adjudicated guidance: WHO SMART
Digital Adaptation Kits at L2, FHIR Implementation Guides at L3. A recommendation
adopted in a published DAK **is evidence of a different kind** from a primary
study — it is a *prior decision*, with its own provenance and its own grading —
and must be cited as that. Laundering it into primary evidence is the failure
mode this separation exists to prevent.

**Data repositories and statistical datasets.** Indicator series and microdata.
Distinct again because the unit of evidence is a **measurement** with a
population, a period and a method attached — not a claim in prose.

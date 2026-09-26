Every one of these is drawn in the diagrams above and tracked as a bean. None is
implemented.

| Step | Bean | Notes |
|---|---|---|
| One pipeline entry point | [`folio-assistant-apui`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-apui--ingest-one-pipeline-entry-point-uploads-to-library.md) | Today the move is a script plus whatever the agent remembers |
| Archive contents manifest | [`folio-assistant-twqe`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-twqe--ingest-archives-extract-a-standardized-greppable-c.md) | A tar is opaque to every grep until listed as data |
| Technical file metadata | [`folio-assistant-nso8`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-nso8--ingest-technical-file-metadata-fileinfo-sizes-hash.md) | The checksum is what makes a remote asset verifiable |
| Image descriptions, localized | [`folio-assistant-d5f1`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-d5f1--ingest-narrative-description-per-image-localized-i.md) | **Including images extracted from PDFs** |
| Audio transcription + translation | [`folio-assistant-1r0p`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-1r0p--ingest-audio-transcription-and-translation.md) | |
| Tabular metadata | [`folio-assistant-p67i`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-p67i--ingest-csv-and-spreadsheet-sheet-names-headers-sha.md) | Sheets, headers, shape, narrative |
| Narrative provenance | [`folio-assistant-iqim`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-iqim--ingest-narrative-provenance-cite-the-human-or-agen.md) | Human or agent + **model version** |
| L1 completeness gate | [`folio-assistant-pn6j`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-pn6j--ingest-l1-completeness-gate-derived-content-must-b.md) | Makes the rest obligatory rather than aspirational |
| Round-trip translation QA | [`folio-assistant-ktt2`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-ktt2--ingest-round-trip-translation-qa-back-translate-to.md) | Detects drift; a human adjudicates it |

# Ingest provenance (bean turh): a known title reaches the PDF rungs, and the
# OCR engine is recorded as a folio-run-context/v1 cited by digest.
Feature: Ingest provenance

  @test:scripts/tests/library/ingest-provenance.test.ts::title_pass-through_(turh,_gap_1)::the_title_reaches_the_rungs_that_write_structure.json_and_doc_title,_and_not_the_OCR
  Scenario: A known title reaches the structure rungs and not the OCR
    Given a plan of a pdf-ocr step then a pdf-pages --from-ocr step
    When the known title "WHO Editorial Style Manual" is applied
    Then the pdf-ocr step is unchanged
    And the pdf-pages step ends with --title and the title
    And a pdf-structure step also receives --title

  @test:scripts/tests/library/ingest-provenance.test.ts::title_pass-through_(turh,_gap_1)::no_title,_no_change;_and_never_a_second_--title
  Scenario: No title changes nothing, and a title is never added twice
    Given a plan of a pdf-ocr step then a pdf-pages step
    When no title is applied
    Then the same plan comes back
    And when title A then title B are applied, the pdf-pages step carries one --title

  @test:scripts/tests/library/ingest-provenance.test.ts::title_pass-through_(turh,_gap_1)::--title_wins;_otherwise_the_catalogue's_dc.title;_otherwise_nothing_is_guessed
  Scenario: The known title comes from --title, then the catalogue, then nowhere
    Given an instance whose catalogue node for library id who-pub-tps-931 cites a Dublin Core record with a title
    When the known title is read with no --title
    Then it is the catalogue's dc.title, citing that record
    And with --title "Given" it is "Given", from --title
    And for an entry the catalogue does not name it is undefined

  @test:scripts/tests/library/ingest-provenance.test.ts::which_software_ran,_as_a_folio-run-context/v1_(turh,_gap_2)::the_Python_writer_produces_a_context_the_schema_accepts,_with_runContextRef's_digest
  Scenario: The Python run-context writer agrees with the TypeScript schema and digest
    Given a git checkout holding an input PDF and an index.lock.json
    When _run_context builds and writes a context for pdf-ocr with a provisioned and a could-not-provision release
    Then the context parses against the run-context schema
    And the reference the writer returns equals runContextRef of it, as does the file written under ocr/
    And the invoker is the system script scripts/pdf-ocr.py, the mounts are locked
    And the release states are provisioned then could-not-provision
    And the input is in.pdf with a 12-hex-digit hash

  @test:scripts/tests/library/ingest-provenance.test.ts::which_software_ran,_as_a_folio-run-context/v1_(turh,_gap_2)::no_checkout_to_name_means_no_context,_rather_than_an_invalid_one
  Scenario: With no checkout to name there is no context
    Given a directory that is not a git checkout and a script path that is not one either
    When _run_context builds a context there
    Then it is None

  @test:scripts/tests/library/ingest-provenance.test.ts::which_software_ran,_as_a_folio-run-context/v1_(turh,_gap_2)::end_to_end:_pdf-ocr_records_the_engine,_pdf-pages_cites_it_and_carries_the_known_title
  Scenario: pdf-ocr records the engine and pdf-pages cites it with the known title
    Given tesseract, pdftoppm and PyMuPDF are installed, and a one-page scanned PDF in a git checkout
    When pdf-ocr.py runs on it in English
    Then the entry's ocr/run-context.json parses, with tesseract provisioned and a tessdata-eng release
    And when pdf-pages.py --from-ocr --title runs, structure.json's text source is ocr
    And structure.json cites the run context by runContextRef
    And the first section's front matter carries the doc_title

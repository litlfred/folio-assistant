# smart-base Toolchain

> Skill id: `smart-base-tools` · Capability: `smart-base` · Package:
> `authoring-who-smart-guidelines`

Run WHO's DAK toolchain from a `smart-base` checkout. **Load it; never vendor
it.** The DAK repositories' own GitHub Actions invoke those scripts in place,
so `WorldHealthOrganization/smart-base` stays their authoritative home — a copy
here would be a second, drifting toolchain, which is the argument
`docs/proposals/rag-document-ingestion.md` §2c makes about corpora, applied to
code.

## Before you start

```sh
export SMART_BASE_HOME=/path/to/smart-base       # default: /opt/smart-base
python3 scripts/smart-base-transform.py --check
```

`--check` exits non-zero and names what is missing. Without a checkout the
skill degrades to `skip` — it does **not** report a clean run over a toolchain
it never had.

## Transforms

Both are the *render* direction — an authored source artefact producing a
published representation, which is what §12.15 wants and what the extractors
are the inverse of.

```sh
# BPMN → FHIR Shorthand
python3 scripts/smart-base-transform.py bpmn2fsh <file.bpmn|dir> -o OUTDIR

# DMN → HTML
python3 scripts/smart-base-transform.py dmn2html <file.dmn|dir> -o OUTDIR
```

Omit `-o` for a dry run that reports counts and writes nothing.

## Two things to expect

**`bpmn2fhirfsh.xsl` emits many files per input.** Its output is an envelope,
`<files><file name="…">…</file>…</files>`, and each entry is a separate
artefact at the path the transform names. Measured on `smart-dak-immz`: 8
business processes → **313 files**, one process alone accounting for 157.

**Paths collide across inputs.** Those 313 land at only 201 distinct paths,
because shared actors and two near-duplicate copies of one process name the
same outputs. The runner counts and names every collision on stderr rather than
overwriting silently — 313 successes leaving 201 files is exactly the kind of
quiet arithmetic that hides a problem. Decide deliberately whether a collision
is a duplicate input to remove or two processes that legitimately contribute
the same actor.

## What else is in there

`smart-base` carries ~54 Python scripts (see the survey in the proposal §12.16):
extractors (`dd_extractor`, `dt_extractor`, `req_extractor`, `extractpr`),
generators (`generate_jsonld_vocabularies`, `generate_*_schemas`,
`dmn_questionnaire_generator`), a translation subsystem, and IG build/CI
orchestration. Only the two transforms above are wrapped so far. The IG build
and CI scripts want no skill: GitHub Actions is their caller.

**There is no PDF renderer in smart-base.** Its only PDF dependency is
`pdfplumber`, used to *read* PDFs when extracting personas.

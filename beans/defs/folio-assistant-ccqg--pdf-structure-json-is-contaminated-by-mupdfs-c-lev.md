---
# folio-assistant-ccqg
title: pdf-structure --json is contaminated by MuPDF's C-level stdout, so the artefact does not parse
status: completed
type: bug
priority: normal
created_at: 2026-09-20T15:33:38Z
updated_at: 2026-09-20T15:36:35Z
parent: folio-assistant-0lmb
---

`--help` says `--json` means *"print artefact to stdout, write nothing"*. It
does not keep that contract.

## Measured 2026-09-20, on `main`

```
$ python3 scripts/pdf-structure.py --json uploads/WPR-RDO-2020-003-eng.pdf 2>/dev/null
MuPDF error: library error: FT_New_Memory_Face(RUYKIO+TheSansLight-Caps): unknown file format

{
  "_schema": "pdf-structure/v1",
...
```

**With stderr discarded, the warning is still there** — so it is on stdout,
ahead of the JSON. `json.load()` on that raises
`Expecting value: line 1 column 1 (char 0)`.

It comes from MuPDF's C layer writing to file descriptor 1 directly, not from
Python, so `contextlib.redirect_stdout` does not catch it. The redirect has to
be at the fd.

## Why it went unnoticed, and why that is the argument for fixing it

**It is font-dependent.** `9789241548960_eng.pdf` and `milnorlink.pdf` parse
cleanly; only the document with an unreadable embedded font trips it. So a
caller written and tested against the corpus's other PDFs works until the day
it does not, and the failure it gets is a JSON parse error that names nothing
about fonts.

Found 2026-09-20 while verifying `6xaz`, where the comparison harness had to
carry `json.loads(t[t.index("{"):])` to read the script's own output. **A
workaround in the reader is the tell**: `--json` exists so a caller does not
have to repair the output before parsing it.

Not fixed in the PR that found it (#535) — it is a different defect from
`6xaz`, and widening a green PR onto an unrelated fix is how one change
becomes two conflicts.

## Done when

- [ ] `--json` puts nothing but the artefact on stdout, for every PDF in the
      corpus, and `json.load()` succeeds on it unrepaired
- [ ] the warning is still VISIBLE on stderr — silencing a font error trades a
      parse failure for a lost diagnostic, which is worse
- [ ] no artefact's content changes by a byte
- [ ] a test asserts it against the document that actually trips it, not a
      synthetic one — the whole point is that most PDFs do not


## CORRECTION — my diagnosis above is WRONG about the mechanism

The body says MuPDF writes *"from its C layer writing to file descriptor 1
directly, not from Python, so `contextlib.redirect_stdout` does not catch it.
The redirect has to be at the fd."*

**Measured 2026-09-20, it does catch it.** A `redirect_stdout` around
`pymupdf.open(...)` plus `get_text()` captured the warning in full and
**nothing leaked** to the process's real stdout:

```
--- raw stdout of the child (what LEAKED past redirect_stdout) ---
''
--- stderr ---
CAPTURED BY redirect_stdout: 'MuPDF error: library error: FT_New_Memory_Face(...)'
```

PyMuPDF emits the warning through Python's `sys.stdout`. The C-layer story was
a plausible explanation I did not check before writing it down.

**It was caught by mutation testing, not by re-reading.** An fd-level `dup2`
was written and passed all nine checks; the mutation *"use `redirect_stdout`
instead — the Python-level rebind that cannot see C"* was expected to fail and
**survived**. A surviving mutation that contradicts the rationale is the
rationale being wrong, not the test being weak.

Also checked rather than assumed: `pdf-structure.py` spawns **no subprocess**
at all, so there is no child writing to fd 1 that the descriptor machinery
would have caught and this does not.

## Done, and the four measured

`library_noise_to_stderr()` — `contextlib.redirect_stdout(sys.stderr)` around
the whole of `_process`.

| done-when | measured |
|---|---|
| `--json` puts nothing but the artefact on stdout, `json.load()` unrepaired | ✓ `parsed OK — toc_source: undetermined \| sections: 1` |
| the warning is still VISIBLE on stderr | ✓ `MuPDF error: library error: FT_New_Memory_Face(RUYKIO+TheSansLight-Caps)` on stderr |
| no artefact's content changes by a byte | ✓ all **four** corpus PDFs IDENTICAL, compared as parsed JSON against the pre-change script |
| a test against the document that actually trips it | ✓ `scripts/tests/pdf-json-stdout.test.py`, 9 checks |

**The test was run against the unfixed script first** and fails four ways
there — parse, first character, warning-on-stderr, and no-MuPDF-on-stdout.
It runs the real binary as a subprocess and reads the two streams apart,
because anything mocking at the Python level would show the bug fixed while
the real invocation still failed. It uses `WPR-RDO-2020-003-eng.pdf` and not a
synthetic PDF: the defect is font-dependent, and the other two corpus
documents parse cleanly, which is exactly why it survived unnoticed.

Three mutations, each caught by a named check — including *"the noise is
SILENCED rather than moved"*, which is the one that keeps this a redirect.

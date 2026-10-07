---
# folio-assistant-95ir
title: Library scanners FILTER OUT a declared-but-absent directory, so a partial checkout reports a clean pass
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:29:50Z
updated_at: 2026-09-23T21:40:48Z
parent: folio-assistant-zzmr
---


Found by review 2026-09-20, on this branch's own fan-out work (`a02m`).

`check-tabular-stubs.ts:137`, `check-l1-complete.ts:756` and `:936` each end
their directory resolution with a `.filter(existsSync)`. So a library the
declaration names and the tree does not carry is not a finding — it is not
even a line of output. The check then passes over the libraries that DO exist
and reports a clean run.

That is the `dh4f` shape with an extra step: not "a consumer scanned nothing",
but "a consumer scanned some of it and reported as though that were all of
it". A partial checkout — a sparse clone, a submodule not initialised, an
instance staged but not yet populated — reads as healthy.

**The same pattern bit twice today in `kg-export`**, which is why this is
worth writing down rather than fixing in passing: I wrote an absence check
over `kgDirectories`, whose own last line is `.filter(existsSync)`, so the
guard could never fire. It reported a clean run while the directory it was
guarding had been moved away. The fix there was to read the DECLARATION
rather than the filtered view, and the same fix applies here.

## Done when

- [x] Each of the three sites compares the DECLARED set against what is on
      disk, and reports the difference. `resolveDirectories([{name, root,
      own: true}])` is the unfiltered view; `directoriesForGraph` and friends
      are not.
- [x] A declared-but-absent library is a FINDING, distinct in wording from
      "this library is empty" — those are different facts and the whole point
      of the third state.
- [x] Each guard is checked by REMOVING a declared directory and watching it
      fire. A guard written over a filtered view passes this test only if it
      was written over the right view.

## The decision this needs first

Is a declared-but-absent library an ERROR or a determined third state? Both
are defensible and they differ in CI: `cat-harness` deliberately declares an
empty `library/` it does not populate (see its keep-marker), and a dependent
folio materialises `library/` before anything is ingested. If absent is an
error, those two become errors on day one.

My reading is that ABSENT and EMPTY are different — an empty directory that
exists is a determined empty, and a path the declaration names with nothing
there at all is a finding — but that distinction has never been written down,
and it decides whether this is a one-line filter change or a new state.

## Summary of Changes

Closed 2026-09-23. The owner ruled: **"fail in CI for declarations (not for instances)"**.

- **Declarations already fail in CI.** `check:declared-dirs` runs in `code-quality-gates.yml` and fails on every declared directory that is missing, across all 17 instances. I checked by moving `who-iris/library/` away: the report was `absent — declared and not on disk`, exit 1.
- **Instances report and do not fail.** The three scanner sites (`check-tabular-stubs.ts`, and `check-l1-complete.ts` twice) now use `scripts/lib/declared-presence.ts`. It splits the DECLARED set into present and absent, and prints each absent library once: *"declared … is not on disk — skipped here, NOT read as empty"*. That wording is distinct from an empty library, which is a determined empty. With `who-iris/library/` moved away, both scanners printed the note and exited 0. Before the change they were silent.
- `declared-presence.test.ts` passes 2/2.

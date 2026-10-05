---
name: upload-naming
description: What an ingested file may be CALLED. Read before adding anything to an `uploads` or `library` graph, before writing a generator that links to one, and before "fixing" a broken link in a generated README. Covers which characters break what, why the name is normalised rather than the link escaped, how a sidecar stays paired with its source, and the one case the fixer refuses.
---

# Upload naming — the name is normalised, not the link escaped

> **Lives in `library-core`, not `folio-core`.** It was written into
> `folio-core` on 2026-09-30 and moved the same day, when bean `9umr` carved
> the library topic out: `library-core` is *"acquisition, ingestion and
> archiving of sources (arXiv, web pages, photos, uploads)"*, and what an
> ingested file may be CALLED is that topic's question. It sits beside
> `uploads-watch` and `library-ingestion`, which is where somebody looking for
> it will look.

**A file in an `uploads` or `library` graph is named by whoever uploaded it, and
that name reaches a generated Markdown link.** So the name is an interface, not
a label.

`bun run check:upload-names` reports; `check:upload-names:check` gates;
`check:upload-names:fix` renames with `git mv`.

## The rule

A name may not contain any of

```
space , ( ) [ ] { } # ? & % ' " ` < > |
```

Everything else is left **exactly** as uploaded. The fixer replaces a run of
those with a single `-`, trims, and preserves the extension and any sidecar
suffix.

## Why those characters and not "everything a slug would change"

**Case is not the defect.** A first draft normalised with `slugify` — lowercase,
non-alphanumeric to `-` — and reported **110** findings over
`uploads/`/`library/`, of which **77** were `README.md` → `readme.md`. Renaming
`README.md` breaks every link to it and every generator that writes one: a
check damaging correct names to enforce a convention nobody asked for. Narrowed
to the characters that actually break something, the same corpus reports **34**.

What each one breaks:

| character | what it breaks |
|---|---|
| space, `(`, `)` | a Markdown link target **ends at the first `)`** |
| `[` `]` | the label half of the link |
| `<` `>` `\|` | the angle-bracket link form, and tables |
| `#` `?` | a fragment and a query to every URL parser |
| `&` `%` quotes backtick | escaping in a shell, an href, or both |
| `,` | nothing — included for the stub convention, on the owner's ruling |

## Why the NAME rather than the link

`uploads/PIIS2589750021000388 (2).pdf` — a browser's duplicate-download suffix,
ingested verbatim — produced

```
| [`PIIS2589750021000388 (2).pdf`](PIIS2589750021000388 (2).pdf) | a file | |
```

whose target resolves to `PIIS2589750021000388 (2`. That reddened `main` through
*"over the real tree, every link in every generated README resolves"*.

### Both layers now exist, and that is the right answer

**The escaping half landed on `main` the same day, from a sibling session**
([#1639](https://github.com/litlfred/folio-assistant/pull/1639)): `linkTarget`
in `bootstrap-tools/scripts/subgraph-readmes.ts` percent-encodes every segment
of a destination — parentheses included, because an unbalanced one ends a
CommonMark destination just as surely as a space — and `decodeLinkTarget` in
`cat-harness/scripts/check-subgraphs.ts` decodes before asking the filesystem.

This section argued against that route while it was hypothetical. It is not a
reason to undo it. **The two layers answer different questions**, and neither
subsumes the other:

| layer | reaches | fails when |
|---|---|---|
| `linkTarget` / `decodeLinkTarget` | **every** generated README link, in every graph typology, including directory names | never — it is total over what the generator writes |
| this check | `uploads` and `library` **names**, before anything links them | a name reaches something that is not that generator |

The encoder is the one that keeps `main` green. This check is the one that keeps
a filename usable in a shell, an `href`, a CI log line, a `curl`, and the next
generator nobody has written yet — the places the encoder does not reach
because it is not there.

**Measured after both landed: `uploads/README.md` contains zero percent-escapes.**
The encoder is a no-op over that graph precisely because the names are now safe,
which is what belt-and-braces looks like when the braces are doing their job.

What is still true is the cost argument, now as a statement about *reach* rather
than about *effort*: escaping is per-generator, and a name is per-file. A name
that is safe everywhere is safe once.

Owner ruling, 2026-09-30: *"rename files to normalize to stubs and downstream us
is OK."* Downstream references are expected to churn; that is accepted, not
worked around. The ruling is why this check exists — not main being red, which
the encoder had already fixed by the time it merged.

**"OK" means repaired, not abandoned.** The 33 renames left dangling
references in **30 hand-maintained files** — 26 carrying structured-data path
fields and 4 carrying a path in code or prose — plus everything generated. The
counts below are from `git status` over the repair, not from recall:

| kind | where | how it was repaired |
|---|---|---|
| `files[].path` | 3 × `who-iris/uploads/*/intake.json` | repointed from the git map |
| `container`, `assets[].path` | 7 × `*.extraction.json` | repointed; an asset path equal to the container's own basename moves with it |
| `provenance.source` | 3 × `who-iris/catalogue/records/*.dc.json` | repointed |
| `file`, `source_file` | 6 × `structure.json`, 6 × `manifest.jsonld` | repointed |
| a hardcoded path | `who-iris/themes/themes.test.ts` | **threw at module load**, which is why bun reported `1 error` with an empty failure list |
| two test fixtures | `cat-harness/scripts/tests/pdf-images.test.py` | the arm **skipped silently** — `1xhc` — so the skip now announces itself |
| prose paths | `gen-iris-pages.ts`, `pdf-pages.py`, two `_comment` fields | repointed |

Everything else regenerates, and **in dependency order**: `library:graph` →
`library:viz` → `library:readmes` → `readme:subgraphs`, then `skill:register`.
Run out of order and a later writer stales an earlier one's output, which reads
exactly like a real failure.

**One thing deliberately NOT changed:** `cat-harness/docs/wireframes/uploads/as-is.html`
still shows the old names in its table. It is a hand-authored wireframe, so
what it depicts is a design decision rather than a rename consequence.



## A sidecar suffix is not an extension

`X.pdf` pairs with `X.pdf.extraction.json`. Two ways to break that:

- rename the source and not the sidecar → the extraction is orphaned
- normalise the sidecar by a different rule than its source → same

So the fixer **strips the sidecar suffix first, normalises the remaining name by
the one rule, and restores the suffix.** The pair moves together by
construction rather than by care. Measured before it shipped: 10 pairs, 0
orphans; after the renames, 10 pairs, 0 orphans.

`slugify` applied to a whole filename destroys the extension —
`…(2).pdf` → `…-2-pdf` — which is why the stem is slugged and the extension
left alone.

## How big the rename actually was — findings are not paths

**33 paths**, measured from `git diff --name-status -M` rather than re-derived:
26 primaries and 7 `.extraction.json` sidecars; 23 under the root `uploads/`
directory and 10 across four who-iris captures.

(That sentence says *directory* rather than *graph* on purpose.
`check:declaration-claims` pairs the phrase `` `<graph>` graph `` with any
`` `*.json` `` filename near it and asks whether that file declares the graph.
This skill is ABOUT filenames, so `.json` names are dense here and none of them
is a declaration claim — the pairing was a false positive, and the honest repair
is to stop making a claim-shaped sentence rather than to add an exception.)

A run's finding count is **not** this number and must not be quoted as it. The
check reports only what is *still* unnormalised, so once part of the corpus has
been renamed the count is the tail of the work rather than its size. Both `34`
and `10` were written down as "the renames" during this work, from two
different runs of a rule that was narrowed in between, and both were wrong
about the corpus.

**And the reference sweep must read the same map.** A first attempt piped
`git diff --name-status -M` through `awk '{print $2}'`, whose default field
splitting breaks on the spaces *inside the very filenames being renamed* — so
the old-name list came out empty, the sweep matched nothing, and it reported no
dangling references. That is `dh4f` committed by the instrument built to refuse
it. `awk -F'\t'` is the fix; the lesson is that a sweep which finds nothing
must be shown to have had something to look for.

## The one case it refuses

**Two files that normalise to one name.** The fixer reports the collision and
renames neither: picking a winner silently destroys an upload, and an upload is
somebody's source material. Rename one by hand.

That is
[`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md) applied to
a rename — a `git mv` that overwrites is a deletion with a friendlier name.

## What this does NOT cover

- **Directory names.** The check reads files. A directory with a space in it is
  not yet graded, and nothing in the corpus has one.
- **Content.** It reads names and never opens a file, which is why it is
  harness-layer rather than folio-layer in the repo partition.
- **Whether a file should be there at all.** That is ingestion's question, not
  naming's.

## It does not touch a name that has no unsafe character — measured the hard way

The rule replaced unsafe runs **and then collapsed `-+` globally**. That rewrote

```
sec-119-74-broadly--versus-narrowly-focused-key-question.md
```

— a library **section** file containing no unsafe character at all — purely for
its double dash. `gen-library-jsonld` then could not find `prose-sec-119`, and
`sections/sec-119.jsonld` regenerated **without it**: `contains` silently lost
an entry, which is a block missing from the published graph rather than the
reference churn the owner accepted.

Caught by refusing to commit the regeneration: the block file was still on disk
and `main`'s committed copy still listed it, so the generator's new output was
wrong and the committed one right. `gen-library-jsonld --check` on a pristine
`origin/main` worktree exited **0**, which is what established the drift as
mine.

So: **a name with no unsafe character is returned untouched.** Collapsing and
trimming happen only to names that were going to change anyway. A double dash,
a leading dash, a trailing dash — none is this check's business.

That is the same failure as wanting `README.md` lowercased, one step subtler,
and it is why both are pinned by tests rather than by intent.

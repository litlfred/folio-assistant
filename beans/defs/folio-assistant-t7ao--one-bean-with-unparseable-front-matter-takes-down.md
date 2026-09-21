---
# folio-assistant-t7ao
title: One bean with unparseable front matter takes down the whole store, and 92 gates passed over it
status: in-progress
type: bug
priority: high
created_at: 2026-09-21T18:54:30Z
updated_at: 2026-09-21T20:17:47Z
parent: folio-assistant-1xhc
---


Found 2026-09-21, by breaking it. Not a hypothetical: the bad bean was mine,
it was committed, and the full gate set passed over it.

## What happened

`224e0beac8` committed `beans/defs/folio-assistant-sqtq--*.md` whose line 8
was a literal `\1` — an unsubstituted sed backreference where `updated_at:`
belonged. `bun run gates --all` was run on that tree: **92 gates, all green.**
It was pushed as `f59f383`.

The next `beans list` in a fresh shell:

```
Error: loading beans: loading .../folio-assistant-sqtq--*.md:
parsing front matter: yaml: line 8: could not find expected ':'
```

Not "that one bean is unreadable" — **no beans at all**. `list`, `roadmap`
and `prime` all fail the same way, because the CLI loads the store as a unit.

## Why this is worse than an ordinary broken file

`beans prime` is the FIRST command in this repo's cold start, named in the
first line of `AGENTS.md`. So one malformed bean means every agent that
starts after it gets no work plan, in the one command whose whole job is to
hand them one. The failure is total, immediate, and attributable to a file
whose author has already moved on.

And it is silent in exactly the wrong place. 195 open beans, a `check:bean-bodies`
that reads titles, bodies, checklists and blockers — and none of it parses
the front matter as YAML. `check-bean-bodies` catches `folded-title`, which
is a front-matter SHAPE defect, so the gap is not that front matter is
unexamined; it is that it is examined by regex, and a regex over a broken
document does not notice the document is broken.

That is `xom7`: a check that cannot fail is indistinguishable from one that
passes. The store was unreadable and the report said 92/92.

## The fix is small and the gate is cheap

One pass over `beans/defs/*.md`: split the `---` fences, hand the block to
the same YAML parser everything else here uses, and report the file and line
on a throw. It is the check `beans` itself cannot provide, because `beans`
cannot report a file it could not load past.

Three states, as ever: parses, does not parse, or could not be read. The
third fails rather than passing.

## Done when

- [x] a gate parses every bean's front matter as YAML and names the file and
      line when one does not
- [x] it is wired into `code-quality-gates.yml`, so `gates.ts` picks it up —
      a check that is not in the workflow is `sb6z`'s complaint, one level in
- [x] a test that FEEDS IT A BROKEN BEAN and asserts it fails. A gate for
      this defect that has never seen the defect is the defect


---

## Summary of Changes — 2026-09-21

`scripts/check-bean-front-matter.ts`, wired into `code-quality-gates.yml`
**before** `check:bean-bodies`, because it is that gate's precondition: the
checks below it read front matter by regex, and a regex over a broken document
does not notice the document is broken.

The premise was re-verified by breaking it again before anything was written.
One planted bean with a literal `\1`:

```
beans list          -> Error: loading beans: ... yaml: line 7 ...  (no beans at all)
check:bean-bodies   -> exit 0, "no NEW defect"
```

### Two defects, and only one is fatal

Splitting them was the substance of this change, and the first draft got it
wrong. `yaml`'s `uniqueKeys` defaults to **true**, so a plain `parseDocument`
reported two loadable beans as unparseable — a gate **stricter than the thing
it guards**, which would have gone red on day one over beans belonging to
other people.

- **Does not parse** → the gate FAILS. This is what takes the store down.
- **Duplicate keys** → counted and named, never failed. Measured: `beans list`
  loads the live store while two of its beans carry duplicates.

The duplicates are a real defect even so, and worth stating: `scalar()` in
`bean-store-read.ts` regexes out the FIRST occurrence while YAML takes the
LAST. On `1hvo` the two `title:` lines **differ in their text**, so
`check-bean-bodies` and `beans` show different titles for one bean. Left to
their owners, as `check-bean-bodies` says of its own outstanding findings:

- `folio-assistant-1hvo` — duplicate `title:` (line 4), and the two differ
- `folio-assistant-7u3g` — duplicate `updated_at:` (line 10)

### A second gap, found on the way

`readBeanFiles` skips a file whose `---` fences do not match, as "not a bean".
Right for a README, wrong for a bean whose fence was mangled: it vanishes from
every consumer rather than being reported. That is now a finding, with
`README.md` the one documented exception.

### The gate had its own defect twice before it worked

Recorded because it is the same shape as the bug being fixed, and both were
caught only by running it rather than by reading it:

1. `repoRootFor(process.cwd())` answered `/home/user`, so the directory
   resolved outside the repo and the gate reported **"nothing checked", exit
   0** over a store holding a planted broken bean. `check-bean-bodies`
   resolves from the SCRIPT's location; copying that fixed it.
2. `dir === null` and `!existsSync(dir)` were one branch, collapsing
   **not declared** into **declared but absent** — the `dh4f` defect. They are
   two answers now, and the second exits 2.

### Verified

`7 pass, 0 fail` in `scripts/tests/bean-front-matter.test.ts`, every case a
fixture because the live store is loadable and therefore proves none of them.
Falsified in both directions on the real corpus: clean store exits 0 over 629
beans; one planted break exits 1 and names the file and line.

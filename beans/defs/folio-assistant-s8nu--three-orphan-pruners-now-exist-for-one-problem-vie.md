---
# folio-assistant-s8nu
title: Four orphan-selectors now exist for one question — orphanSubjectPages should be the only one
status: in-progress
type: task
created_at: 2026-09-21T05:33:00Z
updated_at: 2026-09-21T06:05:00Z
parent: folio-assistant-vke6
---


Recorded after `ankg` was fixed on main while this branch was fixing it too —
so the count below is measured against main, not against a plan.

## The four

| selector | where | how it decides |
|---|---|---|
| `prunableStickies` | `ensure-landing-sticky.ts` | the candidate parses as the thing it writes |
| `OWNED` | `who-iris/scripts/gen-iris-pages.ts` (#607) | a regex over FILE NAMES this generator emits |
| `orphanSubjectPages` | `gen-schema-viz.ts`, imported by `gen-library-viz.ts` and `gen-docs-auto.ts` | the page declares itself the subject page for *that very directory* |
| `prunableDashboards` | `state-visualizer.ts` ([#642](https://github.com/litlfred/folio-assistant/pull/642)) | an HTML comment naming the generator |

All four are correct. The multiplicity is the defect, and `y90d` predicted it
in advance — *"do not write a fourth"* — then wrote one, because at that
moment the third was not yet importable.

## They are not interchangeable, and that is the substance

`orphanSubjectPages` is the **strongest** of the four: a marker answers *did I
write this*, while naming the directory answers *did I write this HERE*. It
needs no new bytes in the page, and it already catches a page whose `SCOPE`
names some other subject — a case a marker cannot see at all.

`OWNED` is a different problem, not a weaker answer to the same one: `who-iris`
publishes FLAT FILES rather than subject directories, so there is no directory
name for a page to match. Folding it in means generalising the unit from
"directory holding an `index.html`" to "artefact this generator emits", which
is a real design step rather than a rename.

`prunableDashboards` is the one that genuinely cannot take the self-naming
test: dashboards publish at the SITE ROOT among 19 directories nothing here
owns, and their identity is the graph id rather than the path. A marker is the
right answer *there* — the bean is that it should be a parameter of one
selector, not a fourth selector.

## Done when

- [x] `orphanSubjectPages` takes the ownership test as a parameter, with the
      self-naming test as its default, so a marker-based one is expressible
- [ ] `prunableDashboards` and `prunableStickies` are call sites of it, with
      their existing tests kept as the falsification — they must still fail on
      directory-selection and on an emptied keep-set
- [ ] a ruling recorded on whether `OWNED`'s flat-file case is in scope, since
      generalising the unit is the expensive half
- [x] nothing names a fifth

## Not in scope

Changing a marker already committed to a published page. A marker is read off
files that exist; changing it strands every page written before the change,
which is this same defect one level up.

## A correction this bean is the record of

An earlier revision of this bean, and the first draft of
[#647](https://github.com/litlfred/folio-assistant/pull/647), asserted that
`ankg`'s cited precedent did not exist — *"#607 says it built pruning in
`gen-iris-pages.ts`; that file has no such code"*. **That was wrong.** `OWNED`
is at `who-iris/scripts/gen-iris-pages.ts:104` and the prune runs at 1575–1601.

The check was run against a tree that predated #607's merge (`0b312164`), and
"not present in my checkout" was reported as "does not exist". A `git show
origin/main:<path>` would have settled it in one command. Recorded rather than
quietly deleted, because the failure mode — grepping a stale base and
publishing the absence as a finding — is the same class as the `b963`
mis-citations it was accusing.


## Unblocked — 2026-09-21

[#642](https://github.com/litlfred/folio-assistant/pull/642) merged as
`05dfdbef`, so `prunableDashboards` is on main and all four selectors are now
in one tree. The reason this bean was reported rather than done — editing
another session's in-flight file — no longer holds.

One question still goes to the owner before the work starts, and it is the
expensive half rather than a detail: **is `OWNED`'s flat-file case in scope?**
Folding the other three together is a parameterisation. Folding `OWNED` in
means generalising the unit from *directory holding an `index.html`* to
*artefact this generator emits*, which changes the shape of the selector for
every caller, not just for `who-iris`.


## BEING DONE IN #648 — do not start it, and the scope question is answered

Checked before starting, which is the discipline this session learned the hard
way four times over: [#648](https://github.com/litlfred/folio-assistant/pull/648)
(`claude/determined-euler-gqhkk0`) is already doing this.

### Their design, read rather than assumed

`orphanSubjectPages` gains a parameter:

```ts
export type OwnerReader = (html: string) => string | undefined;
const scopeOwner: OwnerReader = (html) => SCOPE_LINE.exec(html)?.[1];
```

with `readOwner: OwnerReader = scopeOwner` defaulted, so every existing caller
is unchanged and `state-visualizer` passes a `dashboardOwner` that reads its
`GENERATED_BY` comment instead. That is the parameterisation this bean's first
*done when* asks for, arrived at independently.

### The three-vs-four question is settled, and by evidence rather than a ruling

This bean asked the owner whether `OWNED`'s flat-file case was in scope, and
recommended **three**. #648 folds **three** and leaves `OWNED` alone —
`gen-iris-pages.ts` is edited there but is NOT a call site, and `OWNED` is
still its own regex at line 104.

Their code shows WHY, structurally, better than this bean's prose did. The
loop is still:

```ts
if (!e.isDirectory() || keep.has(e.name)) continue;
const page = join(parentPageDir, e.name, "index.html");
```

The unit is *a directory holding an `index.html`*, baked into both the
`isDirectory()` filter and the hardcoded join. `who-iris` publishes
`item-*.html` and `collection-*.html` **flat**, so it cannot be a call site
without changing that unit — which is exactly the "real design step rather
than a rename" this bean recorded. The `OwnerReader` abstracts how ownership
is READ; it does not abstract what an artefact IS.

### What is left for this bean

Nothing to build. It stays open only until #648 merges, then closes against
that PR — this bean's remaining *done when* boxes are its acceptance criteria,
not a second implementation. **A fifth selector is still the thing to avoid**,
and after #648 the answer for a new generator is: import
`orphanSubjectPages` and pass an `OwnerReader`.

## 2026-09-22 — unified the two that share a UNIT; the other two need the ruling

`bun run gates` **112/112**, `bunx playwright test` **427 passed**.

### The bean groups by the wrong axis, and that is the finding

It proposes the ownership **test** as the parameter and expects all four to
become call sites. The deeper difference is the **unit**:

| | unit | ownership test |
|---|---|---|
| `orphanSubjectPages` | directory + `index.html` | `SCOPE == dirname` |
| `prunableDashboards` | directory + `index.html` | marker in file |
| `prunableStickies` | a flat `.json` **file** | parses as `LandingSticky` |
| `OWNED*` | flat filenames | regex |

This bean already says generalising the unit for `OWNED` is *"a real design
step rather than a rename"* — and does not notice **`prunableStickies` sits
on the same side of that line.** So it belongs with `OWNED` behind the ruling
below, not with the two unified here.

### It is six selectors, not four

`who-iris` carries `OWNED`, `OWNED_LIB` **and** `OWNED_DOCS`. The same
understatement as `u9r9` (8 occurrences, not 2) and `alox` (11 selectors, not
4) — three beans in one session whose counts were low.

### Both sides gained a rule they did not have

This is the argument for merging, beyond one fewer function:

- **`prunableDashboards` gained `foreign`.** It dropped a non-owned directory
  silently, so a page it did not recognise and a directory it had examined
  and cleared looked identical.
- **`orphanSubjectPages` gained *unreadable is not ours*.** It called
  `readFileSync` bare and would have **thrown** — a generator aborting over
  one unreadable page rather than declining it.

Neither behaviour was invented; each came from the other side.

### Extracted as a LEAF, for the reason #840 established

`scripts/orphan-pages.ts`, so `state-visualizer.ts` can call it without
importing `gen-schema-viz.ts` — a 1200-line generator whose body is one
template literal. `gen-schema-viz.ts` re-exports it, so the three existing
importers are untouched. `SCOPE_LINE` moved with the function that reads it
rather than being left behind as a constant nothing used.

### Falsified, and the bean's own falsification kept

Replacing the ownership test with *"select on the directory"* fails **5** of
the callers' existing tests; restored, 0. Those suites are unchanged, which
is what the bean asked for. Eleven new tests cover the parameterisation and
both carried rules.

**Two of my own test defects, caught by the tests themselves:**

1. The fixture put `var SCOPE = "x";` inside a one-line `<script>`. `SCOPE_LINE`
   is anchored `/^…$/m`, so five tests failed — the helper was wrong, not the
   selector.
2. The unreadable case first used `chmod 000` and then branched on *"unless we
   are root"* — **and this suite runs as root**, so the branch that fires is
   the one that skips the assertion. A test that skips itself in the
   environment it actually runs in is the `dh4f` shape. Forced with `EISDIR`
   instead, which is raised for everyone.

## Still open — one ruling, and it is the expensive half

- [ ] **Is `OWNED`'s flat-file case in scope, and `prunableStickies` with it?**
      Both select flat FILES rather than subject directories, so folding them
      in means generalising the unit from *"directory holding an `index.html`"*
      to *"artefact this generator emits"*. That is a design step, not a
      rename, and it is the owner's call. Until then the count is **three
      mechanisms, not one** — which is better than four and is not done.

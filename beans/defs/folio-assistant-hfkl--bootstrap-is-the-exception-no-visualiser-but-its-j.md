---
# folio-assistant-hfkl
title: 'BOOTSTRAP IS THE EXCEPTION: no visualiser, but its .json/.jsonld IS its existence — and it needs a render/ subgraph'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T14:28:23Z
updated_at: 2026-09-20T15:37:22Z
parent: folio-assistant-vke6
---

Owner, 2026-09-20, verbatim — quoted rather than paraphrased because it
RESOLVES an open conflict and a paraphrase of the resolution would be a second
answer free to drift:

> boostrap  should have cabootstreap/render or so already (maybe in wrong
> place) as subgraph of skill related to renering .jsonld/.json.   that should
> be in bootstrap=navbar footer.    it is exception to harness/layer not having
> visualtion/workflow visualizer.  but it must have its json/jsonld... that is
> its existence.

## What this settles

The [harness-instances docs page](../../cat-harness/docs/architecture/harness-instances.md)
was published with a named, unresolved conflict: `cat-harness-minimum` carries
*"if it produces something a human looks at, it is not the harness"*, which
cannot hold literally alongside *"an instance renders by default"*.

**This is the answer, and it is a floor rather than a reconciliation.**
Bootstrap is the **exception**: it gets no visualiser and no workflow
visualiser, and that is correct rather than a gap. What it MUST have is its
`.json`/`.jsonld` — **"that is its existence"**. A layer that cannot emit its
own graph has not shown it is a graph.

So the requirement tightens as you go up rather than applying flat:

| layer | visualiser | its own JSON/JSON-LD |
|---|---|---|
| `bootstrap` | **exempt** — it is the navbar FOOTER | **required — this is what it means for it to exist** |
| `cat-harness` | builds on bootstrap; from here up the requirements apply | required |
| above | must meet them, because cat-harness supplies folio etc. | required |

That is the same shape `7po1` already records for workflows — bootstrap keeps
the bare minimum, cat-harness elaborates — so this is a second instance of a
rule rather than a new one, and the two should be written down once.

## Measured, 2026-09-20, before claiming anything

- **`bootstrap/skills/` holds `bootstrap-kg-navigation.md`**, and it is about
  **reading** a knowledge graph cold ("assumes a text editor and nothing
  else"). That is the neighbour of what the owner asked for, not the thing:
  the ask is the skills for **rendering** `.jsonld`/`.json`. So "maybe in wrong
  place" is half right — a related skill is there, and the rendering one is not
  anywhere.
- **Bootstrap declares two directories**, `skills/` and `workflows/`, both under
  the `cat-harness` graph kind. There is no `render/`.
- **The artefact is built, not committed.** `kg-export` writes
  `_kg/<stub>.jsonld` (`kg-export.ts:1777`), and `kg-export.ts:1005` already
  names `bootstrap/bootstrap.jsonld` as "a COMMITTED artefact" in a comment.
  Those two disagree, and which one is true decides whether bootstrap's
  existence is checkable from a checkout or only after a build. **Check this
  before building anything** — it may be the whole bean.
- **`check-instance-render` fails the repository root today** with "no directory
  containing .bpmn files was found under .", measured this session. Bootstrap
  itself renders (76 own nodes).

## Done when

- [x] `bootstrap/render/` (or the right name) exists as a declared subgraph
      holding the skills for rendering `.jsonld`/`.json`
- [x] The exemption is written where the QA axis will read it, so `2krx` does
      not raise a finding against bootstrap for having no visualiser
- [x] The `_kg/` vs `bootstrap/bootstrap.jsonld` contradiction above is
      resolved, one way stated — **done 2026-09-20, and it was a stale
      comment rather than a design question.** Both generators exist and
      neither commits anything: `kg-export.ts` writes `_kg/<stub>.jsonld`
      (gitignored, `.gitignore:98`) or wherever `--out` says, and
      `gen-bootstrap-graph.ts` writes `bootstrap/bootstrap.jsonld`, which
      `.gitignore:108` ignores **deliberately** — it was committed once on a
      rationale citing a README step no prose file under `bootstrap/`
      contains, at 52 % of `bootstrap/` by line count. `docs-site.yml:274`
      builds it into the published site instead.

      So `kg-export.ts`'s comment calling it "a COMMITTED artefact ... so its
      staleness gate would fail" was wrong on both halves. The CHOICE it
      defended (a repo-relative path) is right, for a reason that does not
      depend on storage: an absolute path leaks a runner's filesystem layout
      into a **published** document and changes every build. Comment
      corrected. A right choice with a false reason is the worse failure —
      a reader checks the claim, finds no gate, and concludes the constraint
      is imaginary.

      **And the real defect is underneath it: `35kc`.** Bootstrap's graph is
      published to the live site and to NO staging preview, along with every
      namespace document. So on staging, the layer whose existence IS its
      `.json`/`.jsonld` has neither.
- [ ] The docs page's "conflict" section is rewritten as the resolved rule
      resolved, one way stated
- [x] The docs page's "conflict" section is rewritten as the resolved rule


---

## Done, 2026-09-20 — and two of the four boxes were already true

**`bootstrap/render/` exists and is DECLARED**, id `bootstrap-render`,
holding `bootstrap-graph-emission.md` (what the document contains and the
four properties it holds) and `bootstrap-graph-publication.md` (where it
lands, why its `@id` must equal that path, why it is no longer committed) plus
its own `package-manifest.json`. A separate id from `cat-harness`, which
`skills/` already holds — overrides match on id, so reusing it would have
replaced bootstrap's skills with these. `check:instance-render` reports
bootstrap at **81 own nodes**, up from the 76 this bean measured.

**The exemption is DECLARED DATA, and that was the design decision.** The
obvious shortcut is `if (name === "bootstrap")` in the `2krx` checker,
which states a rule true only for the instance somebody remembered — a
vendored or renamed bootstrap silently reacquires the obligation it was
excused from. So `renderExemption` is a field on the instance declaration
(`schemas/cat-harness.ts`): `of` (a CLOSED set — `visualiser`,
`workflow-visualiser`), `reason`, and `owes`. `isExemptFrom` is what the axis
calls.

**`owes` is REQUIRED by the schema**, and it is the part worth defending. An
exemption with no substitute is a hole, and a list of holes is the silence list
`2krx` says an opt-out must not become. bootstrap is not dropping out of
the requirement — it trades a criterion it could fail quietly for one it
cannot. A test asserts the skill files `owes` names actually exist, so the
field cannot rot into decoration.

**The anti-spread guard is GLOBAL, and it had to be.** `renderExemptionProblems`
takes every instance in the repository rather than one declaration, because
*"only the bottom layer may claim this"* is a fact about the stack that a
per-instance check structurally cannot see. At most one claimant, **not
exactly one** — a repository vendoring no bootstrap has nothing to exempt,
and failing it for that is asking it to declare something to stay green. Wired
into `check:instance-render`, which is the gate it is an exemption FROM.
16 tests, falsified in both directions.

### The `_kg/` contradiction resolved itself before this bean was written

The bean asked which of the two was true and said it *"may be the whole bean"*.
Measured: **neither, any more.** `bootstrap/bootstrap.jsonld` was
committed with a byte-staleness gate; on 2026-09-20 (bean `blv9`) it became a
build artefact published by `docs-site.yml` at
`_site/bootstrap/bootstrap.jsonld`, the gate was removed, and a test
now asserts the inverse — that **no tracked copy exists**. What was left was a
stale comment at `kg-export.ts:1061` still calling it *"a COMMITTED artefact"*,
four days after it stopped being one. Fixed, and the fix records that the
comment's REASON survived its own premise: nothing compares bytes now, but a
leaked absolute build path would ship to readers instead of merely failing CI.
Same constraint, worse failure.

### One measurement in this bean is now false

*"`check-instance-render` fails the repository root today with 'no directory
containing .bpmn files was found under .'"* — it does not. The guard
`dirs.length === 0 && kgDirectories(root).length > 0` landed in the interim, so
an instance declaring no `kg` directory is a determined empty rather than a
failure. All four instances report `rendered`, 0 failed, 0 undetermined.

### The fourth box was already ticked by somebody else

*"The docs page's 'conflict' section is rewritten as the resolved rule"* —
`cat-harness/docs/architecture/harness-instances.md` already carried
§"Where the requirement starts — bootstrap is the exception" with the
floor-that-rises table. Extended rather than rewritten: a subsection now
records that the exemption is declared data, why `owes` is required, and why
the spread guard is global.
---

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — **the bootstrap exception is
narrower than its name.***

Asked as the `goal-review` sweep's single question, the owner ruled REPLACE on
`b5f0` and added, verbatim: *"1 bit should also bootstrap and folio-assistant
configs/instantatioon"*. So `bootstrap/` carries its own config file like
every other instantiation root.

This bean's exception is about a **visualiser** — bootstrap has none, and its
`.json`/`.jsonld` IS its existence. It is not an exemption from the
declaration rule, and "bootstrap is the exception" read as though it were.

**Not edited here** — a sibling's bean, and nothing in its Done-when changes.
The ruling and its cost are on `b5f0`.

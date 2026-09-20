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

- **`cat-bootstrap/skills/` holds `bootstrap-kg-navigation.md`**, and it is about
  **reading** a knowledge graph cold ("assumes a text editor and nothing
  else"). That is the neighbour of what the owner asked for, not the thing:
  the ask is the skills for **rendering** `.jsonld`/`.json`. So "maybe in wrong
  place" is half right — a related skill is there, and the rendering one is not
  anywhere.
- **Bootstrap declares two directories**, `skills/` and `workflows/`, both under
  the `cat-harness` graph kind. There is no `render/`.
- **The artefact is built, not committed.** `kg-export` writes
  `_kg/<stub>.jsonld` (`kg-export.ts:1777`), and `kg-export.ts:1005` already
  names `cat-bootstrap/cat-bootstrap.jsonld` as "a COMMITTED artefact" in a comment.
  Those two disagree, and which one is true decides whether bootstrap's
  existence is checkable from a checkout or only after a build. **Check this
  before building anything** — it may be the whole bean.
- **`check-instance-render` fails the repository root today** with "no directory
  containing .bpmn files was found under .", measured this session. Bootstrap
  itself renders (76 own nodes).

## Done when

- [ ] `bootstrap/render/` (or the right name) exists as a declared subgraph
      holding the skills for rendering `.jsonld`/`.json`
- [ ] The exemption is written where the QA axis will read it, so `2krx` does
      not raise a finding against bootstrap for having no visualiser
- [x] The `_kg/` vs `cat-bootstrap/cat-bootstrap.jsonld` contradiction above is
      resolved, one way stated — **done 2026-09-20, and it was a stale
      comment rather than a design question.** Both generators exist and
      neither commits anything: `kg-export.ts` writes `_kg/<stub>.jsonld`
      (gitignored, `.gitignore:98`) or wherever `--out` says, and
      `gen-bootstrap-graph.ts` writes `cat-bootstrap/cat-bootstrap.jsonld`, which
      `.gitignore:108` ignores **deliberately** — it was committed once on a
      rationale citing a README step no prose file under `cat-bootstrap/`
      contains, at 52 % of `cat-bootstrap/` by line count. `docs-site.yml:274`
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

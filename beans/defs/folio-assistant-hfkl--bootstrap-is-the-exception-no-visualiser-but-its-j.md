---
# folio-assistant-hfkl
title: 'BOOTSTRAP IS THE EXCEPTION: no visualiser, but its .json/.jsonld IS its existence — and it needs a render/ subgraph'
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:28:23Z
updated_at: 2026-09-20T15:09:14Z
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
- [ ] The `_kg/` vs `cat-bootstrap/cat-bootstrap.jsonld` contradiction above is
      resolved, one way stated
- [ ] The docs page's "conflict" section is rewritten as the resolved rule

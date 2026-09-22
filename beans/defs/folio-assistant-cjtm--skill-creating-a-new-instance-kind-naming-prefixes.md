---
# folio-assistant-cjtm
title: 'SKILL: creating a new instance KIND — naming, prefixes, and repointing bootstrap/README.md'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:45:37Z
updated_at: 2026-09-21T07:54:06Z
parent: folio-assistant-yj32
blocking:
    - folio-assistant-jbx2
    - folio-assistant-v1hw
    - folio-assistant-x4a6
---


Owner, 2026-09-20, across several messages while PR #477 was merging. Every
line below is theirs; the grouping is mine.

## The prefix families

> cat- prefix does not extend to folio-assistant-*

> also who- prefixs, and litlfred- prefix

So a prefix names the LAYER or the OWNER an instance belongs to, and the
families in this repository today are:

| prefix | what it marks | instances here |
|---|---|---|
| `cat-` | the agentic-harness layer | `cat-harness`, `bootstrap` |
| `folio-assistant-` | the content/core layer | `folio-assistant-core` |
| `who-` | WHO material | `who-iris`, `who-style-guide` |
| `litlfred-` | the owner's own | — none yet |

**This settled a live merge conflict**, which is why it is worth recording
rather than inferring later: `main` had renamed the core instance to
`folio-assist-core` while this branch carried `folio-assistant-core`, and the
ruling above decided it — the `cat-` prefix reaches the harness layer
(`bootstrap` -> `bootstrap`, which was taken from main) and stops there.

## Renaming is a choice, and not renaming is also a choice

> qou should really be litlfred-qou or folio-assitant-qou, but i decided not to

> (default is to keep the name of the instance kind, but can rename)

Two rules in those two lines, and they point opposite ways on purpose:

1. **The default is to KEEP the instance kind's name.** A new instance of a
   kind inherits that kind's name unless somebody chooses otherwise.
2. **The owner may decline the convention**, and `qou` is the worked example —
   it would be `litlfred-qou` by the rule above and it is not, by decision.

A skill that presents (1) as mandatory would have renamed `qou`. The
convention is a default with a documented override, which is a different
thing from a rule.

## The concrete defect to fix as part of this

> bean also bootsreap/README.md refernces cat-harness.md. cat-harness docs
> should give instructions to change that file to point to something other
> can ca-harness, for example their new instance kind, if they want to.

`bootstrap/README.md` points at `cat-harness.md`. That is right for THIS
repository and wrong for anybody bootstrapping a new instance kind of their
own: they get a README aimed at a harness they are not using.

So `cat-harness`'s own documentation has to say how to repoint it — the file
is part of what a new instance inherits, and nothing currently tells its new
owner it is theirs to change.

## Done when

- [ ] A skill for **creating a new instance kind**, reachable by
      `skill_fetch`, covering: choosing the prefix family, the keep-the-kind's-name
      default and how to override it, what a new kind must declare in
      `harness.json`, and which inherited files are the new owner's to edit.
- [ ] `cat-harness` documentation names `bootstrap/README.md` as one of
      those files, with the instruction to repoint it.
- [ ] The prefix table above lives in the skill, not only in this bean — a
      rule with no home is the failure `AGENTS.md` opens by warning about.
- [ ] `qou` is the worked example of declining the convention, so the next
      reader does not "fix" it.

## Not a rename of anything existing

Nothing here asks for `folio-assist-sci` -> `folio-assistant-sci` or for `qou`
to move. The owner has decided `qou` stays; `folio-assist-sci` has not been
raised and is NOT assumed. This bean is about the SKILL and the one README
pointer.

## Connected to the harness kinds already queued

Owner: *"connect to skills/bean on requiments for new harnance kinds
(visualizer, docs)"*.

Three beans already describe harness kinds that do not exist yet, and each is
a CONSUMER of this skill rather than a separate piece of work:

| bean | the kind it needs |
|---|---|
| `jbx2` | **visualiser** — `library/` as something you can look at |
| `v1hw` | **visualiser** — `uploads/`, the uningested queue |
| `x4a6` | **docs** — declaring `docs/` as the instance's renderable graph |

They are the requirements, and this bean is the recipe. Doing either first in
isolation produces the wrong thing: write the skill with no kind in hand and
it generalises from nothing; build a visualiser kind without the skill and its
naming, its declaration and its inherited files are decided ad hoc and become
the precedent.

So the order is: draft the skill AGAINST `jbx2`/`v1hw` as the worked example
— a `visualiser` kind is a real new kind, and whether it takes a prefix at
all is exactly the question the skill has to answer — then generalise, then
let `x4a6` be the second instance that tests whether the generalisation held.

**What a new KIND has to declare is the part none of the four settles today.**
A kind answers two questions (`renderable`, and `holds`: content / context /
state — see `content-context-and-state-graphs`), and a visualiser is the first
kind where the answer is not obvious: it RENDERS, and what it renders is
another graph's content rather than its own.

---

## Built 2026-09-21 — issue #672

`skills/folio-core/instance-kinds.md`, reachable by `skill_fetch`; registered in
`folio-core`'s `package-manifest.json`; published at
`docs/reference/skill-instructions/instance-kinds.html`. All four KG-QA criteria
pass, 79 gates green.

### Two corrections to this bean, recorded rather than quietly worked around

**1. There is no `cat-harness.md`.** The §"concrete defect" above says
`bootstrap/README.md` references it. No file of that name exists anywhere in the
repo. What `bootstrap/README.md` actually does is resolve **13 links into
`../cat-harness/`** across **6 distinct files** — `dak-blocks.ts` ×5,
`role-graph.ts` ×3, `cat-harness.ts` ×2, `skill-package.ts`, `tool.ts`,
`processes`. Every one is a TERM DEFINITION. The owner's point holds
exactly as stated; the artefact is a link family rather than one filename, so
the instruction written into
`cat-harness/docs/bootstrap/initialization.md` is to repoint the family and
keep the user-scenario structure, not to swap a filename.

**2. A visualiser is not a new graph kind, so the hard case this bean names
does not arise.** §"What a new KIND has to declare" expects `visualiser` to be
the first kind where `renderable` / `holds` is not obvious. Two measurements say
otherwise:

- `coverage.visualiser` is a rendered PATH — every value in the corpus has the
  shape `cat-harness/docs/cat-harness/<graph>/<instance>/index.html`. It names
  an artefact, as `coverage.docs` does.
- `v1hw` records the owner's own placement rule: *"the visualiser lives as a
  tool in the harness that DEFINES the schema, declared in `skills`/`tools`."*

So a visualiser is a **Tool node** in the existing `tools` graph emitting a
**page** in the existing `docs`/`folio` graph. Two kinds that already exist,
composed; nothing to register. That inverted the skill's most useful content:
its opening section is now the test that usually says **"this is not a new
graph kind"**, because a registry value is cheap to add and expensive to
remove, and the failure mode is silent.

### A defect found in the file a new-kind author reads

`GraphLayer` gained a FOURTH value, `derived`, in `1861cd0e` (bean `hqku`,
*"library/ is derived, not content"*). Two docstrings in
`schemas/cat-harness.ts` were never updated:

| | said | now |
|---|---|---|
| the `GraphLayer` docstring | *"Three values and no fourth."* | four, with `derived` defined |
| `GraphKindDef.holds` | three bullets, `derived` absent | four bullets |

`content-context-and-state-graphs.md` already knew (7 mentions, a dedicated
section), so this is the `AGENTS.md` rule applied literally — *where a skill and
a non-skill copy disagree, the skill wins and the copy is wrong*. Both corrected
here.

### What this unblocks, and how the finding changes it

| bean | was waiting for | what it now gets |
|---|---|---|
| `jbx2` | the `visualiser` kind's recipe | **there is no kind to add** — a Tool + a page, both existing kinds |
| `v1hw` | same | same, and its own placement rule is what settled it |
| `x4a6` | what `docs/` should be declared as | `docs` is now a REAL renderable kind in `defaultGraphKinds` (added 2026-09-20) — the `folio`-registers-by-core blocker this bean recorded no longer applies |

`x4a6`'s body still describes the old blocker and should be re-measured by
whoever picks it up; not edited here, because it is another bean's body.

### Measured while writing, worth keeping

**Four of the eleven instances carry no prefix at all** — `agent-skills`,
`detangle`, `kg-navigation`, `large-datasets`. The skill states this as the
state of the corpus and explicitly NOT as a backlog: an unprefixed name is
undecided, not wrong, and a rename is the one act whose consequences cannot be
undone.

### Not done

Closing waits on the merge of the PR for #672. No renames were made or
proposed.

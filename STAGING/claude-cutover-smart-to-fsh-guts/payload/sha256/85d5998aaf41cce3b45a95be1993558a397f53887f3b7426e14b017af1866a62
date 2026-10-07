---
# folio-assistant-esz4
title: Every special branch carries a README declaring what it is, how and when it was generated — and it is KG, not just prose
status: todo
type: feature
created_at: 2026-10-03T08:19:43Z
updated_at: 2026-10-03T08:19:43Z
parent: folio-assistant-fs43
---


Owner, 2026-10-03: *"make sure each of the special branches has a read me file
explaining what they are how they are generated when they were generated, etc.
like cat/cat-harness/beans branch. that should be in KG too"*.

## Measured state, 2026-10-03

`special-branches.json` on `main` declares **8** entries. Five exist as
`cat/<harness>/<name>` heads on the remote:

| branch | README |
|---|---|
| `cat/cat-harness/beans` | yes — the model the owner cites |
| `cat/cat-harness/fsh-guts` | yes |
| `cat/cat-harness/state` | yes |
| `cat/cat-harness/todos` | yes |
| `cat/cat-harness/qa-reports` | **NONE** |

The other three declared entries are not single branches: `gh-pages` (a
different kind, Pages output), and `cat-lake-cache/` and
`cat/fhir-harness/fhir-ast/` — trailing-slash **prefixes**, so they name a
family of branches rather than one head. What a README means for a prefix is
part of the design, not an oversight to paper over: either each member carries
one, or the family's declaration does.

## What the model actually establishes

`cat/cat-harness/beans`'s README is the bar, and reading it is how to see what
the others owe. It carries, in order: what the branch IS and which subgraph it
holds; that it is an **orphan branch, never merged into `main`**; the naming
convention with the owner's ruling quoted verbatim; its siblings; the arc and
issue (`fs43`, #1850) and the proposal path; a **status** line — *"SEED, not
authoritative"* — saying `main` is still the source of truth and edits here are
read by nothing; its **provenance**, `Copied from main@128b2ec4408a`; and the
write discipline, *"Writes splice onto the tip and never force-push."*

Note which of those are facts a reader cannot recover from the branch itself:
the status, the provenance sha, and the write discipline. A branch with no
README does not merely lack an introduction — **it cannot be told from an
abandoned one**, which is the same defect as a `scrapped` bean with no reasons.

The four existing READMEs are not uniform. `state`'s title is
`# state — process-written knowledge-graph state` while the other three lead
with the full branch path. Convergence is part of this bean, but the headings
are the symptom; the fields are the contract.

## "In KG too" — the part that makes this more than four files

The owner's last clause is the substantive requirement. A README is prose, and
prose is what `directory-conventions` says a declaration must not be: four
hand-written files are four things free to drift from each other and from
`special-branches.json`, which already declares `name`, `writers` and
`mirrors`. The fields above are **node data**, and the README should be a
RENDERING of them, the way `readme-sections.ts` renders a folio README from the
graph rather than asking a person to keep it current.

So the shape to settle before writing any prose: a special branch is a declared
node with `kind`, `status` (seed / authoritative / mirror), `generatedFrom`
(the sha), `generatedAt`, `writers`, and `writeDiscipline` — and the README is
emitted from it, with a `:check` so a hand-edit is caught. `special-branches.json`
is the obvious home, since it already declares three of those fields.

## Done when

- [ ] The field set is settled and declared in a schema, not in prose
- [ ] **Declared per-harness, never centralised.** The owner's words, 2026-10-03:
      *"each harness declares it, (and each instance can also declare), why
      centralize?"* — so the harness that WRITES a branch declares it, an
      instance may declare its own, and no entry for a branch lives anywhere
      but with its writer. A reviewer should be able to reject a patch that
      adds a branch to a shared table on this line alone.
- [ ] `cat/cat-harness/qa-reports` has a README — the one branch with none
- [ ] All five READMEs are GENERATED from the declaration, not hand-kept
- [ ] A `:check` fails when a declared branch's README is absent or stale
- [ ] The prefix entries (`cat-lake-cache/`, `cat/fhir-harness/fhir-ast/`) have
      a stated answer: per-member README, or one for the family
- [ ] The declaration is reachable as KG — `skill_list`/`skill_fetch`-style, or
      a declared graph kind — so an agent can ask what a branch is without
      fetching it

## Not decided here

Whether `gh-pages` is in scope. It is declared in the same file but it is
Pages output rather than a `cat/` subgraph, and giving it a seed/provenance
status would be inventing a fact. Flagging it rather than assuming.

Writing the four conforming READMEs by hand would satisfy the owner's first
sentence and defeat the second. The generator comes first.

## Where the declaration lives: see `rva2`. NOT `special-branches.json`.

Owner, 2026-10-03: *"no special-branches.json...."*, then *"see bean. thats
deprecated"* — correcting an agent that had read a one-word message as
confirming that file.

**`rva2` already settled this and carries the argument; it is not restated
here.** It records the owner's ruling — *per-harness and per-instance, never
one central table* — with three measurements, the decisive one being that the
central table declares branches which exist in **other repositories** and so
cannot be verified where it lives. `special-branches.json`'s own `$comment`
calls itself INTERIM and names `rva2` as where it folds in.

**What that means for THIS bean:** the README generator needs a declaration to
render from, and the declaration is `rva2`'s to place. So this bean is
**sequenced behind `rva2`**, not blocked by it — the field set, the prose
contract and the `qa-reports` gap can all be settled first, and only the
generator's input path waits. Writing a generator against the deprecated file
would be work thrown away twice: once when `rva2` moves the declaration, and
once when the legacy names go (`oycs`).

### What the agent got wrong, kept because the next reader will be tempted too

`special-branches.json` *looks* like the obvious home — it already carries
`name`, `writers` and `mirrors`, so half the fields are there and adding the
rest reads as tidying. That pull is what turned an ambiguous message into a
false ruling attributed to the owner. Two guards that would have caught it:
the file describes its own role as interim, and `rva2` — which this same agent
had appended the owner's ruling to earlier the same day — already said not to
centralise. **A file being where the data currently sits is not an argument for
it being where the data belongs**, and an agent's own earlier record is
evidence it is obliged to re-read before quoting the owner.

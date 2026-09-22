---
layout: default
title: 'Swimlane Glossary'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/swimlane-glossary.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/swimlane-glossary.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/swimlane-glossary.md){: .fa-edit-source }

{% raw %}
# Swimlane Glossary Skill

## Role

Extract the personas an instance's BPMN diagrams put in swimlanes as a
SKOS concept scheme, and keep the retirement ledger that lets a dropped
term be told from an accident. Issue #596, bean `lqo9` slice 2.

**Not the paper glossary.** [`glossary-build`](glossary-build.md) walks a
paper's blocks and writes a LaTeX chapter from `defines[]`. This walks a
knowledge graph and writes JSON-LD. Different corpus, different output,
different consumer — and there is a live ruling on whether they ever
converge, so do not merge them on your own initiative.

## When to invoke

- A user mentions: swimlane glossary, defined-terms index, SKOS concepts,
  `glossary-export`, the glossary ledger, retiring a term.
- After adding, renaming or removing a role in an instance's
  `skills/roles/roles.json`, or a lane in any `.bpmn` under it.
- Before believing any count of "how many terms does this repository
  define" — the generator's report is the answer, never a number in prose.

## Tools

| Command | Purpose |
|---|---|
| `bun run glossary:export` | Build cat-harness's glossary → `_kg/`, and refresh its ledger |
| `bun run glossary:export:bootstrap` | The same for bootstrap, as a SECOND RUN |
| `bun run glossary:check` | CI gate — non-zero if the committed ledger is stale |
| `bun run glossary:check:bootstrap` | The same for bootstrap |

## A concept is a ROLE, not a lane name

This is the rule most likely to be got wrong, because the issue's own
wording (*"a bpmn diagram swimlane has title/description"*) points the
other way. Measured over the corpus, 2026-09-21:

| | |
|---|---|
| task-containing lanes | 157 |
| distinct lane names | 85 |
| distinct roles those names resolve to | **36** |

`build-pipeline` is named ten ways — *"CI/CD Pipeline"*, *"Scheduled log
sweep"*, *"Graph audit (system)"*, six more. A concept per lane name
mints 85 terms for 36 meanings and copies one authored definition onto
ten of them, which is `roles.json` duplicated with a QA gate holding it
in place.

The ten names are `skos:altLabel`. That is what `altLabel` is for, and it
is what makes *"Reviewer / SME"* findable as the same term as
*"Reviewer"* rather than a rival entry.

## Three predicates, three sources, and each answers a different question

| SKOS | source | answers |
|---|---|---|
| `prefLabel` | the **role's** `title` | what is this called |
| `altLabel` | every distinct lane name binding it | what else is it called |
| `definition` | the **role's** `description` | who is this persona, everywhere |
| `scopeNote` | the lane's `<bpmn:documentation>` | what is this lane accountable for **in this process** |

## `scopeNote` goes on the USAGE, never on the concept

Of the 26 lane names appearing in more than one diagram, **26 of 26**
carry different documentation per occurrence — zero counter-examples.
That is the text doing its job. Hanging ten unattributed notes off one
concept asserts ten apparent contradictions about one word.

So each appearance is a `LaneUsage` node carrying the process, the label
that process gave the lane, and the note.

**The note is stored VERBATIM, and that is not a style preference.** Lane
documentation is extracted to `.pot` as its own msgid, so a note stored
exactly as the diagram wrote it already has a translation slot in every
locale. Wrapping it — `In "<process>": <note>` — reads well in English
and produces a string no catalogue contains.

## Never mint a second name for one thing

A concept's `@id` is the IRI `kg-export` already mints for that role
(`makeIri(docIri, "role", id)`), imported rather than re-spelled. The
graph's `performedBy` links point at exactly those IRIs; a parallel
`cat:reviewer` would leave the glossary unjoinable with the graph it
describes.

## The ledger is the memory, and it is the only durable part

The document is derived and rebuilt every run, so it has no memory:
delete a role and its concept simply stops appearing, which is what
*"never existed"* also looks like. Retirement and accident must not look
alike ([`deletion-requires-confirmation`](deletion-requires-confirmation.md)),
so the one non-derivable fact — **this term was once minted** — is
committed at `<instance>/glossary/glossary-ledger.json`, declared as
graph kind `glossary` (`holds: "state"`).

Three rules for it:

1. **Keyed on the IRI's local part**, never the absolute IRI. The
   publication base is a deploy-time variable; a stored absolute IRI
   would rot the day it moved and take every retirement record with it.
2. **An already-retired term keeps its own `retiredOn`.** Re-stamping it
   erases when the term actually went.
3. **A term that comes back is un-retired**, and reported. Leaving the
   flag on reports a live term as gone for ever.

**Usages are not ledgered**, deliberately: a usage is an occurrence,
regenerated wholesale, while a concept is a term somebody may have cited.
Ledgering 157 occurrences buries the records that matter.

## Run it once per instance — never widen the scan

`--instance <root>`, the shape `kg-export` and `translate-bpmn` already
use. Widening cat-harness's scan to reach bootstrap's diagrams
re-introduces the leak `instance-graph-isolation.test.ts` exists to stop
(`7u3g`), which two earlier sessions walked into.

## What it reports and never acts on

- **Declared roles no swimlane draws.** They are still concepts —
  omitting them would be `dh4f`, a glossary silently short of the
  vocabulary it claims to index.
- **A lane binding naming a lane no diagram contains** (`fd6i`). Distinct
  from a role whose lane exists but holds no task, which is not a defect:
  an `actedUpon` lane holds none by construction.
- **A lane whose binding is dangling, contradictory or unbound.**

A lane declaring `<folio:role variable="true"/>` is none of these. It
emits a concept with a scope note and **no definition**, which is true —
see [`role-model`](role-model.md) and bean `ug4r`. `laneBinding()` is the
only route from a lane to a concept for exactly this reason: `variable`
must never be reachable as `unbound`.

## Related

- [`glossary-build`](glossary-build.md) — the paper glossary, a different
  mechanism on a different corpus.
- [`role-model`](role-model.md) — what a role is, and why `actedUpon`
  means a reader must not be told `Corpus` is a persona.
- [`directory-conventions`](directory-conventions.md) — why the ledger's
  directory is declared rather than hidden.
- [`deletion-requires-confirmation`](deletion-requires-confirmation.md) —
  the rule retirement implements.
{% endraw %}

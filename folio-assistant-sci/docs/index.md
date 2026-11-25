---
title: "folio-assistant-sci"
description: "Scientific source material used by folios that formalise mathematics, and the methodologies for formalising it in Lean that this layer adopts from that material."
has_children: false
---

# folio-assistant-sci

Scientific source material used by folios that formalise mathematics, and the
methodologies for formalising it in Lean that this layer adopts from that
material.

## What this layer holds

- **The paper content adapter** (`content-adapters/`, `adapters/paper/`): how a
  paper folio's blocks become LaTeX, PDF and HTML, and how the suggest editor
  checks paper math.
- **Skills** (`skills/`): authoring mathematics in Markdown and LaTeX, Lean
  formalisation and proof review, the proof, rendering and compute audits, and
  the integration watchers that run them on every change.
- **Tools** (`tools/`): one node per command a skill or process calls, such as
  `lean-build`, `lean-cache`, `latex-preflight`, `paper-latex-build` and
  `tex-snippet-validate`, each with its inputs and outputs.
- **Library and methodologies** (`library/`, `methodologies/`): the papers this
  layer reads, and the Lean formalisation methods adopted from three of them.

## Processes

Four BPMN processes say who does what:

- **Authoring a paper.** The author (a person) plans the paper. The authoring
  agent seeds the work plan, scaffolds the folio repository and authors blocks.
  The Lean toolchain role formalises claims in Lean, and the build pipeline
  validates the folio and renders the PDF and HTML.
- **Publish a folio's Lean render.** The doc-gen4 HTML of a folio's Lean
  package, staged under its site with the harness navbar and rail.
- **Formalized Scientific Publication Authoring.** One mathematical result as
  a triple (narrative statement, narrative proof, Lean), checked mechanically
  and then by blind two-way translation and a semantic-equivalence judge. See
  section 10 below.
- **Atomic mass drift check.** Whether `AtomicMass.lean` still matches its data
  table.

Each process has a generated checklist beside it for an agent that walks the
steps by hand.

## Guides

The guide walks the authoring process end to end, from planning the paper to
publishing it.

- [Writing a paper with folio-assistant]({{ '/folio-assistant-sci/guides/writing-a-paper.html' | relative_url }})

---

# A survey: agentic authoring of formalized publications

*For newcomers: what folio-assistant does, how a document is started, which
checks run, which data models it uses, and how this layer extends it to
machine-checked mathematics.*

## 1. The problem

A large language model can draft text quickly. It can also state a false result
fluently, cite a paper that says something else, or let two chapters drift
apart. For policy guidance this is a quality problem. For mathematics it is
fatal, because a published proof is a claim that anyone may check.

folio-assistant treats a publication as a **knowledge graph** of small, typed
units rather than as one long file. Every unit has a declared kind, declared
dependencies and a set of checks. Some checks are programs. Others are agents
that read the unit without seeing who wrote it. The author, human or agent,
works inside that graph, and the graph refuses changes that break it.

## 2. The architecture in one picture

The system is a stack of layers. Each may import from the layers below it and
never from the layers above. The direction is checked
(`bun run cat check:partition:edges`).

| layer | repository | what it owns |
|---|---|---|
| bootstrap | [litlfred/bootstrap](https://github.com/litlfred/bootstrap) | what an agent reads before anything is installed |
| harness | [litlfred/cat-harness](https://github.com/litlfred/cat-harness), [cat-harness-tools](https://github.com/litlfred/cat-harness-tools) | skills, BPMN processes, the work plan (beans), the MCP server, QA sidecars |
| core | [litlfred/folio-assistant-core](https://github.com/litlfred/folio-assistant-core) | the content-object model, block kinds, the `document` adapter, the library and its catalogue |
| **science (this layer)** | [litlfred/folio-assistant-sci](https://github.com/litlfred/folio-assistant-sci) | the `paper` adapter: Lean-bearing block kinds, LaTeX rendering, witnesses |
| domain | [smart-base](https://github.com/litlfred/smart-base), [fhir-harness](https://github.com/litlfred/fhir-harness), … | WHO SMART Guidelines, FHIR Implementation Guides |

The index repository [litlfred/folio-assistant](https://github.com/litlfred/folio-assistant)
pins one commit of each layer, so a folio always validates against a known
platform.

Three ideas run through every layer.

- **Processes are executable, not illustrations.** Each workflow is a BPMN 2.0
  diagram under `processes/`, and each task in it names the skill an agent
  follows to perform it.
- **Skills are the instructions.** A skill is a Markdown file with front matter.
  An agent asks the graph for the skill list (`skill_list`, `skill_fetch`)
  rather than reading a hard-coded list.
- **Work is recorded.** An active folio keeps its work plan as beans, so a
  later agent can pick up what an earlier one left.

## 3. Starting a document in a new, empty repository

The full guide is [Writing a document](https://litlfred.github.io/folio-assistant/folio-assistant-core/guides/writing-a-document.html). In
short:

```sh
git init
git submodule add https://github.com/litlfred/folio-assistant.git folio-assistant
(cd folio-assistant && bun install)

bun run folio-assistant/scripts/init-folio.ts \
    --type document \
    --title "My Document" \
    --author "A. Author"
```

Use `--type paper` for a mathematics paper (this needs the science layer). If
your agent already has a folio-assistant MCP server connected, you can instead
ask it in plain words to initialise a document folio in the repository.

After scaffolding, the usual loop is:

1. **Plan.** Ask the agent for the chapter and section skeleton
   (skill `document-structure`). It writes the chapter manifests.
2. **Ingest sources.** Drop PDFs into `uploads/`. The agent turns each into a
   library entry (section 7).
3. **Author.** The agent writes blocks one at a time: a manifest, a narrative
   file and, for formal kinds, a Lean file.
4. **Validate.** Mechanical checks run on every change; agentic checks run on
   the changed blocks and their dependents (section 5).
5. **Review and publish.** Each change set becomes one pull request with a
   staging preview. A person merges.

## 4. The data models

| model | what it describes | where |
|---|---|---|
| **block** | one atomic unit: a definition, a theorem, a recommendation, a figure, a paragraph of prose | `block-kinds/*.json` in core, plus the formal kinds (definition, theorem, lemma, …) in this layer |
| **chapter / paper manifest** | the ordered tree of sections over block references | `<chapter>/<chapter>.ts` in each folio |
| **`uses[]` graph** | each block's immediate dependencies; the transitive graph is walked, never written | the block manifest |
| **QA sidecar** | per-block verdicts of every check, keyed to hashes of the files they read, so a stale verdict is detectable | `<block>.qa.json` (schema `block-qa/v1`) |
| **library entry** | an ingested source: PDF, structure, section text, extracted claims | `library/<doc-id>/` |
| **Dublin Core record, catalogue, materialization** | what the source says about itself, which collection it is in, and whether the bytes are held here | [`schemas/dublin-core.ts`](https://github.com/litlfred/folio-assistant-core/blob/main/schemas/dublin-core.ts), [`catalogue.ts`](https://github.com/litlfred/folio-assistant-core/blob/main/schemas/catalogue.ts), [`materialization.ts`](https://github.com/litlfred/folio-assistant-core/blob/main/schemas/materialization.ts) |
| **change set** | what changed between two refs, block by block | [`schemas/changeset.ts`](https://github.com/litlfred/folio-assistant-core/blob/main/schemas/changeset.ts) |
| **review comment** | a reviewer's comment on one block, as a todo with a closed lifecycle | [`schemas/review-comment.ts`](https://github.com/litlfred/folio-assistant-core/blob/main/schemas/review-comment.ts) |
| **witness** | the recorded output of a computation, with the hash of the script that produced it | `*.witness.json` (section 8) |
| **bibliography** | one CSL-JSON file per reference; BibTeX is generated from it | `references/<id>.json` in each folio |

A block's file triple shares one root name:

```
definition-of-x.ts     typed manifest: kind, label, uses[], lean reference
definition-of-x.md     narrative statement and proof, in Markdown with TeX
definition-of-x.lean   formal statement and proof (formal kinds only)
```

## 5. Two kinds of validation: mechanical and agentic

**Mechanical checks** are programs. They are cheap, deterministic and run on
every change. Examples:

- schema validation of every manifest (Zod);
- every `uses[]` reference and cross-reference resolves;
- every defined term is declared once and marked at every use;
- the rendered LaTeX parses, and the math in Markdown renders;
- Lean compiles, and no `sorry` lacks a bibliographic citation;
- a vacuity audit flags theorems that conclude `True`, empty conjecture
  classes and similar ways of passing a check without asserting anything;
- every citation key exists and every DOI resolves;
- witness staleness: a recorded number is flagged when the script that
  produced it changes.

**Agentic checks** are performed by agents following a skill, because the
question needs judgement. Examples:

- semantic equivalence between a Lean statement and its narrative statement
  (section 6);
- a devil's-advocate review that builds the strongest case that a block is
  wrong;
- scholarly voice, definition clarity and expository order;
- whether a cited source actually supports the sentence citing it.

The two kinds meet in the same QA sidecar. An agentic verdict is recorded with
the hashes of the files it read, so it goes stale the moment one of them
changes, exactly like a mechanical verdict. An agent cannot clear its own
finding: findings are cleared by a fresh verdict, by a different reviewer, or
by a person.

## 6. Mathematical results as a triple

In this layer, a mathematical result is not one object but three:

| part | file | checked by |
|---|---|---|
| **narrative statement** | the statement paragraph of `<block>.md` | agent reading, render check |
| **narrative proof** | the proof section of `<block>.md` | agent reading, proof-gap audit |
| **formal statement and proof** | `<block>.lean` | the Lean kernel |

The Lean kernel guarantees only that the formal proof proves the formal
statement. It says nothing about whether that formal statement is the theorem
the narrative claims. A formal statement can be weaker, can quietly assume its
conclusion, or can be about a different object with the same name.

The triple is therefore validated by **blind, two-way agentic translation**:

1. One agent reads only the Lean statement and writes what it says in
   mathematical prose, without seeing the narrative.
2. A second agent reads only the narrative statement and writes what a formal
   statement of it must assert, without seeing the Lean.
3. A third agent judges **semantic equivalence** of each translation against
   the other side's original: same hypotheses, same quantifier order, same
   conclusion, same objects.

Disagreement in either direction is a finding. The narrative proof is checked
against the Lean proof in the same blind way for its logical skeleton, so that
the human-readable argument and the formal one are the same argument, not
merely two routes to the same label.

Three further rules keep the triple honest:

- an unproved step is stated with `sorry` and a citation, never hidden;
- a result that depends on a conjecture either becomes a conjecture or takes
  the conjecture as an explicit hypothesis, visible in the Lean signature;
- a sorry-free proof is not evidence that the statement is the right one, so
  equivalence is checked even when Lean is green.

When a paper is published, every formal block links to its declaration in the
**rendered Lean library** (the doc-gen4 HTML that the skill `lean-html-docs`
builds and stages beside the paper's own site), so a reader can move from the
sentence to the checked code in one click.

## 7. The library: open-access sources inside the knowledge graph

Sources are not a bibliography at the end. They are nodes of the graph.

An open-access paper, book or guideline dropped into `uploads/` is ingested
(processes under [`processes/library/`](https://github.com/litlfred/folio-assistant-core/tree/main/processes/library)) into
`library/<doc-id>/`:

| file | holds |
|---|---|
| the PDF | the bytes, with their checksum |
| `structure.json` | metadata, table of contents, section index |
| `sections/*.md` | the text of each section, searchable by grep |
| `candidates.json` | extracted definitions, theorems and claims, as proposals only |
| a Dublin Core record | what the source says about itself |

The library serves three purposes.

1. **Reference validation.** A citation is checked against the held text, not
   only against its metadata. An agent can confirm that the cited section says
   what the citing sentence claims.
2. **Prior-work search.** Before an agent declares a question open, it searches
   the library as well as the folio. Many "open" results are already settled in
   a paper the project holds.
3. **Formalizing existing papers.** Extracted statements from a held paper can
   be turned into Lean statements, with the paper's narrative as the reference
   side of the triple in section 6. This lets a folio cross-reference results
   from the literature at the formal level, not only by citation.

A source that cannot be held (licence, size) is recorded as `referenced`, with
no bytes. Its state is declared, never assumed (see the three materialization
states in [`README.md`](https://github.com/litlfred/folio-assistant-core/blob/main/README.md)).

## 8. Witnesses: binding computation to mathematics

Some results need computation: a numerical value, an enumeration, a
counterexample search. A computation in a paper folio writes a **witness**
file, which records:

- the values computed, serialized at a declared precision;
- the hash of the producing script, so the witness goes stale when the script
  changes;
- the environment and inputs it ran with.

A block that quotes a number names its witness, and the number in the prose is
read from it rather than typed by hand. This gives a chain from the narrative,
through the witness, to the script that produced it, and where possible to a
Lean statement that pins the same identity exactly. A computation suggests; a
Lean proof establishes. A witness is never cited as the proof of a theorem.

## 9. Keeping mathematics and measurement apart

A scientific paper often contains both theorems and comparisons with
experiment. The two must not mix.

- **Formal blocks contain no empirical inputs.** No measured constant may enter
  a Lean statement or a narrative proof as a hypothesis.
- **Comparison is a separate place.** The point where a model quantity is set
  against a measured one (for example a CODATA value) is a marked comparison
  block, and that is where the empirical claim lives.
- **Fitting is visible.** A quantity chosen to match data, including choosing
  one object from a list because it matches, is labelled as a fit and is never
  presented as a derivation.
- **Approximate equalities say so.** A computed value compared with
  measurement uses ≈, not =.

## 10. The process: Formalized Scientific Publication Authoring

The diagram [`processes/content/formalized-publication-authoring.bpmn`](https://github.com/litlfred/folio-assistant-sci/blob/main/processes/content/formalized-publication-authoring.bpmn)
is this layer's process for one mathematical result, in five lanes: the
author, the authoring agent, the Lean toolchain, the build pipeline (mechanical
checks) and the independent reviewers. Each task names the skill an agent
follows to perform it.

1. The author states the intended result and its sources.
2. The agent searches the folio and the library for prior work. A result
   already proved there is cited, and the process ends.
3. The agent drafts the triple: narrative statement, narrative proof, Lean.
4. The Lean toolchain compiles the block and reports sorry and axioms; the
   build pipeline runs the mechanical checks: schema, references, render,
   vacuity, witnesses.
5. In parallel, one independent agent translates the Lean to prose without
   the narrative, and another translates the narrative to a formal claim
   without the Lean. A judge compares both ways, and an adversarial reviewer
   makes the strongest case that the block is wrong.
6. Any finding returns the block to the agent. If the result cannot be
   closed, it is kept as a conjecture or as a stated, cited gap.
7. When every check is green, the change set goes to a pull request, and the
   author merges.

It complements **Authoring a paper**, which covers the paper as a whole
(planning, the work plan, scaffolding, rendering); this process is the loop
each formal block goes through inside it.

## 11. From guideline authoring to scientific authoring

The same machinery was first built for WHO SMART Guidelines, where a
recommendation in a health-policy document must trace to its evidence, and an
implementation guide must stay consistent with the guideline it implements.
The generalisation is direct:

| SMART Guidelines | scientific publication |
|---|---|
| recommendation | theorem, proposition, definition |
| evidence profile | narrative proof and cited sources |
| computable artefact (FHIR, CQL, DMN) | Lean formalization |
| consistency of guideline and implementation | semantic equivalence of narrative and Lean |
| test data and conformance checks | witnesses and their producing scripts |
| public comment on a draft | contributor feedback and pull-request review |

In both cases the method is the same: break the publication into typed units,
give each unit a machine form and a human form, check that the two say the same
thing, and keep a record that shows which checks ran on which version.

## 12. Worked example and licence

**Worked example.** [litlfred/qou](https://github.com/litlfred/qou), a
mathematics paper, was written with folio-assistant-sci on top of this layer.
It uses every mechanism above: block triples, a Lean library, witnesses, an
ingested library of several hundred papers, and blind equivalence review.

**Licence.** This layer's source code is licensed under the Apache License 2.0
([`LICENSE`](https://github.com/litlfred/folio-assistant-sci/blob/main/LICENSE)) and its prose under Creative Commons Attribution 3.0
([`LICENSE-CONTENT.md`](https://github.com/litlfred/folio-assistant-sci/blob/main/LICENSE-CONTENT.md)).

---
# folio-assistant-d308
title: 'CODE DISPENSATION: 868 code files → 13 Tool nodes, each bound to a BPMN task'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-20T04:08:50Z
updated_at: 2026-09-20T04:33:51Z
parent: folio-assistant-zzmr
---


Owner, 2026-09-20, which is the framing and not a paraphrase of it:

> i dont want platform code. there should be NO code, only skills/tools in the
> KG. the code needs to do something. please analyze and create a table
> categorizing and dispensation options. can be part of large general
> processes for now, writing a paper. associate them to a task in a large
> process as to where where they would be used as part of bpmn(s).

Sibling of `ce65`, which asks the same question from the other side. `ce65`:
**which skills lack a Tool.** This bean: **which code lacks a Tool node to be
reached through.** Neither answers the other, and a Tool is where they meet.

## The headline, and why it is smaller than the file count suggests

**868 code files. 229 of them are loose — and they collapse to 13 groups.**

The 229 are the only ones the owner's rule actually indicts: everything else is
already a knowledge-graph node (225), already reachable as or through a declared
Tool (88), a gate (10), a library with no entry point (25), a test riding with
its subject (242), a one-shot to scrap (17) or host config that no agent names
(32).

And within the 229 there are **72 entry points**, not 229 — a file named by a
`package.json` script or carrying mode 755. The other 157 are already library
code behind one of those. So the dispensation is **13 Tool nodes**, whose
`invoke` names one entry point each and whose siblings become unreachable except
through it. That is the state the owner asked for, and it is thirteen nodes of
work, not eight hundred files of it.

### These figures were re-derived after merging `main`, not carried over

First measured at 864 / 228 / 12 on the pre-merge branch. Merging 30 commits of
`main` changed them, and the guard is what said so — see the finding below.
A count carried across a merge is a count nobody checked.

## The table

Dispensation codes:

| code | meaning |
|---|---|
| **TOOL** | warrants its own Tool node — this is the list to act on |
| **IS** | already reachable as, or through, a declared Tool node |
| **GATE** | a verification gate; one `gates` Tool bound to a validation task |
| **CARRY** | the code **is** a KG node (zod carrier, content object) — already in the graph |
| **LIB** | no entry point; reachable only *behind* a Tool, never named by an agent |
| **SCRAP** | one-shot migration or codemod; archive under confirmation |
| **TEST** | verification of another row; rides with its subject |
| **HOST** | build/runtime host config; not agent-facing |

| group | files | entry pts | dispensation | BPMN process · task | target repo (#223) |
|---|--:|--:|---|---|---|
| Publication & export (site, JSON-LD, previews) | 34 | 19 | **TOOL** | authoring-a-paper · Task_Publish [content-publish] | folio-assist-core (site) / agentic-harness (kg-export) |
| Lean formalisation & proof status | 33 | 16 | **TOOL** | authoring-a-paper · Task_Formalize [lean-formalization] | folio-asst-sci |
| QA sweep & witnesses | 27 | 2 | **TOOL** | content-lifecycle · Task_Test [content-test] | agentic-harness (sidecar infra) / core (checkers) |
| Translation (POT / PO / round-trip QA) | 24 | 5 | **TOOL** | human-translation-workflow · Task_ExtractPOT / Task_InjectPO / Task_RoundTripQA | folio-assist-core |
| Knowledge-graph audit & rendering | 20 | 11 | **TOOL** | review-code · Task_RunNodeAudits · Task_ReviewTool | agentic-harness |
| Content graph & dependency analysis | 19 | 1 | **TOOL** | authoring-a-paper · Task_Validate [content-validate] | folio-assist-core |
| LaTeX / PDF rendering | 16 | 3 | **TOOL** | authoring-a-paper · Task_Render [latex-authoring] | folio-asst-sci |
| Document ingestion (PDF → text → claims) | 15 | 7 | **TOOL** | ingest-extract-structure · Task_ExtractText / Task_Ocr / Task_Candidates | folio-assist-core |
| Block authoring & prose structure | 14 | 1 | **TOOL** | authoring-a-paper · Task_AuthorBlocks [content-author] | folio-assist-core |
| Schema & constraint validation | 12 | 3 | **TOOL** | authoring-a-paper · Task_Validate [content-validate] | folio-assist-core |
| Bibliography, evidence & glossary | 11 | 3 | **TOOL** | evidence-retrieval · Task_L1Sources [document-intake] | folio-assist-core |
| FHIR / IG / DAK build | 3 | 0 | **TOOL** | l3-fhir-pipeline · Task_Sushi · Task_Validate; ig-incremental-build · Task_Cone | smart-base |
| Narrative confirmation queue (human gate) | 1 | 1 | **TOOL** | editing-hci-validation · Task_SmeReview · Task_RecordDecision | folio-assist-core |
| MCP server / routing / adapters | 43 | 2 | **IS** | — (the Tool projection) | agentic-harness |
| Scaffolding & environment setup | 13 | 11 | **IS** | authoring-a-paper · Task_Scaffold; getting-started | agentic-harness |
| Work plan & session coordination | 12 | 12 | **IS** | authoring-a-paper · Task_SeedPlan [todo-manager] | agentic-harness |
| MCP Tool handlers | 12 | 0 | **IS** | — (already Tool nodes) | agentic-harness |
| BPMN engine | 8 | 0 | **IS** | — (runs every process) | agentic-harness |
| CI health, gates & upstream pins | 10 | 10 | **GATE** | code-change-review · Task_RunGates · Task_RunCI; upstream-pin-watch · Task_ReadPins | agentic-harness |
| Doc-page content objects | 133 | 0 | **CARRY** | authoring-a-document · Task_AuthorBlocks | stays — this instance's own folio |
| Schema carrier (zod → JSON Schema / JSON-LD) | 59 | 0 | **CARRY** | authoring-a-paper · Task_Validate | agentic-harness (harness/tool/role) / core (block/content) |
| Skill-adjacent code (in the kg graph) | 23 | 0 | **CARRY** | — (the graph itself) | agentic-harness |
| Translated content objects | 7 | 0 | **CARRY** | human-translation-workflow · Task_InjectPO | stays — this instance's own folio |
| Tool node declarations | 3 | 0 | **CARRY** | — (the graph itself) | every instance declares its own |
| Content-type adapters | 14 | 1 | **LIB** | authoring-a-paper · Task_AuthorBlocks | folio-assist-core |
| Shared library (no entry point) | 11 | 1 | **LIB** | — (behind every Tool) | follows its callers |
| One-shot migration / codemod | 17 | 5 | **SCRAP** | — | — |
| Tests | 242 | 2 | **TEST** | code-change-review · Task_RunGates | follows its subject |
| CI workflow glue | 20 | 1 | **HOST** | code-change-review · Task_RunGates | agentic-harness |
| Deploy / container build | 5 | 4 | **HOST** | authoring-a-paper · Task_Render | folio-asst-sci |
| Docs-site browser JS | 4 | 0 | **HOST** | authoring-a-paper · Task_Publish | agentic-harness |
| Host config | 3 | 0 | **HOST** | — | every instance |


## The finding that validates the categorisation

**Every one of the 12 TOOL groups binds to a `serviceTask` that already
exists.** Not one needed a new BPMN task invented for it.

That is the strongest evidence available that the grouping is real rather than
tidy. The owner's second sentence — *"the code needs to do something"* — is a
falsifiable test, and this is what passing it looks like: if a group of code had
had no task to serve, that code would have had no justification, and the finding
would have been "scrap it", not "give it a Tool". Measured across 216 activities
in 34 diagrams, of which 72 are `serviceTask`.

The thirteenth group is the one that arrived by merge, and it is the single best
piece of evidence on this bean: `main` added `scripts/narratives.ts` on
2026-09-19 — a numbered-selection review queue, built explicitly for the owner's
hand function, agent-facing in every respect — and **it is not a Tool node.**
`grep narrative folio-assistant/tools/*.ts` returns nothing. So this is not
historical debt being tidied; the habit is live, and it produced a new instance
of itself the day before the rule was stated. Its task exists and always did:
`editing-hci-validation · Task_SmeReview` / `Task_RecordDecision`, the human
confirmation gate.

`authoring-a-paper` alone absorbs six of the twelve — Task_Scaffold,
Task_AuthorBlocks, Task_Formalize, Task_Validate, Task_Render, Task_Publish —
which is what the owner meant by *"can be part of large general processes for
now, writing a paper"*. The remaining six land on `ingest-extract-structure`,
`human-translation-workflow`, `l3-fhir-pipeline` / `ig-incremental-build`,
`evidence-retrieval`, `content-lifecycle` and `review-code`.

## The tension in #223 worth stating rather than smoothing

Issue #223 says `agentic-harness` **"doesn't 'Do' anything"**. Yet the BPMN
engine, the MCP server, the gate runner and the work-plan code all land there by
the same issue's own descriptions, and every one of them does something.

The reading that survives: *does nothing* means **carries no subject matter**.
`agentic-harness` runs processes; it never authors content. That is a real
distinction and it is worth writing down, because the literal reading would
argue the BPMN engine out of the only repo it can live in.

## Done when

- [ ] the owner picks a dispensation order (the four options are on #223)
- [ ] each chosen group has a Tool node whose `invoke` names one entry point
- [ ] `satisfies` on each names the skill its BPMN task already refs
- [ ] the 157 non-entry-point files in those groups are reachable only through it
- [ ] `bun run tool-coverage` shows the group's task covered
- [ ] the 17 SCRAP files reported with sizes and ages, and **waited on** —
      never removed on an agent's own initiative
      (`deletion-requires-confirmation`)

## How this was measured, so the number can be re-derived rather than trusted

`git ls-files` filtered to `.ts .tsx .js .mjs .cjs .py .sh .bash`; every file
assigned by an ordered rule set with an **UNCATEGORISED hard failure** rather
than a catch-all bucket. It fired three times: 9 files while the rules were
being written, then 0, then **1 after merging `main`** — and that third firing
is the reason the guard is worth its cost. A catch-all bucket would have
absorbed `scripts/narratives.ts` silently and the thirteenth group would not
exist. Entry points are the union of files named by a `package.json` script (57)
and mode-755 code files (64), 121 distinct. BPMN tasks read from the 34 diagrams directly, not from prose.

**No count here should be quoted from this bean into a second place.** That is
the failure `kg:audit`'s reading rules name, and this bean is exactly the sort of
document that invites it.

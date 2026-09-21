---
consulted: true
---

# Directory conventions — what an instance declares it scans

Every instance carries a **declaration** at its repository root — a `*.json` whose `name` field equals its own filename stem, found with `findDeclarationFile` and never composed from a path. It declares the directories the instance scans for content,
and what **kind of graph** each one holds.

Schema and resolution: `schemas/cat-harness.ts`.

**It is the *harness's* schema, not folio-assistant's.** `agentic-harness` is
the layer that defines Roles, Skills, Tools and these conventions, and every
other instance inherits from it — so an instance need not be a folio-assistant
to carry one. A Tool repo or a Test repo carries the same declaration. Issue
[#223](https://github.com/litlfred/folio-assistant/issues/223), Phase 0.3.

## Why directories rather than a content type

The obvious reading of "an instance holds zero or more content instances" is a
list of instances under one `contentType`. That shape does not survive the
five-repo split, for a reason worth stating once:

**The things `agentic-harness` holds are not folios.** They are Tool
definitions, a knowledge graph of skills and workflows, and a schema graph.
None renders as a document and none has a `contentType` in the
`document | paper` sense. A model that gives every instance a content type
forces the harness to claim one it does not have.

So the general object is **an instance with directories, each holding a
graph**. `folio` is one graph kind among several.

## The graph kinds

The vocabulary is **open**, and split across two layers.

**A kind answers two questions, and only one of them is here.** `renderable`
— does this become a website — is below. The other is what a running process
does with the graph: produces it, reads it, or writes it, and
[`content-context-and-state-graphs`](content-context-and-state-graphs.md) owns
it. **Read it before adding a kind** — `holds` is required, so a kind that has
not decided does not compile.

> ### `kg` was renamed to `cat-harness` (2026-09-19)
>
> Every other harness concept is named for the **layer that defines it** — the
> `CatHarness` declaration, the `cat-harness` instance. `kg` named what the
> graph HOLDS instead, and was the odd one out.
>
> The declaration FILE was a third example until the 2026-09-21 split made it
> `<name>.json`. It is named for the **instance** now, so it argues nothing
> here either way.
>
> **The old spelling still reads, and that is load-bearing rather than
> politeness.** This document says overrides match on the entry's `id`, not
> its `path`, because "matching on path makes two knowledge graphs out of one
> relocation". The same property makes renaming a kind a CROSS-INSTANCE
> breaking change: a downstream instance declaring `graphs: ["kg"]` would
> resolve nothing, and would do so **silently** — scanning, finding nothing,
> reporting a clean run. That is the `dh4f` defect delivered to somebody
> else's repository.
>
> So `GRAPH_KIND_ALIASES` in `schemas/cat-harness.ts` maps `kg` →
> `cat-harness`, resolved once at the registry boundary and nowhere else.
> `resolveGraphKind` reports WHICH spelling was used, so a caller can warn —
> an alias that resolves silently is an alias nobody ever removes.
>
> **A directory `id` of `kg` is untouched.** An id is the instance's own
> handle and must survive a rename of anything else; this repository's own
> declaration moved to `id: "cat-harness"` because it chose to, not because
> it had to.
>
> **The JSON-LD projection canonicalises.** `toJsonLd` emits the type IRI, not
> the spelling, so reading a projection back yields `cat-harness` whatever was
> written. Project-and-read-back is therefore a migration path for an old
> declaration rather than a way to lose information.
>
> Not renamed, deliberately: `kg:audit`, `kg-export`, `kg-qa` sidecars and the
> `kg` QA family. Those are command and file-format names, not the graph kind,
> and churning them would touch hundreds of references for no gain in what a
> declaration MEANS.

**The column is `contents`, not `holds`.** `holds` is the FIELD on
`GraphKindDef`, and it carries the content/context/state layer rather than a
description — one word meaning two things in the same document is a collision
worth one rename. The layer is deliberately **not** a column here: it is
`graphKindsOfLayer()` in
[`content-context-and-state-graphs`](content-context-and-state-graphs.md), and a
hand-maintained copy of it would be free to drift from the registry that
decides it.

| kind | declared by | contents | renderable |
|---|---|---|---|
| `tools` | **harness** | Tool definitions, themselves nodes in the KG | no |
| `cat-harness` | **harness** | the harness layer's own knowledge graph, where a directory holds MORE THAN ONE of its parts — in practice the `["schemas", "cat-harness"]` entries, where it means "a schema IS a knowledge-graph node". Renamed from `kg` on 2026-09-19; `kg` still reads, deprecated. **Not itself deprecated** by the 2026-09-21 split: an alias maps one name to one name, and this would have to become three. A downstream declaration still saying `["cat-harness"]` keeps parsing and keeps being scanned for skills; what it loses is the finer query, which it never had. | no |
| `skills` | **harness**, and any layer | Skill packages — the authored instruction bodies an Actor performs a Task from. A Skill is a **Capability with defined inputs and outputs**, stated generically so it is portable across forges, binaries and machines. Split out of `cat-harness` on 2026-09-21. | no |
| `processes` | **harness**, and any layer | Executable BPMN processes and the DMN tables their gateways compute from. The diagrams are the source of truth rather than illustrations of one. **Where a running instance GOT TO is not here** — that is `workflow-state`, which is `state` rather than `content`. Two questions, two graphs. Split out of `cat-harness` on 2026-09-21. | no |
| `scenarios` | **harness**, and any layer | Actors, the Roles they take on, and the User Stories those Roles serve. Named for what it WILL hold: a Role's `useCases` are free-text strings today, so a User Story cannot be pointed at or traced to the Workflow it justifies — naming the kind now is what gives that gap somewhere to be fixed. Split out of `cat-harness` on 2026-09-21. | no |
| `schemas` | **harness** | schema definitions, self-declared in the smart-base manner | no |
| `methodology` | **harness**, and any layer | judgement methodologies, one sub-graph each — a NAMED, EXTERNAL way of reaching a judgement, adopted whole. `kepner-tregoe` for a decision, `madr` for its record, `dmn` for the computable case, `grade` for certainty of evidence. They are **parallel rather than composable**: which applies is contextual, and blending them gives a house method that cites nobody. A separate kind from `cat-harness` for three properties a skill lacks — extractable (adopted work lifts out with its declaration when the field moves on), referenced rather than inlined (two skills quoting one method is two copies free to drift), and exempt from `skill-is-brief`, since a faithful rendering of an external standard must not be truncated to a house limit. Any layer may declare one: the harness carries the domain-neutral methods, `smart-kg` carries GRADE. Governed by [`methodology-adoption`](methodology-adoption.md). | no |
| `qa` | **harness** | QA witnesses — one `"$schema": "qa-witness/v1"` document per audited subject, in three families (`block`, `kg`, `translation`). The published PROJECTION of a verdict, not the verdict: those live beside their subjects. Generated by `gen-docs-pages`, never hand-edited. Read with the [`qa-witness`](qa-witness.md) skill; shape in `content/pipeline/qa-witness.ts`. | no |
| `health` | **harness** | repository health reports — one `"$schema": "health-report/v1"` document per sweep, carrying each check's three-state verdict, the thresholds it applied and the **basis** each threshold was chosen on. A separate kind from `qa` because the SUBJECT differs, not the producer: a QA verdict judges an artefact this instance produced, a health report judges the instance itself — its size, its publish branch, its work plan. Generated by `test/health/run.ts`; never hand-edited. Shape in `schemas/health-report.ts`. | no |
| `beans` | **harness** | the work plan as a whole (`beans/`); its inner nodes are declared by `beans/beans.json` | no |
| `bean-defs` | **harness** | work items — one Markdown file each, in the layout the `beans` CLI reads. Authored by people and agents. | no |
| `workflow-state` | **harness** | running BPMN instances — one JSON each, `"$schema": "folio-workflow-instance/v1"`. Owned by the interpreter, never hand-edited. | no |
| `todos` | **harness** | human actors' outstanding work as a whole (`todos/`); its inner nodes are declared by `todos/todos.json` | no |
| `boards` | **harness** | boards — one file each, `"$schema": "folio-board/v1"`. A board is a **diagram OF** a folio, not a container of one: it declares what it shows, and a folio with no board is complete. The semantic half of the OMG split the owner named — *"treat it like OMG specs and BPMN layout. relationship first, visualiztion alter."* | no |
| `board-positions` | **harness** | where each note sits on each board — `board-positions.json`, keyed by board then by note id, in board units. The **Diagram Interchange** half: it points at notes and is never pointed back at, which is why a note carries no `x`, `y`, `board` or `position`. `state` rather than `content`, because a running process writes it every time somebody moves a note. | no |
| `todo-items` | **harness** | todo nodes — one file each, `"$schema": "folio-todo/v1"`. Authored by people, and by agents on their behalf. | no |
| `todo-feedback` | **harness** | feedback items — todos raised against a specific block, carrying the submitter's identity. Read by `todo-review`. | no |
| `session-state` | **harness** | a SESSION's context — the acting actor, the instances it has open, the beans it claimed and what it waits on. Distinct from `workflow-state`, which is where ONE instance got to: a session spans processes, and a session with nothing open is the commonest state there is. `actor` is required because nothing else can supply it. **Registered ahead of a directory**: nothing writes one yet, and the state machine that will is bean `3nfv`. Shape in `schemas/session-context.ts`; read with [`session-context`](../workflow/session-context.md). | no |
| `interaction` | **harness** | how a PERSON wants to be asked — committed, read at session start by every agent. `context`: read during a process, never written by one; it changes when a person states a preference. Also `harness.config.json`'s `interaction` key, which defaults here, so the declaration and the config name one place. | no |
| `issue-marks` | **harness** | how far an agent has read an issue — `lastCommentId`, `lastUpdatedAt`, `checkedAt`, one file per issue. **Not the comments**: an id and two timestamps, never a body. Two marks because a comment EDITED after being read keeps its id. Read with [`issue-working`](issue-working.md); shape in `src/issue-watch/seen-comments.ts`. | no |
| `memory` | **harness** | agent memory — durable facts an agent carries between sessions, one `"$schema": "folio-memory/v1"` node each. Read during a process and never written by one; it changes when a human directs an authoring agent. Declared at `memory/`, **repository-scoped** — these are facts about the repository carried by the agents working in it, and `.claude/agents/` sits at the repository root too. They were in `skills/memory/` until 2026-09-20 (bean `07xs`), where the containing kind was `content` and the contents were `context`. | no |
| `waiver` | **harness** | confirmations a person granted **in advance** — one `"$schema": "folio-waiver/v1"` node each, naming one gate class, scoped to a session or a process run, and carrying an expiry. Declared over the **same directory as `memory`**, `memory/`, and told apart from it by that tag rather than by a subdirectory: a directory is a place to look and may hold more than one part of a graph. `context` by the same test as `memory` — a process reads a waiver before a gate fires and no step writes one. Skill: [`confirmation-waiver`](confirmation-waiver.md). | no |
| `fsh-guts` | **harness** | deprecated and throwaway structured content — kept, addressable and exported, and deliberately absent from the site. The destination for anything that would otherwise be deleted. | **no, on purpose** |
| `uploads` | **harness** | the incoming queue — raw files as dropped, before ingestion. NOT L1, and not greppable as corpus. | no |
| `catalogue` | **harness** | a remote catalogue modelled BY REFERENCE — communities, collections and items of a corpus the instance does not hold. Every node declares whether its bytes are here (`materialized`), elsewhere (`referenced`) or unestablished (`unknown`), and there is **no default**. Distinct from `library`: that is content which IS here, this is the shape of a collection of which almost none is. Shape in `folio-assistant-core/schemas/catalogue.ts`. | no |
| `fhir-artifact-index` | **harness** | the artefact index of a published FHIR Implementation Guide, RECONSTRUCTED from its published output — every artefact by canonical URL and published representation, with the DAK API's JSON Schema / JSON-LD sidecars as an overlay where the IG publishes one. No IG publishes such an index itself, so every field records which file it came out of. A SIBLING of `catalogue`, not a flavour of it: a catalogue node is a container or an item, while a FHIR artefact is a `resourceType` at a canonical URL published in several representations at once, in a versioned package, against a FHIR version. Shares `MaterializationSchema` with `catalogue`. Read with the [`ig-artifact-ingestion`](../authoring-who-smart-guidelines/ig-artifact-ingestion.md) skill; shape in `folio-assistant-core/schemas/fhir-artifact-index.ts`. | no |
| `library` | **harness** | L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, `structure.json` and, where scanned, `ocr/page-NNN.txt`. | no |
| `voices` | **harness** | editorial voice profiles — one JSON each, `"$schema": "folio-voice/v1"`. Every rule cites its source. **Opt-in**: shipping a voice does not apply it. | no |
| `themes` | **harness** | themes an instance DERIVED from a source it holds — a served stylesheet, or a style guide's stated rules. One Theme node each, carrying `kind: sticky \| webpage \| publication`; the palette vocabulary is shared across every kind and only the geometry varies. Every value cites where it was measured. NOT the platform's own twelve themes, which are furniture in `cat-harness/schemas/themes.ts` — a palette read off a WHO style guide is subject matter. | no |
| `translation-sources` | **harness** | the gettext side of translation — `.pot` templates, `.po` catalogues and their `TranslationNode` manifests, one directory per target locale. The INPUT to injection; there is deliberately **no kind for the rendered output**. Read with the [`translation-manager`](translation-manager.md) skill; shape in `schemas/translation.ts`. | no |
| `docs` | **harness** | documentation **about** the knowledge graph — how the harness works, what its directories hold, how a process runs. Distinct from `folio` by its SUBJECT, not its format. Added 2026-09-20: this table carried no renderable harness kind until the harness gained a plain just-the-docs renderer, and the rule reads in its true form — a layer owns the kinds it CAN render. | **yes** — the plain just-the-docs pipeline, no extensions |
| `folio` | **`folio-assist-core`** | authored content an AUTHOR creates using the graph — a note, a visualization, a paper. The who-iris catalogue is `library/`; a note about it is a `folio`; the page explaining how ingestion works is `docs`. | **yes** — just-the-docs renders it to a website |

> ### `test/` is the one test tree — resolved 2026-09-19
>
> This instance declares `qa` at **`test/results/`** and `health` at
> **`test/health/results/`**, and everything a test runner reads is under
> `test/`: the Playwright `*.e2e.ts` specs, their `support/` fixtures, and the
> health sweep's own `*.test.ts`.
>
> **It was two trees for a day.** There was never a principle behind the `s`:
> `test/` grew around the QA results tree, `tests/` around the Playwright specs
> that `playwright.config.ts` reached with `testDir: './tests'`, and the health
> sweep landed under `tests/health/` in #395 because the owner asked for it
> there. That PR recorded the inconsistency here rather than resolving it, on
> the grounds that relocating a declared directory as a side effect of adding a
> graph kind is how a directory quietly goes missing. The owner settled it the
> same day — bean `auap`, PR #400 — and it moved as its own change, with its
> own review.
>
> **Why `test/` won, and it is the rule for the next one of these.** An id in a
> declaration is the expensive thing to move: `GRAPH_KIND_ALIASES` exists
> because renaming one is a cross-instance breaking change, and a downstream
> instance overriding a path that is no longer declared scans nothing and
> reports a clean run over it — the `dh4f` defect. `test/` was the side a
> declaration pointed at; `tests/` was the side reached by one line of one
> config file. **Move the cheap side.** The `health` entry's `path` changed
> and its **`id` did not**, which is what makes the move survivable for an
> inheriting instance: `resolveDirectories` matches an override on the entry's
> id, never on its path.
>
> **Verify a move like this positively, never on a green test run.** The
> failure mode is a consumer that now scans nothing and reports clean, which
> looks identical to success from inside. Three constants here composed their
> path from segments — `join("tests", "health", "results")` in
> `schemas/health-report.ts`, and the scan-root lists in
> `scripts/repo-partition.ts` and `scripts/tests/site-dir-single-answer.test.ts`
> — so a corpus grep for the moved path did not find any of them, and all three
> fail **silently** when stale. What caught them was asking each tool to name
> its subjects: `bun run harness:dirs:check` listing `test/health/results` as
> `ok` among 11 declared, `bun run health:list` naming all five checks, and
> Playwright reporting a non-zero spec count.

> **A rendered translation is not its own graph kind — the FILE declares its
> language.** `docs/fr/index.md` carries `lang: fr` and
> `translation_source: index.md` in its own front matter, so it is the same
> kind of thing as the page it translates: renderable content, differing by a
> field. `content/pipeline/translation-index.ts` discovers the locale subtrees
> by reading those fields and **never** matches a directory name against a
> list of language subtags — that inference is wrong in both directions,
> silently hiding a `no/` chapter (Norwegian, or the English word) and
> silently showing a `pt-BR/` or `translated-fr/` one.
>
> A first draft of PR #351 did give it a kind, with a `locale` field and one
> declaration per locale subtree: ten entries for five locales across two
> subtrees, restating what all ten files already said, growing as
> O(locales x subtrees). The owner's framing is what settles it —
> *"narrative/audio/visual content with text should be translatable. its not
> so much the node schema itself but its content (e.g. markdown, bpmn) should
> be translatable"*: translatability is a property of a **format within a
> content type**, which `schemas/translation-tools.ts` already declares and
> `isTranslatable` already answers, not a property of a directory.
>
> `.po` catalogues are the genuine exception, and that is what
> `translation-sources` is for: they are not content in any language, so no
> file inside them can declare one.

> **`uploads` and `library` are two kinds, not one, and the split is
> load-bearing.** They are the two stages of the document-ingestion pipeline,
> and the corpus-grep checklist searches `library/` **only** — so a source
> still sitting in `uploads/` does not merely go unread, it makes a clean grep
> read as *"nobody has done this"* while the file is on disk. An un-ingested
> source is worse than an absent one, because it produces false confidence
> rather than a gap. One `sources` kind covering both would erase exactly the
> distinction the pair exists to state.
>
> **They are also the reason `materialiseDirectories` exists.** `AGENTS.md`
> says *"declare only what exists — a declared-but-absent directory is the bean
> `dh4f` defect, where a consumer scans nothing and reports a clean run over
> it"*. Absent and empty are indistinguishable to a consumer, so declaring a
> directory without creating it converts a real gap into a false pass.
> `bun run harness:dirs` creates every directory an instance declares or
> inherits; the session-start sweep and `init-folio` both call it, so a
> declaration is never left without the directory it names.

> **`todos` is not a second work plan, and the distinction is the one
> `AGENTS.md` already draws.** `beans/` is the AGENT work plan and no second
> store may be stood up beside it. `todos/` is the other thing that document
> carves out — *"the content-review feedback workflow … a separate domain
> feature, not the agent work-plan"* — and it is **content**: a todo records
> that a **person** has something outstanding, and it is owned and authored by
> the folio.
>
> **A todo carries the four coordinates of the role model**, because they are
> already declared and inventing a fifth vocabulary for them would be the drift
> this file exists to prevent. `AGENTS.md`: *an actor performs a task in a
> process as a role.* A todo is that sentence left unfinished, so it is tagged
> by `roles`, `processes`, `tasks` and `identities` (`schemas/todo.ts`).
>
> Two things about those tags are load-bearing rather than incidental:
>
> - **A task reference carries its process.** A BPMN activity id is unique only
>   *within* its process, so a task tag is the pair `{ process, task }` and never
>   a bare string. Same lesson as the subprocess interpreter: a step id without
>   its phase is not an address.
> - **An identity is provider-qualified, and its link to an actor is optional.**
>   `litlfred` is not an identity; `github:litlfred` is. The link to a declared
>   actor is absent whenever the person is not in `.claude/skills/actors/` — and
>   somebody who comments on a pull request is a real person with a real
>   outstanding item whether or not the registry has heard of them. Absent means
>   **not linked**, a third state; never anonymous, and never defaulted.
>
> `resolveTodoTags` reports each tag as `resolved`, `dangling` or
> **`not-checked`**, and the third is the one that matters: a checkout with no
> `skills/` must report every role tag as unchecked, never as dangling. A wall
> of false findings is how a check gets switched off.
>
> **`todos/` was previously a machine-queue directory, and that is retired, not
> revived.** Four audit scripts defaulted their bulk JSON into `todos/*.json`
> (bean `bfyw`); all four now write under `build/`, and
> `scripts/tests/audit-output-paths.test.ts` pins that none of them regresses.
> That guard forbids machine output landing there. It does not forbid the
> declared content graph described here, and the two must not be confused:
> bulk machine-generated queues stay bulk JSON under `build/`, exactly as
> before.

> **`bean-defs` and `workflow-state` are the distinction `beans` swallowed.**
> Collapsing `workplan` + `process-state` into one `beans` kind was right about
> the *mechanism* — one directory, one declaration — but the underlying
> difference is real and came back as nodes: WHAT IS BEING WORKED ON carries
> judgement and is edited by hand; WHERE A RUNNING PROCESS GOT TO is a token the
> interpreter owns. A consumer asking for the work plan must still not be handed
> BPMN instance state.

**Why the work plan is the harness's and not core's.** The test is whether the
harness *has* one, and it does: an instance has work whether or not it has
content, and `agentic-harness` carries a `beans/` store for its own. A Tool repo
and a Test repo have work plans too. That is a different test from the one that
sent `folio` to core, which is about capability — only core can render.

**One `beans` kind, and the distinction it used to carry moved inward.** An
earlier version declared **two** directories here — `workplan` at `beans/` and
`process-state` at `beans/workflow/` — on the reasoning that WHAT IS BEING
WORKED ON and WHERE A RUNNING PROCESS GOT TO are different things, authored by
different parties, and a consumer asking for the work plan must not be handed
BPMN instance state. **That reasoning still holds. The mechanism was the
mistake.**

The second directory sat *inside* the first, so a consumer scanning a declared
directory could not assume it owned what lay beneath it, and the two were told
apart only by file extension — a coincidence of the layout rather than a
contract. Expressing the distinction as two sibling entries in a flat list
misrepresented a containment relation.

`beans/` is now a graph with named nodes, declared by `beans/beans.json`
(schema: `schemas/bean-graph.ts`): `defs` holds the work plan, `workflows`
holds running-instance state. So the harness says which directories exist and
what kind of graph each holds, and the bean graph says what its own nodes are.
**One fact, one place, at each level** — and the consumer that must not be
handed instance state now asks for a node by name instead of inferring it from
a file extension.

> **The general rule survives the specific case.** *Nesting is not
> inheritance.* A consumer scanning a declared directory must not assume it
> owns everything beneath it — check whether a deeper path is declared, here
> or in a graph's own node list. The `beans` collapse removed one instance of
> the trap, not the trap.

## An unavoidable duplicate is fine; an unchecked one is not

The declaration is meant to be the single statement of the layout, and mostly it
is — fields that restated it elsewhere were removed rather than kept in sync.

Two copies survive because neither can be removed, and **both are checked**:

- a **third-party tool's own config**, which will never read this schema;
- a **constant on a hot path**, where re-reading a JSON file to learn one's own
  directory would cost more than the duplication saves.

The rule is not "never duplicate". It is: **an unavoidable duplicate is fine; an
unchecked one is not.** In this instance `bun run check:harness-dirs` is what
makes the difference.

### The dot-prefix guard tests every segment, not just the first

A node path resolving under a dot-prefixed directory is **rejected**, and the
guard checks **every segment** of the resolved path. A node declared `.defs`
under a visible root resolves to a hidden directory and is exactly as invisible
as the stores this convention exists to surface — so checking only the head
would have made the guard unfireable.

**Why invisibility is worth a guard at all:** a dot-prefixed directory is absent
from a plain `ls`, from most file browsers, and from a forge's web tree. When
the work plan and the running-process state lived behind dots, the two artefacts
a person looks for first were the two hardest to find.

## The conventional layout

```
agentic-harness/          folio-assistant-core/
  cat-harness.json    folio-assistant-core.json
  tools/     → tools        folio/     → folio
  kg/        → kg           (inherits tools/, kg/, schemas/)
  schemas/   → schemas
```

`agentic-harness` declares `tools/`, `kg/` and `schemas/`.
`folio-assist-core` declares **only** `folio/` and inherits the other three.

## Inheritance

An instance inherits its dependencies' directories, walked depth-first through
`dependencies.folioAssistant` — the same order `schemas/harness-config.ts` uses
for skills and translations. Deepest dependency first, root last, so the root
wins.

**Overrides match on the directory's `id`, never on its `path`.** An instance
that wants its knowledge graph somewhere other than `kg/` redeclares the `kg`
id with a different path:

```jsonc
{ "id": "kg", "path": "graph/knowledge/", "graphs": ["kg"] }
```

Matching on path instead would make two knowledge graphs out of one
relocation, and every consumer would scan a directory that is not there. An
override also **keeps the inherited position** in the scan order rather than
moving to the end — a relocation should not reshuffle what is scanned first.

### `dependents` — whether an inheriting instance gets one of its OWN

`scope` says where a path RESOLVES. `dependents` says whether a folio depending
on this instance **materialises its own copy**, and the two are independent:

- **`reproduce`** — part of the SHAPE a folio has. `uploads/`, `library/`,
  `folio/`, `voices/`, `translations/`. A dependent gets its own, empty, with a
  keep marker.
- **`skip`** — merely WHERE THIS INSTANCE'S CONTENT LIVES. `schemas/`,
  `tools/`, `methodologies/`. A dependent reads it through the
  overlay and creates nothing.

Before this existed, a fresh folio depending on `cat-harness` resolved **12**
directories and created all 12 — six of them the platform's own, each with a
committed keep marker. That is `dh4f` shipped downstream: a consumer scanning a
directory that exists and is empty, reporting a clean run over it.

**It suppresses `mkdirSync` and nothing else.** A `skip` entry is still
RESOLVED, because that is how the cross-instance overlay serves a dependency's
skills to `skill_list` and `skill_fetch`. Suppressing resolution instead would
break the overlay to fix a directory-creation problem.

**And it never governs the declaring instance.** `dependents` says what a
DEPENDENT does; an instance always materialises what it declared itself.
Otherwise marking `schemas/` as `skip` would stop the platform creating its own.

## Making a field REQUIRED is a change other branches pay for

`dependents` has no default, deliberately: `reproduce` ships junk downstream and
`skip` silently denies a folio its ingestion queue, so a field whose wrong value
is invisible either way has to be written down. That reasoning is sound and the
**cost lands somewhere else**, which is the part worth knowing before you do it
again.

Measured 2026-09-20, within an hour of the change: `main` added
`methodology-crdm` and `methodology-raci` while the field was in review. Neither
carried it — that branch's author had no reason to know it existed. On the
merged tree **every** `readDeclaration` threw, and CI reported **166 failures
and 35 errors** whose only visible cause was a raw Zod dump repeated across
every test that reads a declaration.

Nothing was wrong with either side. So when you add a required field to a
declaration several sessions are editing at once:

1. **Write the error before the field.** The two-line classification was
   trivial; what cost the time was that the message said
   `expected: 'reproduce' | 'skip', received: undefined` and nothing else.
   `readDeclaration` now names the offending entries and gives both values with
   a one-line test for choosing between them.
2. **Expect to pay it more than once**, and treat that as an argument for
   landing quickly rather than as a defect to fix. Every day the branch sits
   open, another entry arrives without the field.
3. **A conflict-free merge is not a passing merge.** Git had nothing to
   reconcile — main added entries, this branch added a field — and the result
   was still unparseable. Verify the merged tree, never the merge.

## Three states, as everywhere else here

- **No declaration** → `readDeclaration` returns `undefined`. An
  instance not yet migrated is ordinary, and callers fall back to today's
  conventions. Not an error.
- **Present but unreadable** → **throws.** A declaration nobody can parse
  leaves every consumer scanning the wrong directories, which is strictly worse
  than not having one.
- **An unknown graph kind** → rejected, not accepted and ignored.

## Declare what exists

A directory that is declared but absent is worse than one that is missing:
every consumer scans nothing and reports a clean run over it — the same defect
bean `dh4f` found in thirty pipeline scripts, where three were passing over a
corpus they could not read.

This repository's own declaration is the worked example, and **no count is
given here on purpose**: `<name>.json` is the list. That sentence said
"declares `schemas/` and `skills/`" until 2026-09-20, by which point it
declared **twenty-one** directories — a number in prose is a claim, and this
one had been false for long enough that `AGENTS.md` carries its own flagged
copy of the same rot.

What is still true and worth reading off it: its `cat-harness` id points at
`skills/` — **ids are stable across a relocation, paths are not** — and it
declares nothing it does not have. A `library` entry appears in `who-iris`'s
declaration only when the corpus moves there, because a declared-but-absent
directory makes every consumer scan nothing and report a clean run over it.

## Naming — a self-identifying declaration, stub-named artefacts (STRICT)

The declaration carries three publication fields beside `name`:

| field | meaning |
|---|---|
| `stub` | filename stem of every artefact this instance publishes. Defaults to `name`. |
| `canonicalUrl` | where those artefacts live — the base every `@id`/`$id` is minted against |
| `previewUrl` | where CI previews are served, when that differs |

Modelled on `WorldHealthOrganization/smart-base`'s `dak.json`, which carries
`canonicalUrl`, `publicationUrl` and `previewUrl` and derives its stub by
stripping the repository's prefix (`smart-base` → `base` →
`https://smart.who.int/base`), so stub, directory and published path are one
word.

**The rule, and it is enforced by test:**

- **Every published artefact is named `<stub>.*`** — `<stub>.jsonld`,
  `<stub>.schema.json`. Never a generic `kg.json`. Compute it with
  `artefactStub()`, never by re-deriving it, so two exporters cannot disagree
  about what this instance is called.
- **The declaration file is `<name>.json` — named for the instance's `name`,
  NOT its stub.** It is the one file here not computed with `artefactStub()`:
  `instanceDeclarationFilename()` spells it, and `instanceConfigFilename()`
  spells the `<name>.config.json` beside it. `artefactStub()` is
  `stub ?? name`, so the two coincide for every instance declaring no `stub`
  — today all of them but `cat-harness`, whose `stub` equals its `name`
  anyway. **A coincidence in the data is not the rule**: an instance
  declaring a differing `stub` publishes `<stub>.jsonld` beside a
  `<name>.json`, and composing either from the other resolves to nothing.
- **The renderable site lives at `docs/<stub>/`.** Compute it with
  `siteDir(d)` or `siteDirFor(root)`, never by writing the path out.

### Every other marker: THE TYPE DECLARES ITS OWN FILENAME (STRICT)

Settled by the owner 2026-09-20, bean `79t3` question 1. The rule above covers
the root declaration and published artefacts. For every **other** marker — the
files by which a repository asserts what it is — there is no uniform spelling
and there cannot be one:

| marker | who owns the name |
|---|---|
| `sushi-config.yaml` | SUSHI reads that exact name, and it is YAML |
| `dak.json` | WHO's `smart-base` |
| `<name>.json`, `<name>.config.json` | ours |
| `beans.json`, `todos.json` | ours, and named after the graph KIND |

Two of those are not ours to rename, so any rule claiming to cover the set
would be false on arrival. **So the type declares its filename, and the
convention is that rule rather than a spelling.** What a new type copies is
*say what your marker is called*, not a pattern to imitate.

The two alternatives were considered and rejected on measurement, **and the
second rejection was later reversed** — recorded rather than rewritten, because
the objection was real and what answered it is the interesting part.

`<slug>.config.json` everywhere would rename what WHO owns. That still holds.

Bare `<slug>.json` was rejected as **un-findable**: `findInstanceRoot` walked up
testing one fixed filename per level, no declaration carried a `$schema` to glob
for, and `{name, directories}` is the shared shape of the root declaration,
`beans.json` and `todos.json` alike — so duck-typing would return `beans/` as an
instance root **silently**.

**Both halves were answered by making the file identify itself.**
`findDeclarationFile` admits a `*.json` only when its `name` field EQUALS its
own filename stem, and `findInstanceRoot` now calls it rather than testing a
word agreed in advance. Discovery survives, because a consumer matches on the
file agreeing with itself. And the duck-typing worry closes on the same rule:
`beans/beans.json` declares `"name": "folio-assistant"` against the stem
`beans`, so it does not match and `beans/` is not an instance root — refused by
what the file says it is, not by a path exception.

**At the graph-kind level this is `GraphKindDef.declarationFile`**, and it is
already load-bearing rather than decorative. `declaredKinds` computed a nested
declaration's filename as `${basename(path)}.json` while `bean-graph.ts` held
that *moving `beans/` to `work/` requires editing nothing inside it*. Both were
true of today's layout and contradict each other on the first relocation: the
walk looks for `work/work.json`, the file is still `work/beans.json`, and the
nested kinds drop out of `declared` with nothing said — an under-count, which
manufactures an `undeclared` finding somewhere else. The kind now names its own
file, `BEAN_GRAPH_FILE` and `TODO_GRAPH_FILE` derive from it, and the
directory-name convention remains only as a fallback for a kind that declares
none.

### `docs/<stub>/` — the site is packaged for the split (STRICT)

The stub that names `<stub>.jsonld` also names the directory holding this
instance's renderable site: `folio-assistant/docs/`, not `docs/`. After
[#223](https://github.com/litlfred/folio-assistant/issues/223) each layer is
its own repository, so under its own stub the split is a directory move rather
than a file-by-file sift, and two layers can be checked out side by side.

**No published URL changes**, because Jekyll is pointed at the stub directory
as its **source root** (`source: ./docs/<stub>`), leaving the site's internal
layout untouched. Verified on `gh-pages` after the move.

**It is not the `folio` graph-kind declaration.** `docs/` still does not appear
in `<name>.json`: measured 2026-09-19, adding it makes `harness:dirs`,
`kg:schema:check` and `docs:harness:check` throw `unknown graph kind "folio"`,
because `folio` is contributed by **core** and those readers do not load its
registration. Packaging is unblocked; the declaration waits. Bean `x4a6`.

**`siteDirFor` throws rather than defaulting** when an instance declares
neither `stub` nor `name` — a guessed site root writes the whole site where
nothing serves it, and "could not determine" is not an answer.

**`scripts/tests/site-dir-single-answer.test.ts` fails on any new `docs/…`
literal in a path-resolving position** (prose is left alone). It found 154
stale paths on its first run, including the e2e suite that `bun test` never
runs, and five more that arrived later in a clean merge from a branch cut
before the move — which is the case it exists for.

## The declaration is itself a graph

`toJsonLd()` projects a declaration into the folio namespace: each directory is
a node with an `@id` and an `@type`. The set of directories an instance scans
is then queryable by the same machinery as anything else in the knowledge
graph, rather than being configuration only one module understands.

The authored form is the stored one and the graph form is derived — one truth,
not two. `readDeclaration` accepts **either**, and a round-trip test pins that:
the projection emits `@type` *instead of* `graph`, so reading the published
form back without the reverse lookup silently loses the one field that says
what a directory holds.

## Skills are KG content

The `kg` graph is where skills live, and that is why they are addressed through
the declaration rather than by path. An agent asks `skill_list` / `skill_fetch`
for a skill; it does not open `skills/<something>.md` from memory. An instance
may site its `kg` anywhere — this repo's `kg` id points at `skills/` — and a
downstream instance inherits its dependencies' skills through the same
inheritance rules above. A hardcoded path breaks on the first relocation, which
is the whole reason overrides match on `id`.

### Roles, processes and decisions are KG content too

The `kg` graph is not only skills. It holds the whole
actor → role → skill → task model:

```
skills/                         ← this instance's `kg`
  roles/roles.json              the ROLE GRAPH — a role is a BPMN swimlane
  workflows/*.bpmn, *.dmn       the processes those roles act in
  requirements/*.json           conformance obligations pointing at the rest
  permissions/permissions.json  what an actor may DO, in any lane
  <area>/kg-qa/*.kg-qa.json     audit sidecars, beside what they audit
  folio-core/*.md               skills
  <pkg>/package-manifest.json   which skills a package publishes
```

and the processes those roles act in — `processes/*.bpmn` and
`processes/decisions/*.dmn` — are reached **through the skill that
describes them**, not as standalone artefacts. A BPMN activity names the skill
that implements it (`<folio:skill ref>`); a lane names the role that performs it
(`<folio:role ref>`, or an exact lane-name match in `roles.json`); a role carries
the skills its lane's activities need. `bun run kg:audit` checks every one of
those joins and writes a sidecar per node. Model and resolution rules:
[`role-model.md`](role-model.md); schema: `schemas/role-graph.ts`.

**Not yet true end to end.** `resolveSkillDirs` (`schemas/harness-config.ts`)
computes the cross-instance overlay and has **no caller**, so skill discovery is
root-only in practice today and a dependency's skills are not reachable. Stated
here rather than implied, because an agent that assumes inheritance works will
silently miss half its instructions.

## Layering — a harness module must not import the content vocabulary

The declaration schema needs the platform's IRI namespace to mint `@type`
values. That namespace used to live in `schemas/jsonld.ts`, which is
`folio-assist-core`'s **content** vocabulary — block kinds, DoCO structural
types, SPAR citation terms. Importing it would have made `agentic-harness`
depend on the content model for its own type IRIs: a `harness → core` edge,
already the largest wrong-direction group `bun run check:partition` reports.

It is now `schemas/namespaces.ts`, a leaf that imports nothing, classified to
the harness. The direction only works one way round — **core may import the
harness; the harness may not import core** — so a constant both layers need has
to live at or below the harness. Putting it in core reintroduces the edge.

The first attempt was a duplicated constant in the harness module with a test
asserting the two stayed equal. That works and is worse: **a drift guard is an
admission that there are two definitions.** Extract instead, and re-export from
the old home so existing importers are untouched.

`cat-harness.test.ts` pins the property structurally — it asserts the module
does not import `./jsonld` or `./block-kinds`. Reach for that test when adding
anything else at the harness layer.

## What lives in the `schemas` graph — one authored form, many renderings

The `schemas` directory holds schema definitions, and the convention for every
one of them is the same: **the Zod schema in `.ts` is authoritative, and every
other form is generated from it.**

```
schemas/<thing>.ts                    ← AUTHORED.  Zod + the inferred type.
  ├─→ schemas/generated/<Thing>.schema.json    JSON Schema  (validators, editors)
  └─→ a JSON-LD projection                     KG node      (queryable)
```

The TypeScript type is `z.infer<typeof Schema>`, never declared alongside the
schema — two declarations of one shape drift, and the drift is invisible until
something reads the stale one.

Both renderings already have their mechanism, so adding a schema introduces no
new machinery: `scripts/generate-schemas.ts` walks a map of Zod schemas through
`zodToJsonSchema` into `schemas/generated/`, and `toJsonLd()` in
`schemas/cat-harness.ts` is the worked example of the graph projection.

**Generate as many renderings as have a consumer, and no more.** JSON Schema
because validators and editors speak it; JSON-LD because the KG query path
does. A third — SHACL, an OpenAPI fragment, Turtle — is added when something
needs it, not in anticipation: each is another file to regenerate and another
chance for a stale artefact to be read as current.

**A rendering is never where a fix lands.** If a generated `.schema.json` is
wrong, the `.ts` is wrong; edit that and regenerate. A `--check` mode in CI —
the pattern `gen-skill-docs.ts --check` already uses — is what makes that
enforceable rather than merely asserted.

### Why not author the rendering and validate backwards

The tempting inversion is to hand-author the JSON-LD node, because it is the
form the KG consumes, and validate it against Zod in CI. That is the same two
artefacts with the authority pointing the wrong way, and it is worse for one
reason: **a hand-authored node is unchecked until CI runs.** With Zod
authoritative the schema *is* the type, so a malformed definition fails at
`tsc`, in the editor, before it is committed. Validation-after-the-fact catches
the same error strictly later and only if CI is green — and bean `dzl3` is this
repository's evidence that a suite can sit non-running for as long as it has
existed.

Decided 2026-09-18 by the repository owner, for the Tools schema and for
everything else in the `schemas` graph. Worked through in
`docs/architecture/cat-harness-minimum.md` §"Carrying it".

## Adding a graph kind

Decide which layer owns it first — **if it renders, it is not the harness's.**

- A harness kind: one entry in `BASE_GRAPH_KINDS` (`schemas/cat-harness.ts`).
- A kind belonging to a layer above: a module like
  `schemas/folio-graph-kind.ts` that calls `registry.register(name, def)` at
  import, so the harness never learns the name until that layer is loaded.

Either way the definition is `@type` IRI + `renderable` + `holds` + summary,
and the JSON-LD projection and the reverse lookup both derive from it. A kind
added without deciding **either** axis will not compile.

`holds` is the content/context/state one, and
[`content-context-and-state-graphs`](content-context-and-state-graphs.md) is
where you answer it — including the bar for adding a value at all, why there is
no "could not determine", and why it is compared by `sameKind` so two layers
cannot register one name on different layers and have the first silently win.

Note the declaration's `graphs` field is validated **against the registry at
read time**, not by a closed Zod enum. An enum would be built at module load —
before core has registered `folio` — so it would reject the one kind the entire
rendering pipeline depends on.

## Pinning a reference — a SHA may stage, only a version may publish

Owner, 2026-09-20, on how an instance's dependencies are pinned:

> downstream we need to align to fhir, sushi. **hard constraint.**
>
> sha is for staging, regernecing in published SEMVER
>
> preview is staging, not published

**Two tiers, and the tier is decided by whether a consumer may DEPEND on the
artefact — not by whether they can reach it.** That is why an externally
reachable PR preview is staging: it is provisional, and nothing should pin to
it.

| tier | a reference may be |
|---|---|
| **staging** — working checkout, PR preview, branch under review | a submodule SHA, a git `ref`, a pre-release, or a version |
| **published** — anything an external consumer may depend on | **semver only** |

**A SHA is an excellent pin and a useless published reference.** It names a
commit in a repository the downstream consumer may not have and may not be
able to fetch — and in FHIR's vocabulary cannot be stated at all:
`dependsOn` carries `packageId` and `version`, and there is no field a SHA
belongs in. A published artefact carrying one is not a stricter pin, it is an
unresolvable one.

**Exact versions, never ranges.** This is the FHIR rule, not the npm one, and
it follows directly from the alignment constraint: a downstream that must
resolve like SUSHI cannot be handed a range.

**No ref at all is the same defect, reached by default.** An unpinned
reference is `current` by omission — the pre-release choice made by nobody.
`current` and `dev` are FHIR's real pseudo-versions and belong in the staging
tier with a SHA, deliberately chosen and written down.

### A REFERENCE is not PROVENANCE

The distinction is what makes this checkable, and both look identical in a
published document — a hex string.

| | what it is | example |
|---|---|---|
| **reference** | a consumer must RESOLVE it to obtain another artefact | a dependency's `ref`/`version`, an asset's `source` |
| **provenance** | a record of where THIS artefact came from | the build stamp's `sha`, `sourceCommitSha` |

A stamp saying "produced from commit `abc123`" asks nobody to fetch
`abc123`. **So classification is by KEY, declared in `PROVENANCE_KEYS`, never
by the look of the value** — a regex over the published JSON fails on the
build stamp, which is the exported graph's only 40-hex string.

`bun run check:published-refs` enforces this; advisory, `--strict` to fail. It
reports each carrier's count **even when that count is nought**, because a
gate that silently covers nothing and exits 0 is this repository's most
expensive recurring defect (`xom7`, `dh4f`, `a6kl`).

Full scheme, including what an instance's version means and what makes it go
up: [`fsh-guts/proposals/instance-versioning.md`](../../../fsh-guts/proposals/instance-versioning.md).

---
consulted: true
---

# Directory conventions — what an instance declares it scans

Every instance carries a **declaration** at its repository root — a `*.json` whose `name` field equals its own filename stem, found with `findDeclarationFile` and never composed from a path. It declares the directories the instance scans for content,
and what **kind of graph** each one holds.

Schema and resolution: `schemas/kg/cat-harness.ts`.

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
graph**. `folio` is one graph typology among several.

## Node Kinds are declared: `nodeSchemas` (owner, 2026-09-29)

An instance lists every `$schema` value its files carry, and the published
schema that defines it, in its declaration's **`nodeSchemas`** — a path
relative to the declaration, or an IRI for a published standard. It is
bootstrap's field (`KnowledgeGraphDeclarationSchema` in `graph.ts`), so a
reader with nothing installed can go from a file's `$schema` to its Node
Schema without knowing any harness. The graph-typology registry's `nodeSchemas`
is a different, harness-side table: it maps a tag to a TypeScript `validator`
or `shape`, which only a harness can run. `graph.test.ts` fails on a bootstrap
file whose `$schema` is not declared, and on a declared local schema that does
not fix that very tag.

## The graph typologies

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
> So `GRAPH_TYPOLOGY_ALIASES` in `schemas/kg/cat-harness.ts` maps `kg` →
> `cat-harness`, resolved once at the registry boundary and nowhere else.
> `resolveGraphTypology` reports WHICH spelling was used, so a caller can warn —
> an alias that resolves silently is an alias nobody ever removes.
>
> **A directory `id` of `kg` is untouched.** An id is the instance's own
> handle and must survive a rename of anything else; this repository's own
> declaration moved to `id: "cat-harness"` because it chose to, not because
> it had to, and moved on to `id: "skills"` on 2026-09-23. A Subgraph id is
> its name inside its Harness, and the Harness name qualifies it
> (`cat-harness.skills`). `RENAMED_DIRECTORY_IDS` reads the old id as the new
> one, so an older declaration still overrides the entry it meant.
>
> **The JSON-LD projection canonicalises.** `toJsonLd` emits the type IRI, not
> the spelling, so reading a projection back yields `cat-harness` whatever was
> written. Project-and-read-back is therefore a migration path for an old
> declaration rather than a way to lose information.
>
> Not renamed, deliberately: `kg:audit`, `kg-export`, `kg-qa` sidecars and the
> `kg` QA family. Those are command and file-format names, not the graph typology,
> and churning them would touch hundreds of references for no gain in what a
> declaration MEANS.

**The column is `contents`, not `holds`.** `holds` is the FIELD on
`GraphTypologyDef`, and it carries the content/context/state layer rather than a
description — one word meaning two things in the same document is a collision
worth one rename. The layer is deliberately **not** a column here: it is
`graphTypologiesOfLayer()` in
[`content-context-and-state-graphs`](content-context-and-state-graphs.md), and a
hand-maintained copy of it would be free to drift from the registry that
decides it.

**The table of every kind is a published page, not this skill.** Each row is a
kind's `description`, and the rows span every instance in the checkout:
The FHIR IG layer, the science layer and the DAK layer each declare kinds of their own.
So the table is built at publish, by `bun run cat kind:table`, at
`<base>/cat-harness/kind-table/` (`docs/cat-harness/kind-table.md`, declared in
cat-harness's `builtAtPublish`). When it lived in this skill, the skill went stale
at every re-pin that brought a layer's new kind (owner, 2026-10-14: "1"). To
change a row, edit the kind.

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
> graph typology is how a directory quietly goes missing. The owner settled it the
> same day — bean `auap`, PR #400 — and it moved as its own change, with its
> own review.
>
> **Why `test/` won, and it is the rule for the next one of these.** An id in a
> declaration is the expensive thing to move: `GRAPH_TYPOLOGY_ALIASES` exists
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
> `schemas/sdlc/health-report.ts`, and the scan-root lists in
> `scripts/repo-partition.ts` and `scripts/tests/site-dir-single-answer.test.ts`
> — so a corpus grep for the moved path did not find any of them, and all three
> fail **silently** when stale. What caught them was asking each tool to name
> its subjects: `bun run cat harness:dirs:check` listing `test/health/results` as
> `ok` among 11 declared, `bun run cat health:list` naming all five checks, and
> Playwright reporting a non-zero spec count.

> **A rendered translation is not its own graph typology — the FILE declares its
> language.** `docs/fr/index.md` carries `lang: fr` and
> `translation_source: index.md` in its own front matter, so it is the same
> kind of thing as the page it translates: renderable content, differing by a
> field. `pipeline/translation-index.ts` discovers the locale subtrees
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
> content type**, which the owning instance declares under
> `contentTranslations` (collected by `schemas/library/translation-tools.ts`) and
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
> `bun run cat harness:dirs` creates every directory an instance declares or
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
> by `roles`, `processes`, `tasks` and `identities` (`schemas/sdlc/todo.ts`).
>
> Two things about those tags are load-bearing rather than incidental:
>
> - **A task reference carries its process.** A BPMN activity id is unique only
>   *within* its process, so a task tag is the pair `{ process, task }` and never
>   a bare string. Same lesson as the subprocess interpreter: a step id without
>   its phase is not an address.
> - **An identity is provider-qualified, and its link to an actor is optional.**
>   `litlfred` is not an identity; `github:litlfred` is. The link to a declared
>   actor is absent whenever the person is not in `cat-harness/scenarios/actors/` — and
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
(schema: `schemas/sdlc/bean-graph.ts`): `defs` holds the work plan, `workflows`
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
unchecked one is not.** In this instance `bun run cat check:harness-dirs` is what
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
agentic-harness/          <content-core>/
  cat-harness.json    <content-core>.json
  tools/     → tools        folio/     → folio
  kg/        → kg           (inherits tools/, kg/, schemas/)
  schemas/   → schemas
```

`agentic-harness` declares `tools/`, `kg/` and `schemas/`.
The content core declares **only** `folio/` and inherits the other three.

### Where a NEW instance puts its code: `<stub>/src` (bean `ylj7`)

**A new instance puts its source under `<stub>/src/` and declares it as
`code`.** One directory, one declaration, and nothing to argue about later.

This is stated here as well as in the `code` row above, because the row
answers *"what is this kind?"* and this answers *"where do I put my code?"* —
and somebody starting an instance reads the layout, not the kind table. A rule
that lives only where nobody looks is the `where-does-this-go` failure.

**The existing instances are the exception, and deliberately.** `ylj7`'s
measurement confirmed the mechanism and argued against retro-fitting the
destination: `schemas/` is already a declared graph of its own kind, and
adding `code` to it would give one directory two kinds; `pipeline/` is
core's subject, not the harness's; and `scripts/` hold entry points named **by
path** from `package.json` and the CI workflows, which `check:ci-invocations`
and `check:command-paths` exist to guard — so moving them is a large
invocation surface for nothing the declaration does not already buy. They are
declared **where they are**. `<stub>/src` binds what has no history yet.

**Being declared is not being reached.** Those are two questions and
`bun run cat check:code-accounting` reports them apart — never averaged, because a
rise in one can hide a fall in the other. Beans `d308` and `ce65` own the
second.

### A sub-sub-graph — one RESERVED name inside a declared directory

Owner, 2026-09-22, on where a vendor-specific override of a voice belongs:

> vendor overides go in sub-sub-grahiphs like voice/vendors or voices-vendors

Two spellings, and the **nested** one is the shape this model already has.
`voices-vendors/` needs a SECOND declared graph for one concept, and a
declaration inside a declaration is the defect #263's own comment names. So:

> **A family within a graph is a RESERVED SUBDIRECTORY NAME inside the one
> declared directory — never a second declaration, and never a rule about
> arbitrary nesting.**

Three properties, each load-bearing:

1. **One declaration.** Every consumer that already asks for the graph gets the
   family with no change, and there is one answer to "where does this live".
2. **One level, under a name the reader states.** *"Any directory, any depth"*
   is a rule nobody can check, and it would silently make an unrelated nested
   directory — a `notes/`, a scratch draft — part of the graph.
3. **The directory is where a PERSON looks; the file is still the contract.**
   A vendor voice declares what it overrides in its own `extends` field
   (`extends`, not `overrides` — the obvious name is the wrong one),
   exactly as one sitting flat would. Nothing downstream may infer a relation
   from a path — the same rule as everywhere else here: extension and location
   are coincidences, a declaration inside the file is the contract.

**Adding the name to the convention is not enough; the READER has to descend.**
`voiceFilesIn` scanned one level and took a directory for a voice only where it
held a `voice.json`. `vendors/` holds none — its children do — so every
override under it would have been skipped in silence and `loadVoices` would
have reported a clean read over real content. That is `dh4f` exactly. It was
found by reading the reader when the layout was chosen rather than after
shipping into it, and `voices-viz.test.ts` asserts both directions: a voice
under `vendors/` loads, a voice under any other nested directory does not.

`VOICE_VENDORS_DIR` in `schemas/content/voices.ts` is the one spelling of the name.

## Assets sit at `<stub>/<asset>` — no declaration reaches down (ENFORCED)

**A declared directory never sits inside another declared directory.** An
instance's assets hang directly off its stub — `cat-harness/skills/`,
the IRIS replica's `library/`, the DAK layer's `methodologies/` — and a package inside one of
those is a package, not a second graph.

The owner, 2026-09-22: *"dont bury sub-graph assets. same for `<stub>/skills`,
etc."* and *"follow established norms on layout. qa to enforce."*

> **Read with §"Nesting is declared FROM WITHIN" below, which is the newer
> ruling and the one that governs.** This section was titled *"nothing nests"*
> until the two were merged, and that was too absolute: nesting is permitted,
> **described by a node in the first subdirectory**. What is forbidden either
> way — and what `check:layout-norms` actually measures — is a ROOT
> DECLARATION enumerating a path it cannot verify, which is one of the two
> things #980 rules out explicitly.
>
> So the two agree on every case in the corpus today, and the relocation this
> section describes is *more* correct under the newer ruling than under the
> one it was made for: `methodology-crdm` at `methodologies/crdm/` was a root
> declaration reaching down a multi-level path, and removing it rather than
> repointing it is what #980 requires.
>
> **The check will need to learn the from-within node when it exists.** Its
> kind and name are open and are the owner's (#980), so nothing declares
> nesting from within today and every pair the check finds is still a root
> declaration reaching down. The day that node lands, a nesting it describes
> is legitimate and `check:layout-norms` must stop reporting it — recorded
> here so the next session reads the constraint instead of filing a false
> finding against a sanctioned structure.

**Depth is not the test, and reaching for it produces false findings
immediately.** the IRIS replica's `library/` is two segments from the repository root and
is exactly right. `test/results/` is two segments from its instance root and is
also right, because `test/` is not a graph. What is wrong is *containment*: a
declared directory inside another declared directory, which forces a consumer
scanning the outer one to decide whether the inner one's nodes are also its own
— bean `x4v4`'s question, and every count computed from that sweep depends on
the answer.

### The part that is easy to get wrong

When you relocate a buried asset, **remove its declaration rather than
repointing it.** A package subdirectory of an already-declared graph needs no
entry of its own, and adding one declares the same directory twice — the same
defect, one level down from where it was.

That is not a judgement call made in prose: on 2026-09-22 CRDM's skills were
repointed from `methodologies/crdm/` to `skills/sdlc/crdm/` with the entry kept, and
`gen-skill-docs` immediately demanded a category under **both** the basename
and the declaration id, because both discovery branches found the one
directory. The three entries were dropped and `methodologies/` now holds its
four nodes and no subgraph.

### How it is enforced

`bun run cat check:layout-norms`, a **ratchet** rather than a corpus-wide gate. The
nestings that exist today are baselined in
`scripts/layout-norms-baseline.json`; **a pair not in the baseline fails.**
`cat-harness` reached zero and has no baseline entry, so it cannot regress,
while the instances with outstanding work do not turn CI red — the
`known-skills.ts` wolf-crying rule applied to somebody else's layout.

Removing a nesting prints as `FIXED` and never fails: a guard that punished the
fix it exists to encourage is the inversion bean `rl3h` produced elsewhere.
`--update` shrinks the baseline, so the diff a reviewer sees is the progress.

**Ask the baseline for the list, never this page.** It said "three instances"
while the check found four.

## Inheritance

An instance inherits its dependencies' directories, walked depth-first through
`dependencies.folioAssistant` — the same order `schemas/kg/harness-config.ts` uses
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

### A subgraph is declared ONCE; every instance that has it is a MEMBER

Owner, 2026-09-30 (option A):

> *"if f-a-core is instantiated and has a docs/ sub-dir/graph at
> f-a-core/docs, and f-a-core depends on cat-harness where docs/ is declared
> dir/subgraph and watched, then viewer should detect f-a-core/docs. note
> f-a-core (or matching instance with docs) is then a named (sub-)subgraph of
> docs/ graph"* — and: *"make dependents: reproduce automatic behaviour so
> [we] don't need it."*

So inheritance is **automatic**, and the per-entry `dependents: "reproduce" |
"skip"` field is **retired**. `resolveDirectories` returns, for every
instance-scoped entry, one **member** per instance in the chain whose
`<root>/<path>` exists — `ResolvedDirectory.member` names it. The declarer's
member comes first, so a consumer looking a subgraph up by id is handed the
same directory as before; the rest follow in chain order. Existence-filtered
(the `dh4f` rule); a `repository`-scoped entry has one location by definition
and gets no members.

**Whether an inherited directory is CREATED is a fact about its graph typology**,
`GraphTypologyDef.perInstance`, stated once in the registry rather than per entry:

- **`perInstance: true`** — part of the SHAPE a folio has: `uploads`,
  `library`, `docs`, `qa`, `beans`, `todos`, `voices`, `folio`, `glossary`,
  `translation-sources`, `external-schema`. `materialiseDirectories` creates
  the dependent's own, empty, with a keep marker.
- **absent** — merely where an instance's content lives: `schemas`, `tools`,
  `code`, `processes`, `methodology`. A dependent that HAS one is a member of
  the subgraph; one that does not gets nothing created.

The per-entry field disagreed with itself — `docs` was `reproduce` once and
`skip` four times — which is the argument for moving it to the kind. **An
instance always materialises what it declared itself**, whatever its kind.

A legacy `dependents` key still parses and is dropped, so a folio written
before the change keeps loading. A nested entry that is a subgraph of the
INSTANCE (`skills.json`'s `voices`, as opposed to `beans.json`'s `defs`, which
is part of its parent's graph) now says so with `"subgraph": true`.

Before the per-entry field existed, a fresh folio depending on `cat-harness`
resolved **12** directories and created all 12 — six of them the platform's
own, each with a committed keep marker: `dh4f` shipped downstream.
`perInstance` keeps that fixed.

### The checkout aggregates — no instance declares another's directory (STRICT)

Owner, 2026-09-30 (bean `cmsl`, round 3, option A), built by placement PR0
(bean `ejye`). Until then `cat-harness.json` carried 19 `scope: "repository"`
entries naming its **dependents'** directories (the content core's `skills/`,
the IRIS replica's `library/`, …) so that a corpus-wide tool asking the platform for
"every library" got every library. Every owner `needs` cat-harness, so the
platform was naming its users — and 5 of the 19 had already drifted from the
owner's own id.

The rule now:

- **The checkout's root instance aggregates.** `folio-assistant.json` `needs`
  every instance the checkout stages, and declares the checkout-level state
  it physically holds (`beans`, `todos`, `memory`, `interaction`,
  `issue-marks`, `fsh-guts`, `root-docs` — ids unchanged, new declarer).
- **Only that instance declares at the checkout's scope.** A
  `scope: "repository"` entry anywhere else is a MIRROR, and
  `check:instance-graph` refuses it (`repository-mirror`), as it refuses an
  instance the root does not reach (`unstaged`).
- **A corpus-wide question is asked of the checkout, not the platform.**
  `checkoutDirectories` / `checkoutDirectoriesForGraph` in
  `schemas/kg/harness-config.ts` resolve every staged instance through its OWN
  chain and union the members — per instance, because one long chain would
  override sibling ids (the DAK layer's `processes` would replace the
  harness's). A tool shipped BY an instance asks
  `corpusDirectoriesForGraph(instance, kind)`: that instance plus everything
  stacked on it, never its own dependencies (those are its overlay).
  Known-skills callers say which question they ask: `CorpusScope`
  (`"instance"` | `"checkout"`), and `corpusScopeFor(root)` gives the
  pre-PR0 behaviour as a rule — the platform's own run is corpus-wide,
  `--instance <x>` is that instance alone.
- **Falsifier, kept as a test:** the platform resolved ALONE sees nothing
  above it. A split checkout running against one folio sees that folio and
  its dependencies — what it contains, not what the platform remembers having
  been next to.

## Nesting is declared FROM WITHIN, by a node in the first subdirectory (STRICT)

Owner's ruling, 2026-09-22:

> *"the proper way to do nested directories (and only way that will be allowed)
> is if there is a (Sub?)KGraph node within the first subdir that labels all the
> other ones that exist within it. that structure is inherited"*

**A declaration never reaches down a path.** An instance declares a directory;
that directory's own contents are described by **a node inside its first
subdirectory**, which names the sibling subdirectories present there. Depth is
carried one level at a time, by the level that can see itself.

What this forbids, and it is the shape everything currently reaches for:

```jsonc
// WRONG — the root declaration enumerating a path it cannot verify
{ "id": "docs", "path": "cat-harness/content/docs/", "graphs": ["folio"] }
```

The root cannot tell you what is under `docs/`; it can only assert it. A node
that lives there can be wrong in a way somebody notices, because it sits beside
the thing it describes.

**And the structure is INHERITED.** A dependent instance gets the nesting the
same way it gets the directory — through the overlay, resolved by id, in scan
order. It does not re-describe a dependency's interior, and it does not have to:
the describing node came with the directory.

### A from-within entry can be an INSTANCE directory — bean `cmsl`, 2026-09-30

A kind's `declarationFile` names the node. What an entry in it IS depends on
one field: **an entry marked `"subgraph": true` is an instance directory**
(until 2026-09-30 the marker was answering the now-retired `dependents`),
and `resolveDirectories` lists it exactly as if `<instance>.json` had declared
it. It carries `within` (the id of the directory that declared it), and
`check:layout-norms` treats that pair as the sanctioned shape. An entry
without the marker (`beans.json`'s `defs`, `docs.json`'s `proposals`,
`voices.json`'s `vendors`) is a part of one graph and stays out of the
instance list, exactly as before.

`skills/skills.json` is the worked case. It is one node with two lists:
`topics` (subdirectories that hold skill packages, bean `9umr`) and
`directories` (instance directories inside `skills/`: `voices/` in five
instances, and `lean/` in the science layer). Moving the five `voices`
entries inward cleared all five of the baselined `skills contains
skills/voices` pairs. Every `directoriesForGraph(…, "voices")` answer was
identical before and after, compared instance by instance.

Three rules the resolver holds, all measured the hard way:

- **Never through a mirror.** A `scope: "repository"` entry points at ANOTHER
  instance's directory. Following its declaration file made cat-harness
  resolve core's `voices/` as its own. (Mirrors are retired — see "The
  checkout aggregates" — but the guard stays for a downstream folio that
  has not migrated.)
- **A declaration beats a default.** `skills/voices` is also a built-in
  default; a from-within declaration replaces that convention, while an
  instance-level declaration with the same id still wins over both.
- **A MEMBER's own declaration file is read, not only the declarer's**
  (placement PR0c). In sci's chain `skills` is cat-harness's entry, and
  until PR0 only `cat-harness/skills/skills.json` was opened — so sci's
  `lean/`, `data/` and `voices/` existed only when sci was resolved alone. A
  member's from-within entries are now members of the chain too, named
  `member: "<instance>"`, `within: "<subgraph id>"`.

### Concern groups — a sub-subgraph in every grouping kind (placement PR0c)

Owner, 2026-09-29/30 (bean `9umr`): eight groups — `sdlc`, `process`,
`tools`, `kg`, `library`, `content`, `ui`, `conduct` — *"built into
location"*, split across *schemas, skills, uml, processes, library, tests*.
The same from-within rule, one more use of it:

- **Which kinds group** is a fact about the kind: `GraphTypologyDef.concernGroups`,
  with the kind's `declarationFile` as where groups are named —
  `skills/skills.json` (`topics`), `processes/processes.json`,
  `schemas/schemas.json`, `library/library.json`, `uml/uml.json`, a test
  directory's `code.json` (`groups`, `"$schema": "concern-groups/v1"`).
- **A group is a CODE** of `code-lists/concern-group.json`, which carries its
  title and definition once; its directory is the code (`processes/sdlc/`).
  A ninth code is a ruling, not an edit.
- **Declared once, inherited as members** — option A one level down. The
  harness declares a group; each higher instance's same-named
  `<dir>/<group>/` is a member (core's `skills/library/` of the harness's
  `library`). A higher instance adds no group of its own; content-type work
  goes in as PACKAGES under `content/`.
- **Declare only what exists.** A group is declared in the PR that first
  fills it; a declared-but-absent group throws.
- **One walker:** `scripts/concern-groups.ts` (`groupedChildrenIn`,
  `resolveGroups`); `packageDirsIn` delegates to it. `check:concern-groups`
  holds the four rules and prints each group with its members.

### The live case this ruling settles

Stream 1 of the #956 consolidation measured `cat-harness/content/docs/`,
2026-09-22: it **exists**, holds **14 documentation subgraphs**, and the
docs-site generators read it today — live paths, not stale ones. And
`cat-harness.json` **declares it nowhere**, while the declared `folio/` holds
three JSON files.

Bean `hs08` had recorded the absent `content` entry as the rename having
*landed*. It is the opposite: the declaration was emptied of `content/` **before**
the directory holding the content moved, leaving 14 live subgraphs invisible to
any consumer that scans the declaration. That is `dh4f` pointed the other way —
**present-but-undeclared** rather than declared-but-absent, and the worse of the
two, because the clean run is over content that is really there.

**The fix under this ruling is not to add `content/docs/` to the root
declaration.** It is a node inside the first subdirectory naming the fourteen.

**Moved 2026-10-09** (owner: *"move content/docs into docs/"*). The source now
lives at `docs/source/`, inside the docs graph it renders, and is declared FROM
WITHIN by the docs graph's own node, `docs/docs.json` (entry `docs-source`) —
the ruled half above, applied. Readers ask `docsSourceDirFor(root)` rather than
spelling the path. **The kind is ruled too:** that entry carries the existing
`docs` kind (owner, 2026-10-09: *"docs kind is fine"*), so the source node is
an existing kind used positionally rather than a new one.

### What the owner left open, and it is NOT an agent's to settle

The ruling says *"(Sub?)KGraph node"* — with the question mark. **What that node
is called, which `graphTypologies` it carries, and whether it is a new kind or an
existing one used positionally are undetermined**, and inventing a schema for it
would be exactly the move `deletion-requires-confirmation` and
`surprise-to-corpus` both guard against: an agent settling a naming question in
the corpus because it needed one to proceed.

Recorded so the next session reads the constraint rather than re-deriving it,
and knows which part is ruled and which is open:

| | |
|---|---|
| **ruled** | nesting is described from within, by a node in the first subdirectory, naming the others present there; and that structure is inherited |
| **ruled** | a root declaration reaching down a multi-level path is not allowed |
| **open** | the node's kind and name in general — `SubKGraph`, a reused kind, or something else. One case is ruled: `docs/docs.json`'s `docs-source` reuses the `docs` kind (owner, 2026-10-09) |
| **open** | whether existing multi-level declarations are grandfathered or must migrate |

## Making a field REQUIRED is a change other branches pay for

The now-retired `dependents` field had no default, deliberately: `reproduce`
shipped junk downstream and `skip` silently denied a folio its ingestion queue,
so a field whose wrong value is invisible either way had to be written down.
That reasoning was sound and the **cost landed somewhere else**, which is the
part worth knowing before you do it again. (It was retired 2026-09-30 for a
different reason — see §"A subgraph is declared ONCE" above.)

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

## Where a subgraph gets its content — `source` (owner, 2026-10-03)

> *"It's the same pattern. One of them is mounting the directory while one of
> them is mounting a branch. Another mount type could come in the future. A sub
> graph declares where it's getting its content.. It could also be a graph
> database in the future. That same information can be overwritten by the
> harness instance config."*

A "directory subgraph" and a "branch subgraph" are **one thing with two
sources**, so there is one field and one resolver, never a branch concept
beside a directory concept. Bean `l4ay`; schema `schemas/kg/subgraph-source.ts`.

- **`source`** on a `directories[]` entry is a discriminated union on `kind`.
  `{ "kind": "directory" }` — the default, so absent means it — says the
  content IS the checkout at `path`. `{ "kind": "branch", "branch":
  "cat/cat-harness/todos", "keyedBy": "tip" }` says the content lives on a
  declared repository branch and `path` is where a mount of it lands. A later
  kind (a graph database) is a new member of the union: additive, and a
  compile error at every consumer that has not decided what to do with it.
- **The branch NAME is declared once**, on the directory entry that owns it:
  its `storage` (or `source`). There is no central table — `special-branches.json`
  was removed on 2026-10-05 (owner: *"dont use /get rid of"*). A script that
  resolves a family's branch reads the folio's declaration first and keeps
  its built-in names only as a fallback (`cache-family-fallbacks.test.ts`
  keeps those in step). A branch no declaration names is a finding
  (`subgraph-source.test.ts`), never a guess at what to fetch.
- **The instance config overrides it, by id.** `"subgraphSources":
  { "<dir-id>": <source> }` inline on the instance's `index.config.json`
  entry ([`index-config`](index-config.md); a legacy `<instance>.config.json`
  is read only until it is retired, bean `ymvt`).
  `subgraphSources` moves a declared directory's content. Bringing in a whole
  instance from another repository is the entry's `source.remote`, which is a
  different field. The declaration says what the
  subgraph IS; the config says how THIS instantiation is set up, and where
  content is mounted from is that kind of fact. Matched on `id`, never `path`
  — §"Inheritance". The checkout root's config has the last word.
- **One resolver, and every consumer asks it**: `declaredSubgraph(start, id)`
  in `schemas/kg/harness-config.ts`, through `resolveSubgraphSource`. Precedence:
  config override → `source` → a legacy `storage` → `directory`. The answer
  carries `declaredIn`, so an override is never silent. Never read `source`
  off the declaration yourself — that skips the override.
- **`storage` (arc `3fva`, #1764/#1937) maps exactly**: `storage: { branch,
  keyedBy }` is `source: { kind: "branch", branch, keyedBy }`. The resolver
  reads either and refuses an entry carrying both — two answers to one
  question. A `qa` subgraph keyed by `tip` is refused whichever field says it.
  `storage` is the LEGACY spelling: write `source` in a new entry. The
  presence checks (`materialiseDirectories`, `check:declared-dirs`,
  `audit:coverage`) ask `contentIsOffCheckout`, which honours both.
- **Mounting dispatches on the kind**, and the process is
  `processes/kg/mount-subgraph.bpmn`: `directory` is the checkout path in place
  (a write is a commit); `branch` + `tip` is mounted from the tip and spliced
  back without force (`branch-store mount`/`push`); `remote` is another
  repository's tree at a full 40-character pin, laid down and locked by
  `mount:remote` and never written back (the [`remote-mount`](remote-mount.md)
  skill, bean `0mpw`); a kind with no flow is refused with its own exit code
  rather than read as an empty directory. A remote mount's effective path must
  not collide with downstream declared directories, reserved root/route names
  (`RESERVED_ROOT_AND_ROUTE_NAMES`), or sibling mounts (`checkMountPathCollisions`,
  bean `t4xb`, [`remote-mount`](remote-mount.md)).
- **The KG export publishes the resolved source** on the Subgraph node, as
  `contentSource` — `dcterms:source`, with `kind` (`dcterms:type`), `branch`
  (`dcterms:identifier`), `keyedBy` and `declaredIn` scoped inside it. A
  GitHub-hosted branch gets an `@id` that is its tree URL.

**Which layer a kind is in does not follow from its source.** `todos` is
`state` on `main` and still `state` on `cat/cat-harness/todos`; a `context`
graph could be mounted from a branch and stays read-only. See
[`content-context-and-state-graphs`](content-context-and-state-graphs.md).

### Where a NEW instance's state lives — on its own branch, by default (owner, 2026-10-06)

**This subsection owns the rule.** The scaffold skills
([`getting-started`](../../conduct/conduct-core/getting-started.md), `folio_init`)
point here and do not restate it.

Measured 2026-10-06: a folio scaffolded by `folio_init` carried `beans/` and
`todos/` on `main` from its install commit, and its declaration named neither,
so nothing could say where its work plan lived. The scaffold never asked the
`source` resolver. The owner's ruling: *fix the process*. Bean `hp54`.

- **The default is a property of the KIND, read once at scaffold time.** A
  graph typology may carry `newInstanceSource: { kind: "branch", keyedBy:
  "tip" }`, beside `perInstance`. `beans`, `todos` and `fsh-guts` carry it
  (`fsh-guts` since 2026-10-06, so a new instance's first cutover has
  somewhere to deposit — see the main half below). It is a storage fact and
  says nothing about `holds`: `fsh-guts` stays `context`. It has no
  `branch`, because a kind has no branch name to give. `folio_init` composes
  the name and writes a **complete** `source` into the new instance's own
  `<instance>.json`. After that the declaration is the one answer. The
  resolver never reads `newInstanceSource`, so it is not a second place
  answering where the content lives. It also cannot move an existing
  instance whose entry declares no source. This repository's own `beans/`
  and `todos/` stay where they are until their cutover (`fs43`).
- **The branch name is `cat/<instance>/<directory-id>`**, built by
  `instanceStateBranch` in `schemas/kg/subgraph-source.ts`. For example, the
  `dpi-h-ra` instance's branches are `cat/dpi-h-ra/beans` and
  `cat/dpi-h-ra/todos`. This is the owner's
  `cat/<harness>/<name>` ruling (2026-10-02) applied to a folio. One name does
  three jobs:
  - it names the declaration (`<instance>.json`);
  - it prefixes the bean ids (`.beans.yml` → `<instance>-`);
  - it names the state branches.

  The last segment is the directory **id**, the key that `branch-store
  mount --id` and `state:seed --id` use.
- **`folio_init` resolves each state graph through the one resolver** (after
  writing the declaration and config, so a `subgraphSources` override is
  honoured), and acts on the resolved source:

  | resolved | what `folio_init` does |
  |---|---|
  | `branch` | Declares the graph. Does **not** write it into the checkout. Adds `/<path>/**` to `.gitignore` so a mount is never committed. Prints the seed command. |
  | `directory` | Writes the graph **and** declares it. Before `hp54` the scaffold wrote it and did not declare it. |

- **Seeding is printed, not performed.** No platform command creates a new
  state branch:
  - `branch-store` refuses to ("seeding … is a steward act");
  - `state:seed` only refreshes an existing seed.

  So `folio_init` prints a self-contained shell block. Run it once from the
  new repository. It pushes an orphan tip branch holding:
  - a `state-manifest/v1` manifest marked `authoritative: true`, because a
    new instance has no `main` copy;
  - a README;
  - the graph's starting files. For `beans`, those are `beans/beans.json`
    and `beans/defs/`, and the seed must carry them: `beans:claim` reads
    `beans.json` from the branch and refuses to guess where `defs` is.

  Then `state:mount` puts each branch at its declared path. This was checked
  end to end on a fresh repository with a bare remote: init, seed, mount,
  `beans create`, `branch-store push --id beans`, `beans:claim`.
- **Cutting an EXISTING instance over is two halves, and both have a command.**
  Run both from the instance's own repository. Every default is the cwd's git
  toplevel, and `--repo-root <dir>` overrides it. Until `hp54` the default
  was the platform checkout, so a folio that links the platform refreshed
  the platform's branch.

  1. **The branch half:** `state:seed --id <id> --authoritative`. The branch
     becomes the store.
  2. **The main half:** `state:seed --id <id> --cutover`. It is a dry run
     that reports files and bytes and the deposit it would make. Add
     `--commit` to deposit, then stage `git rm -r <path>` and a
     `/<path>/**` ignore line as **one** commit naming the branch, the tree
     id and the deposit. It never pushes `main`. It refuses unless all of
     these hold:
     - the manifest says `authoritative: true`;
     - the manifest says `keyedBy: "tip"`, or the mount would be `corrupt`;
     - a declaration keeps the path on that branch;
     - nothing under the path is uncommitted;
     - `HEAD:<path>` and the branch's `<path>` are the same tree id, so the
       two copies are byte-identical;
     - the directory's **own** instance declares a `fsh-guts` graph kept at a
       branch tip, and the deposit into it lands and re-reads verified.

  **What a cutover removes goes to `fsh-guts` first — the one rule for it**
  (owner, 2026-10-06: *"cutover dirs should go to fsh-guts"*). Before any
  `git rm`, `--commit` packs `<path>/` at `HEAD` with `git archive`, checks
  the pack extracts to **the same tree id** it is about to remove, and
  splices the existing `retired/` pair onto the trashcan's tip through
  `branch-store` (never a force push, `expect: null` so it never
  overwrites): `retired/cutover-<instance>-<dir>-<tree12>.tar.gz` plus a
  same-basename `.md` declaring `folio-fsh-guts/v1`, `kind:
  cutover-snapshot`, `movedFrom`, `movedOn`, `reason: cutover`, the
  instance, `sourceCommit`, `tree` and `authoritativeBranch`. It re-reads
  the tip, and only if both blobs are there does it make the removal
  commit. No trashcan declared, a trashcan not on a tip, a branch that is
  not there, or a push that did not land: **refused, `main` untouched**,
  with the fix named. This is not a second disposal of beans — the branch
  is still the live store; the deposit is the copy `main` last held.
  `deletion-requires-confirmation` still governs: the dry run is the
  report, and `--commit` is only run on the owner's explicit go.

  Then run `state:mount`. Both halves, and the refusals, were checked end
  to end on a fresh repository.
- **A state directory nobody declared is a finding**: `undeclared-state` in
  `check:declared-dirs`. Every other check there compares declarations to
  disk. This one runs the other way, for the conventional state paths only
  (`DEFAULT_DIRECTORIES` entries whose kinds all `holds: "state"`). It
  reports and never removes anything. Whether to move the content off `main`
  is the owner's call ([`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md)).

## What a derived subgraph is computed FROM — `derivedFrom` (owner, 2026-10-04)

`source` and `storage` say where a directory's content is **kept**. `derivedFrom` says
what it is **computed from**: the declared directory ids of the graphs whose change can
invalidate it.

```jsonc
{ "id": "smart-trust-docs", "path": "docs/", "graphTypologies": ["docs"],
  "derivedFrom": ["smart-trust-artifact-index"] }
```

The owner's three rulings (bean `nama`; design note
`docs/proposals/derived-graph-dependencies-2026-10-04.md`):

1. **The edge sits on the DERIVED side.** The writer of a derived graph is what knows its
   inputs, so the edge points down the stack: an IG's pages name its artefact index, and
   the index never lists the pages. A source-side `rendersTo` (proposal #1966) was
   rejected because upstream graphs would have to name graphs above them.
2. **Generated pages and ingested indexes are in the `derived` layer**, as `library/` is,
   so a QA finding against them goes to their generator.
3. **An edge across a missing `needs` path is a RATCHET, not an error.** Example: an IG's
   pages are styled by the DAK layer's chrome, but the IG does not `need` the DAK layer. The
   gate holds such an edge as a baselined layering gap with a reason. The dependency
   stays declared and the gap stays visible.

**Data graphs only.** A generator is code. The staging cone (bean `4j86`) reaches it
through its import closure, so code is not declared a second time here.

**Rendering order** is a topological order over `derivedFrom`. Until the gate computes
it, the order in which directories are declared is the rendering order (the owner's
interim rule), and a consumer declared before its source is flagged.

**Absent means "not declared", not "derived from nothing".** A directory in the `derived`
layer either names its sources or says why not: a `library/` is derived from an
*external* publication, which is not a declared graph. Silence is not an answer. The
gate is `check:derived-from` (bean `nama`, step 2).

### The storage clock — a derived artefact is kept no closer to main than its inputs (STRICT)

Owner, 2026-10-05, after one `state:push` turned every open PR red: *"how to
fix process so wont fail?"* and *"use dependencies between KG derivations and
such (caches, auto-docs, etc)"*. Bean `0b8c`, #2230.

**A derived artefact can be current in a commit only if every input it is
computed from is kept in the commit.** Follow `derivedFrom` upstream; if any
input is kept on a BRANCH (a `source` that is not a directory, or a
`storage`), that input moves without a commit, and a committed copy of the
artefact is stale on main and on every open PR the moment somebody writes
there. No `:check` gate can hold it current, because the check and the input
are on different clocks.

**A visualisation is a derived artefact of the directory it shows.** The
edge is implicit: a viewer of X is computed from X by definition. So the rule
covers viewer pages as well as derived directories (caches, auto-docs, IG
pages).

| inputs, transitively | where the artefact is kept | what holds it current |
|---|---|---|
| all in the checkout | committed | its `:check` gate, at every commit |
| any on a branch | **built at publish, never committed** — gitignored | `derive:publish`, which runs its declared `writer` after `state:mount` |

What is declared:

- the visualisation (or derived directory) names its `writer` — the script
  `derive:publish` runs. A visualisation built at publish with no writer is
  refused (`publish-without-writer`): nothing would build it;
- nothing else. Which artefacts are built at publish is DERIVED from the edges
  and the inputs' storage, never listed — not in a workflow, not here. The
  next graph moved onto a branch (beans, todos) carries its viewers with it
  by declaring their writers.

What is checked, by `check:derived-from`:

- a **tracked** artefact with a branch-kept input is refused
  (`committed-from-branch`), naming the chain to the input;
- `--list` on `derive:publish` prints what will be built and why.

What the readers do: a visualisation built at publish **resolves by its
writer**, not by the disk (`visualisationResolves` in `schemas/kg/cat-harness.ts`).
Subgraph coverage, harness tiles and viewer declarations all ask that one
function, so the generated `docs/_data/harness.json` is the same whether or not a checkout
happens to hold a locally built copy. Asking the disk would emit one answer
locally and another in CI.

**The measured failure.** The fsh-guts viewer was committed on main while
`fsh-guts/` is kept on `cat/cat-harness/fsh-guts`. On 2026-10-05 a `state:push`
(bean `rva2`) relocated files there, and `fsh-guts:viz:check` went red on main
and on every open PR at once, until someone regenerated and committed the page —
which a sibling then had to repeat on its own PR. Bean `foaq` was the same
design seen from a dirty local mount. A take-base merge pattern for the page
(it had one) only made the collision cheap; this removes it.

### Publishing a subgraph's contents — the declared Subgraph node is the container (STRICT)

Owner, 2026-10-03: *"todos = subgraph node + todo content nodes"*. A generator
that publishes the contents of a declared subgraph (a `todos.jsonld`, a beans
graph, a library index) does NOT mint its own collection node for them. It:

1. uses the **declared Subgraph node's IRI** as the container `@id` —
   `<doc dir>/directory/<id>`, from `declaredSubgraphNode` in
   `kg-export.ts`, which is the same function the node itself is minted by
   — typed `Subgraph`, with `hasPart` to each member ([`kg-export`](kg-export.md)
   §"Subject IRIs — a path, not a `#fragment`"). Take the IRI from
   `declaredSubgraphNode`, never by composing it;
2. gives **every member `inSubgraph`** → that IRI (`dcterms:isPartOf`, the
   same term the KG export uses for the same edge);
3. carries the subgraph's resolved **`contentSource`**, so a branch-sourced
   subgraph names its branch;
4. **mints nothing parallel** — no `schema:Collection`, no `<Kind>Graph`.

The helpers are `subgraphContainer` and `memberOf` in `scripts/subgraph-node.ts`,
and `subgraphPublicationFindings` is the check: `subgraph-node.test.ts` runs it
over every adopting publisher. **Converting a publisher adds its row there.**
The declaring instance's document must be published for the `@id` to
dereference. Which documents are published, and where:
[`instance-publication`](instance-publication.md) §"What each instance
publishes".

One trap, measured while building it: do not restate the subgraph's `name` on
a container written to `<dir>/<id>.json`. A file whose `name` equals its stem
is what `findDeclarationFile` reads as an INSTANCE declaration, and the site
directory became an instance root that hid the checkout from every resolver.

### A consumer never spells a declared directory's path (bean `gz47`, ENFORCED)

Because a subgraph's source can move — from a directory to a branch, and then
somewhere else, overridable per instance — a literal `"fsh-guts/…"` or
`join(root, "beans", "defs")` breaks on the move, or goes vacuous and reads
nothing. So read the location through its resolver (`directoryForGraph`,
`fshGutsDirectory`, `beanDefsDir`, `declaredSubgraph`, …). Two ratchets
enforce this, and neither fails just because a count goes down:

| gate | what it scans | baseline |
|---|---|---|
| `check:declared-paths` | an instance's literals into its OWN declared directories | `cat-harness-tools/scripts/declared-path-baseline.json` |
| `check:foreign-paths` | an instance's literals into ANOTHER instance's directories, across the whole checkout | `cat-harness-tools/scripts/foreign-path-baseline.json` — **empty since 2026-10-03** |

- **Classify a hit by what it READS, not by how it is spelled.** A name counts
  as foreign only if the scanning instance does not declare the same name. A
  `docs/` joined onto a STAGED instance's root, or matched inside that
  instance's own declaration, belongs to that instance even though the name
  coincides.
- **A site that cannot read a declaration says why**, on the line above:
  `// declared-path-literal: <reason>`. The reason is required. A marked site
  is still reported, just not counted. Legitimate cases: the convention
  fallback for an instance that declares nothing, an ignore file, and a path
  inside another instance's declaration.
- **A file that exists today is not a stable path** (owner ruling 2026-10-04).
  `check:declared-paths` used to accept any literal naming an existing file,
  and only fired once that file moved. Under the content-source ruling the
  move is the expected case, so the exemption is now a one-way baseline. The
  witnesses recorded on 2026-10-04 stay. A NEW literal naming an existing file
  fails the gate. `--update` may drop a witness but refuses to add one, so the
  list only shrinks. Four such literals had landed unnoticed before the
  baseline was frozen.
- **The known blind spot:** only the first literal of a path call is read, so
  `resolve(opt("todos") ?? "todos")` hides its default. Review such a default
  by hand.

## Three states, as everywhere else here

- **No declaration** → `readDeclaration` returns `undefined`. An
  instance not yet migrated is ordinary, and callers fall back to today's
  conventions. Not an error.
- **Present but unreadable** → **throws.** A declaration nobody can parse
  leaves every consumer scanning the wrong directories, which is strictly worse
  than not having one.
- **An unknown graph typology** → rejected, not accepted and ignored.

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
declares nothing it does not have. A `library` entry appears in the IRIS replica's
declaration only when the corpus moves there, because a declared-but-absent
directory makes every consumer scan nothing and report a clean run over it.

## `storage` — a directory kept on a branch

A `ContentDirectory` may declare where its contents are KEPT when that is not
the checkout (bean `16ei`, arc `3fva`, and proposal `state-branch-2026-10-02`;
schema `DirectoryStorageSchema` in `schemas/kg/cat-harness.ts`, or its modern
`source: { kind: "branch", ... }` spelling in `schemas/kg/subgraph-source.ts`):

```jsonc
// Derived / QA: commit-keyed
{ "id": "qa", "path": "test/results", "graphTypologies": ["qa"],
  "storage": { "branch": "qa-reports", "keyedBy": "commit" } }

// State / work-plan: tip-keyed
{ "id": "beans", "path": "beans/", "graphTypologies": ["beans"],
  "storage": { "branch": "cat/cat-harness/beans", "keyedBy": "tip" } }
```

**A graph on another ref is still a declared directory, mounted at the declared path.**
Declaring `storage` or a branch `source` does not make it a separate concept
from a directory. The instance still accesses the graph at its declared path
(`beans/`, `todos/`, `test/results/`), whether via a working mount (e.g. worktree
mounted by `state:mount` at session start) or an in-memory branch store.

- **`keyedBy: "commit"` (derived/QA)**: Writers write the declared working copy
  path, and `bun run cat qa:publish` carries it to the branch under
  `main/<sha>/` or `pr/<n>/<sha>/`. Readers go through `qa-store` (`readQa`,
  `bun run cat qa:fetch`), which answers hit / miss / corrupt / unknown.
- **`keyedBy: "tip"` (state graphs: beans, workflow instances, todos)**:
  Represents a single living tree where the branch tip IS the state. Writers
  write to the mounted path and push via `BranchStore` (`branch-store.ts push`
  or `bun run cat state:push`), which splices changes onto the remote tip and
  pushes without force (`-f`), retrying if the tip moved. Claims and updates are
  immediately visible globally.
- **Presence checks stop expecting unmounted files on `main`**: a stored directory
  absent from the checkout tree on `main` is not "declared but absent", and
  `harness:dirs` does not create it empty. `audit:coverage` reads its kind as
  `stored` via `contentIsOffCheckout`.

Two facts to hold while the arc is in flight. **Every `qa` directory declares
`storage` since bean `5hox`**, and only after every reader had migrated —
flipping one earlier would have told the presence checks to stop looking while
readers still read the checkout. Each stored working copy is ignored by
version control, one line per declared directory, kept equal to the
declarations by `directory-storage.test.ts`. And the derived files are
**committed on `main`** until bean `5hox`'s removal lands; until then, and
after, a directory whose every kind is one the arc moves off `main`
(`qa`, `health` — `mayLeaveMain` in `scripts/qa-results.ts`) may be absent
from a checkout without that being a finding. **Judgements never move**: they
are the `attestations` kind at `test/attestations/`, on `main`, because a
regenerated file cannot reproduce them (owner ruling D2 (a)).

### A branch's README is rendered, not written (bean `esz4`)

Every special branch says what it is at its root, and a reader cannot recover
three of those facts from its files: its **status** (the store, a seed, or
retired), its **provenance** (the commit it was seeded from, and when) and how
it is **written**. A branch without them cannot be told from an abandoned one.

They are KG already, in two places, and the README is rendered from both by
`bun run cat branch:readme` (cat-harness-tools):

- the **declarations** — every `directories[]` entry whose `storage` or branch
  `source` names the branch, read where each instance declares it. Never a
  table of branches: owner, 2026-10-03 (`rva2`), *"each harness declares it,
  (and each instance can also declare), why centralize?"*;
- the branch's root **`manifest.json`**, `state-manifest/v1`, whose field set
  is `schemas/kg/state-manifest.ts`: one shape for a tip-keyed branch (seed
  commit, `graphs`) and one for a route-keyed branch (`writer`, `gate`).

`branch:readme:check` reports each declared branch `current`, `stale`
(absent, hand-written, or behind its sources) or `unknown` (the branch or its
manifest could not be read, or the manifest does not parse); `--push <branch>`
replaces the README with a describing write, the one write that may touch it.
The commit-keyed QA branch carries no manifest and is described as derived
from its declarations alone. A **family** (`branchPrefix`) has one README per
member, rendered from the family's declaration and the member's manifest, and
a branch a declared **Tool** publishes (`gh-pages`) is that Tool's to describe.

## Authoring an entry — the checklist

The rules are argued elsewhere in this skill and its neighbours; this is the
list to run down when you add or edit a `directories[]` entry, with where each
one is argued.

1. **`id`, `path`, `graphTypologies`** — required. Refer to the entry by `id`
   everywhere else; **ids are stable, paths are not** (§"Declare what exists",
   §"Inheritance"). Pick each kind by what a process does with it
   ([`content-context-and-state-graphs`](content-context-and-state-graphs.md)).
2. **`title`** — a short noun phrase a reader would put on a tab. It is the
   directory README's heading; absent, the heading falls back to the id and
   `subgraph-readmes` records a `no-title` finding.
3. **`description`** — one or two sentences **for a reader**: what the
   directory holds and what it is for, **60 words at most**
   (`DESCRIPTION_WORDS`, finding `long-description`). It is printed under the
   README heading. History, rulings, measurements and argument go in a
   `_description_comment` on the same entry (the `_<field>_comment` convention
   the entries already use) — `_` keys are annotations every loader drops
   (§"Node schemas, one per `$schema` family").
4. **Declare only what exists**, or say why not with `absent: { reason }`.
   **Where its content comes from** is `source` — omit it for the checkout
   directory; a branch source names its branch on the entry itself
   (§"Where a subgraph gets its content").
5. **`coverage`** — the `skill` that governs it and the `docs` that say what it
   is for; an opt-out carries its reason (`SubgraphCoverageSchema`). Without a
   skill the directory is unreachable by an agent even where a person can read
   it. **The visualiser is NOT declared here**: the harness declares it, at its
   own level, in `visualisers` — `covers` this directory's id (or
   `coversKinds` its kind), `renderedBy` a Tool — and it is published at
   `<base>/<harness>/<visualiser>/[<sub-graph>/]`, computed by
   `visualiserRoute` (owner, 2026-10-09; `harness-tiles` §"Where a tile goes").
   A directory never names its page, and a page never claims a directory; two
   declarations on one route fail `check:visualiser-routes`. The visualiser is
   where a node's RENDERING IRIs are derived from; the node never names them —
   `kg-viewer` §"The asset and its rendering are two resources with two IRIs".
6. **The files inside declare what they are** — front matter, a `$schema`, a
   leading comment — never an extension or a location
   (§"A sub-sub-graph", §"Every other marker"). The README's "what it is"
   column reads exactly that, so a file that says nothing shows as a gap.
7. **Generated or authored — say which, in the file.** A generated file
   carries the markers of the region it owns
   ([`readme-sections`](../../ui/ui-core/readme-sections.md)) or a header naming the command
   that wrote it, is never hand-edited, and has a `--check` twin in CI.
8. **A missing fact is a QA finding, never a blank or a guess** — the three
   states of §"Three states, as everywhere else here". Record it as a QA
   result under `test/results/` (the working copy `qa-publish` stores on the
   `qa-reports` branch); do not fill it with a plausible default.
9. **Then regenerate**: `bun run cat readme:subgraphs` renders the directory's
   README from this entry ([`liquid-templates`](../../ui/ui-core/liquid-templates.md)), and
   `bun run cat kg:export` publishes the entry as a Directory node
   ([`kg-export`](kg-export.md)).

## Naming — a self-identifying declaration, stub-named artefacts (STRICT)

The declaration carries three publication fields beside `name`:

| field | meaning |
|---|---|
| `stub` | filename stem of every artefact this instance publishes. Defaults to `name`. |
| `canonicalUrl` | where those artefacts live — the base every `@id`/`$id` is minted against |
| `previewUrl` | where CI previews are served, when that differs |

Modelled on WHO's SMART Base repository's `dak.json` (ours is the `dak`
section of `index.config.json`'s `contentTypes` since 2026-10-24; upstream's
spelling is unchanged), which carries
`canonicalUrl`, `publicationUrl` and `previewUrl` and derives its stub by
stripping the repository's prefix (`smart-<stub>` → `<stub>` →
`https://smart.who.int/<stub>`), so stub, directory and published path are one
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

Where each `<stub>.jsonld` is served, which base its `@id`s are minted
against, and what is stripped from it are not naming rules:
[`instance-publication`](instance-publication.md) §"What each instance
publishes — graph, address, schema, and what is stripped".

### Identity: `repository` and `livesAt` (owner, 2026-09-30, bean `6rmv`)

`name` is what `needs` edges and filenames resolve against, but it is not an
identity outside the instance: it names no forge or owner, and two owners may
each publish an instance of the same name. So the declaration also says which repository the
instance **is**:

| field | meaning |
|---|---|
| `repository` | `owner/name`: the **planned** home, e.g. `litlfred/cat-harness` |
| `livesAt` | `{ repository, path }`: where it sits **today**, when not at the root of `repository` |

It is **planned** rather than current because IRIs are keyed by it and must
survive the split. The pre-split fact lives in `livesAt`: `cat-harness` is
the `cat-harness/` directory of `litlfred/folio-assistant`. Leaving `livesAt`
out asserts that the instance already sits at its own repository's root.

**Never keep an `owner/repo` table by hand.**
`instanceRepositories(checkoutRoot, folioRoot?)` in
`schemas/kg/instance-repositories.ts` derives the `owner/repo ↔ name ↔ root`
map. It reads the declarations in the checkout and in the folio's dependency
overlay, and it throws when two instances claim one repository.
`instance-repositories.test.ts` is the gate. It checks three things:
- every instance declares `repository`;
- every `livesAt.path` is where the instance actually sits;
- every `livesAt` names one host.

**A reference to another instance names its `repository`, never its
`name`.** The `instance` field of a voice rule's source, a voice's
`sources[]`, a `RoleRef`, a `ThemeRef` and an `AssetSource` is typed
`RepoFullName`, so a bare name no longer parses. Every resolver matches the
reference through `declaresInstance`, which accepts either form, because
`needs` edges and internal callers still speak in names.
`instance-repositories.test.ts` checks that every committed reference
resolves.

**The `owner/repo → IRI` map is derived too.** `repositoryNamespaces()` gives
each repository's vocabulary namespace. One rule, `instanceNamespace`,
produces it, and the glossary uses the same rule:
- an instance that declares `iriBase` mints under its own release's major,
  `<iriBase>v<major>/ns#`;
- one that declares none mints under the platform site, `<stem><stub>/ns#`.

`code-lists/own-namespaces.json` still lists these namespaces, because code
reads them by code. The gate fails when the list spells one differently from
what the declaration derives. So moving an instance's IRIs is one edit, to
its declaration's `iriBase`, and the list follows.

Since 2026-09-30 (bean `yn2k`, the owner's decision), `cat-harness` and
the content core declare an `iriBase` on their planned repositories'
hosts, versioned as bootstrap's is:
- `https://litlfred.github.io/cat-harness/v0/ns#`
- `https://litlfred.github.io/folio-assistant-core/v0/ns#`

Their namespace documents are still published beside the site, as
bootstrap's are.

### Every other marker: THE TYPE DECLARES ITS OWN FILENAME (STRICT)

Settled by the owner 2026-09-20, bean `79t3` question 1. The rule above covers
the root declaration and published artefacts. For every **other** marker — the
files by which a repository asserts what it is — there is no uniform spelling
and there cannot be one:

| marker | who owns the name |
|---|---|
| `sushi-config.yaml` | SUSHI reads that exact name, and it is YAML |
| `index.config.json` `contentTypes.dak` | **ours** — bean `cz17`. Was `dak.json`; the owner moved it into the index on 2026-10-24 ("WHO will adopt harness file"). It is a SECTION, not a file: the content type declares `{ indexSection: "dak" }` (`IndexSectionMarker`). WHO's SMART Base still writes and reads `dak.json`; that IG's build reads that file into the index for one build, with a warning, until an IG moves it |
| `index.config.json` `contentTypes.ig` | **The FHIR layer's**: bean `cz17`, item 3. On 2026-10-30 the owner chose "A. ig section in index.config" over treating `sushi-config.yaml` as the marker. A repository declares itself the source of a FHIR IG with this section, registered as `{ indexSection: "ig" }` by https://github.com/litlfred/fhir-harness/blob/main/schemas/ig-content-type.ts. Carrying `sushi-config.yaml` alone does not declare an IG. The section's `include` lists the paths the harness reads. See "A marker declares what is read", below |
| `<name>.json`, `<name>.config.json` | ours |
| `beans.json`, `todos.json` | ours, and named after the graph TYPOLOGY |

One of those is not ours to rename — `sushi-config.yaml`, whose name SUSHI
owns — so any rule claiming to cover the set would still be false on arrival.
It was two until 2026-09-22, when `dak.json` was renamed on the owner's word
(and on 2026-10-24 became a section of the index);
that it *could* be renamed is what bean `cz17` settled, against this table's
own earlier claim. **So the type declares its filename, and the
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

**At the graph-typology level this is `GraphTypologyDef.declarationFile`**, and it is
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

#### A marker declares what is read, and nothing else is (owner, 2026-10-30)

> "a harness can point to a repo, but doesnt want to automatically slurpo up
> all content in a repo. harness desclares what it it pays attention to in the
> repo." (owner, 2026-10-30T12:41Z, bean `cz17`)

A content-type section is the harness's explicit statement of which parts of
the repository it reads. It is not a flag that brings in the whole repository.
`contentTypes.ig` is the first section to carry such a statement: its
`include` is a list of repository-relative POSIX paths, where an entry ending
in `/` covers a directory. The rules:

- The FHIR layer's `assertIgDeclares` refuses any path that is not on the list.
- A section with no `include`, or an empty one, declares nothing. It is never
  read as "everything".
- The list bounds this harness only. SUSHI and the IG Publisher still read
  their own inputs.
- A repository that declares no `contentTypes.ig` is a legacy IG: the FHIR
  layer reads it whole, as before, and warns once per repository per run that the
  section is missing. The warning is the prompt to declare it, not noise to
  silence.
- Every IG reader in the FHIR layer asks its `scripts/ig-read-scope.ts` before
  it reads a path. To make one see a path it skips, add the path to `include`;
  that layer's `ig-build-pipeline` skill, §"What this layer reads", says how:
  https://github.com/litlfred/fhir-harness/blob/main/skills/fhir-ig-base/ig-build-pipeline.md

A new section-shaped type should follow the same pattern: declare the paths
it reads beside the marker, and read nothing else.

### `docs/<stub>/` — the site is packaged for the split (STRICT)

The stub that names `<stub>.jsonld` also names the directory holding this
instance's renderable site: `folio-assistant/docs/`, not `docs/`. After
[#223](https://github.com/litlfred/folio-assistant/issues/223) each layer is
its own repository, so under its own stub the split is a directory move rather
than a file-by-file sift, and two layers can be checked out side by side.

**No published URL changes**, because Jekyll is pointed at the stub directory
as its **source root** (`source: ./docs/<stub>`), leaving the site's internal
layout untouched. Verified on `gh-pages` after the move.

**It is not the `folio` graph-typology declaration.** `docs/` still does not appear
in `<name>.json`: measured 2026-09-19, adding it makes `harness:dirs`,
`kg:schema:check` and `docs:harness:check` throw `unknown graph typology "folio"`,
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
  permissions/permissions.json  the actions an actor may be permitted (the ODRL profile; who holds them is policies/)
  <area>/kg-qa/*.kg-qa.json     audit sidecars, beside what they audit
  <topic>/<pkg>/*.md            skills
  <pkg>/package-manifest.json   which skills a package publishes
```

and the processes those roles act in — `processes/**/*.bpmn` and
`processes/**/decisions/*.dmn` — are reached **through the skill that
describes them**, not as standalone artefacts. A BPMN activity names the skill
that implements it (`<bootstrap.processes:skill ref>`); a lane names the role its tasks are performed in
(`partitionElementRef` → a `<bpmn:resource>` whose id is the role id); a role carries
the skills its lane's activities need. `bun run cat kg:audit` checks every one of
those joins and writes a sidecar per node. Model and resolution rules:
[`role-model.md`](../../process/process-core/role-model.md); schema: `schemas/process/role-graph.ts`.

**Not yet true end to end.** `resolveSkillDirs` (`schemas/kg/harness-config.ts`)
computes the cross-instance overlay and has **no caller**, so skill discovery is
root-only in practice today and a dependency's skills are not reachable. Stated
here rather than implied, because an agent that assumes inheritance works will
silently miss half its instructions.

## Layering — a harness module must not import the content vocabulary

The declaration schema needs the platform's IRI namespace to mint `@type`
values. That namespace used to live in `schemas/kg/jsonld.ts`, which is
the content core's **content** vocabulary — block kinds, DoCO structural
types, SPAR citation terms. Importing it would have made `agentic-harness`
depend on the content model for its own type IRIs: a `harness → core` edge,
already the largest wrong-direction group `bun run cat check:partition` reports.

It is now `schemas/kg/namespaces.ts`, a leaf that imports nothing, classified to
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
`schemas/kg/to-json-schema.ts` (Zod 4's native `z.toJSONSchema`; the older
`zodToJsonSchema` silently emptied its output under Zod 4) into
`schemas/generated/`, and `toJsonLd()` in `schemas/kg/cat-harness.ts` is the
worked example of the graph projection.

### Why Zod — the grounds, and what kind of ground each is

The owner, 2026-09-23: *"not preference on .ts, fixed on
functionality/pragmatism"*. The choice is a JUDGEMENT on what the tool does,
and stating its grounds is what lets a later reader tell whether they still
hold. **Three are functional and checkable:**

1. **It produces both renderings the graph needs** — JSON Schema natively and
   the JSON-LD projection from the same definition — so there is one source.
2. **Validation is easy**, at author time (`tsc`, the editor) and at run time
   (`.parse`), with the TypeScript type inferred rather than restated.
3. **A large, active community** — the converter replacement above was a
   version bump, not a rewrite, because the library is maintained.

**One is a HOUSE RULE, and is labelled as one.** In the owner's
trials, agents hallucinated less authoring schemas in `.ts` than in the
alternatives tried — the owner's guess is that it is easier to digest, or
costs fewer tokens. The owner calls this *unscientific*: it is an
observation, **not a measurement**, and it must not be quoted as evidence
that `.ts` is better. It is a tie-breaker between options that pass the
three functional grounds, never a reason on its own.

**What would reopen the decision:** another carrier that meets all three
functional grounds and measurably beats this one on something that matters
here. "`.ts` is what we use" is not a ground, and nor is the house rule by
itself. Keep the two kinds of ground apart when you argue it either way —
running a preference and a measurement together is how a judgement comes to
look like a fact.

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

## Adding a graph typology

Decide which layer owns it first — **if it renders, it is not the harness's.**

- A harness kind: one entry in `BASE_GRAPH_TYPOLOGIES` (`schemas/kg/cat-harness.ts`).
- A kind belonging to a layer above: a module like
  `schemas/kg/folio-graph-typology.ts` that calls `registry.register(name, def)` at
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

### Node schemas, one per `$schema` family

A kind says what shape its nodes have in up to three fields on `GraphTypologyDef`,
and they answer different questions:

| field | answers | form |
|---|---|---|
| `schema` | where is the shape written down? | a module path, or an external-schema record |
| `validator` | what can I RUN against a node? | one Zod `module#Export` |
| `nodeSchemas` | which shape does THIS node have? | `$schema` tag → `{ validator }` \| `{ shape }` \| `{ writtenBy }` |

`nodeSchemas` exists because one directory can hold several families, and a
single `validator` then names one of them and says nothing true about the rest.
`qa` holds seven. A node already says which family it is (its `$schema` tag), so
the tag is the key. The three reference forms record three different facts:

- **`validator`**: a Zod schema. Runnable.
- **`shape`**: a TypeScript interface, `module#Name`. Its fields can be read from
  source (`readShape` in `schemas/kg/kind-validator.ts`), but nothing can check a
  node against it.
- **`writtenBy`**: nothing types the family. Name the module that writes it
  (or, for an authored file, the one that consumes it), so the gap is recorded
  as data rather than left out.
- **`external`**: the node conforms to a specification nobody here types, such
  as a JSON Schema document (`https://json-schema.org/draft/2020-12/schema`).
  This is named rather than restated, and it is not a gap.

**A reference may name the harness that owns the module**:
`folio-assistant-core:schemas/catalogue.ts#CatalogueSchema`. It resolves through
the instance that declares that name, never through `../`. An escaping path is
still refused, because it resolves into whatever checkout sits next door. This
is how a harness kind whose node shapes live in core (`catalogue`, `uploads`,
`external-schema`) says so honestly.

**Top-level `_` keys are annotations** (`_comment`, `_note`). The sweep drops
them before parsing, as every loader here already does.

**The kinds still without a node schema, and why**, are recorded here so the
next agent does not re-open them:

- `code`: its nodes are TypeScript source, so the language is the schema.
- `methodology`: its nodes are Markdown prose.
- `folio`: core's renderable kind. Its block manifests are typed by the
  content adapters, not by the registry.
- `bean-defs`: Markdown in the third-party `beans` CLI's layout. That CLI's own
  GraphQL `type Bean` is drawn in `uml/harness-object-model.puml`.
- `cat-harness`: on a directory beside another kind it is the umbrella, not a
  node kind.

**Declaring `nodeSchemas` claims the map is COMPLETE.** `check:kind-validators`
routes every JSON node in the kind's declared directories by its tag. It fails
on a tag the map does not name, on a reference that does not resolve, and on a
node that fails its family's Zod schema. `kg:validate` routes the same way.
`gen-uml-overview.ts` draws one class per family.

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

`bun run cat check:published-refs` enforces this; advisory, `--strict` to fail. It
reports each carrier's count **even when that count is nought**, because a
gate that silently covers nothing and exits 0 is this repository's most
expensive recurring defect (`xom7`, `dh4f`, `a6kl`).

Full scheme, including what an instance's version means and what makes it go
up: [`cat-harness/docs/proposals/instance-versioning.md`](../../../docs/proposals/instance-versioning.md).

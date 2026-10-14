---
name: recommendation-extraction
description: >
  Extract the recommendations of an L1 source as L1 3.0 recommendation and
  remark nodes, then describe each one's scenario: the persona (role) who acts
  on it, the business process they act in, and the user story, as smart-kg L2
  user-scenario candidates that reuse the target guide's own vocabulary. Read
  before extracting recommendations from a WHO guideline or position paper
  with no printed "Recommendation N" labels, before linking a recommendation
  to a DAK persona or process, and whenever a recommendation has to say who
  does it and where. Covers the hybrid extraction (mechanical candidates, agent
  structuring, verbatim and 100 % coverage gates), the reuse-first precedence
  for personas and processes, the WARNING format, and sign-off.
---

# recommendation-extraction

> Skill id: `recommendation-extraction` · Package: `authoring-who-smart-guidelines` ·
> Follows [`dak-l1-library`](dak-l1-library.md), which builds the library and
> the layout graph this extracts from. Bean `kvd2`.

**A recommendation that does not say who does it, and during what, cannot be
implemented.** Owner, 2026-10-10: *"as part of extracting a recommnedation the
scenario (user story,role) get described … we need [a process] for a role …
skill is to reuse existing vocabulary if possible … the process should be
chosen from existint smart-immz processes if possivle. warn if not … reuse
existing schema."*

Every recommendation will end up in a SMART Guideline that is a **clinical**,
**public-health** or **health-system-strengthening** guideline, and will feed
the L2 assets derived from it. This skill records that, per recommendation,
before any L2 asset is drawn.

## The two halves

| half | produces | layer | schema |
|---|---|---|---|
| extraction | `recommendation` and `remark` nodes, verbatim | L1 | L1 **3.0**, `kg/src/l1.ts` in litlfred/smart-base (`KGRecommendation`); not smart-kg 1.0 |
| scenario | one `user-scenario` candidate per recommendation, joined to `persona` and `business-process` | L2 | smart-kg `ontology/l2/l2.json`, unchanged; smart-base `UserScenario.fsh` |

No new L1 field carries the scenario. L1 holds what WHO says; who does it, and
during which process, is adaptation, and adaptation is L2's.

## Part 1 — extraction (hybrid)

**Candidates are mechanical, structure is an agent's, and the gates are
mechanical again.**

1. **Ingest the source** (see `dak-l1-library` steps 1–2):
   `bun run ingest uploads/<doc_id>/<doc_id>.pdf --library <lib>`.
2. **Fast path — a guideline that prints labels.** When the source prints
   `Recommendation N:` labels,
   `bun run smart-base/scripts/extract-smart-kg-l1.ts --entry smart-base/library/<id>`
   extracts them by label. It found **0** in the measles position paper, which
   prints none; that is why the hybrid path exists. (It still writes L1 1.0.)
3. **List the normative sentences.** Run core's `l1-coverage` with an empty
   capture list; every sentence carrying a marker (`should`, `shall`, `must`,
   `recommend*`, `should not`, `may be given/administered/offered/…`) comes
   back as `unaccounted`, with its page:

   ```sh
   echo '[]' > captured.json
   bun run cat l1:coverage --text pages.json --captured captured.json --out candidates.json
   ```

   `--text` is body text only, page-tagged; strip references and running
   headers first (`l1-coverage` says why).
4. **Structure them.** An agent turns each candidate into an L1 3.0
   `recommendation` (`identifier`, `statement`, `kind`, `population`,
   `intervention`, `setting`, …) or a `remark` (`text`, `remarkType`) attached
   by `hasRemark`. Rules:
   - `statement` and `text` are **verbatim** — the printed words, line breaks
     joined, nothing else changed. A paraphrase is a different
     recommendation;
   - a sentence that is history, background or a manufacturer's statement is
     not forced into a node; it is **proposed** for exclusion (step 5);
   - GRADE strength and certainty are set only where the source prints them;
   - every node is `inferred`, with a note and evidence (page and quote).
5. **Gate: 100 % accounted for.** Re-run with the captured statements and the
   exclusions:

   ```sh
   bun run cat l1:coverage --text pages.json --captured captured.json \
     --exclusions exclusions.json --out coverage.json
   ```

   Exit 0 only at 100 %. An exclusion counts only with `signedOffBy`: **an
   agent may propose one, only a person signs it**, and the reason is one of
   the fixed five (`background-fact`, `manufacturer-statement`, `editorial`,
   `research-question`, `duplicate-of:<id>`).
6. **Gate: the graph's shape.** Validate the L1 3.0 document with the Zod port:
   `npx tsx src/validate.ts <graph.json>` from `kg/` in a smart-base checkout
   (what `--validate-zod` runs in the sibling scripts).

## Part 2 — the scenario

### The shape (D3: L2 nodes, reused unchanged)

Per recommendation, one `user-scenario` (smart-base `UserScenario`: `title`,
`id`, `description`, `personas[]`) joined by the three edges smart-kg L2
already licenses:

```
recommendation   implementedBy  user-scenario
user-scenario    involves       persona
business-process realises       user-scenario
```

The `description` is a user story:

> As a *&lt;persona&gt;*, during *&lt;process&gt;*, I *&lt;act&gt;* so that *&lt;outcome&gt;*.

Each link records its **source**, as an intake `classifications` entry does
(`cat-harness/schemas/intake.ts`):

| source | meaning | smart-kg derivation |
|---|---|---|
| `declared` | a person said so; names `by` | `decided` |
| `context` | the section the statement is printed under settles it | `inferred` |
| `inferred` | an agent's reading of the statement | `inferred` |

and a **status**: `candidate` until a person reviews the entry.

### Reuse first, stop at the first hit (D4)

| what | 1st | 2nd | otherwise |
|---|---|---|---|
| persona | the target guide's own personas | smart-base's generic `DAK.Persona.*` (`input/fsh/actors/`, ISCO / CDHI) | a glossary **candidate**, and a WARNING |
| process | the target guide's own processes | a domain process catalogue — **none exists yet** (smart-base-clinical holds no processes; bean `2ipj`): report "catalogue absent" | `could-not-determine`, and a WARNING |
| domain | `clinical` \| `public-health` \| `health-system-strengthening`, per scenario, with its source | | the SKOS scheme is bean `398x` |

**Never invent a process.** A process that is not in the guide is
`could-not-determine`, and the warning says why — that warning is the evidence
the guide (or a catalogue) is missing one, which is worth more than a
plausible-sounding process nobody can find. Choose the persona who **acts** on
the statement, not the one it is about: "Vaccine should be offered to
travellers" is acted on by the health worker. A persona a guide's description
does not cover (an immunization DAK's health worker treating measles) falls to
the next rung rather than being stretched.

Read the **statement**, not its section: "Countries should achieve ≥95 %
coverage" sits under *WHO position* and is acted on through coverage analysis
(IMMZ.I), while "MCVs should not be given to individuals with … severe
immunosuppression" is a per-client check (IMMZ.D, IMMZ.D5). A national policy,
schedule-design or programme decision is not a per-client process.

### Run it

1. **The vocabulary.** For smart-immunizations, read its two pages into the
   vocabulary JSON; for the generic rung, read smart-base's ActorDefinitions:

   ```sh
   bun run smart-base/scripts/l1-scenario-vocabulary.ts --immz <smart-immunizations checkout> --out immz-vocabulary.json
   bun run smart-base/scripts/l1-scenario-vocabulary.ts --fsh-actors <smart-base checkout>/input/fsh/actors --out smart-base-generic-personas.json
   ```

   Each file records the repository, the commit, and the file and line every
   entry came from. Persona ids are `slug(title)` where the guide prints none
   (what smart-kg `kgid.mjs` mints a persona IRI from); process ids are the
   printed Process IDs.
2. **The mapping** (`l1-scenario-mapping/v1`, YAML), authored: per
   recommendation, its `personas` (an `id`, or a `candidate` term), its
   `process` (an `id`, or `could-not-determine`), `act`, `outcome` and
   `domain`, **each with a `source` and a `basis`**. A basis quotes the
   statement, the vocabulary row or the person's ruling. An unexplained link is
   a guess.
3. **The candidates:**

   ```sh
   bun run smart-base/scripts/l1-recommendation-scenarios.ts \
     --l1 <recommendations.yaml | l1-graph.json> --vocabulary immz-vocabulary.json \
     --generic smart-base-generic-personas.json --mapping mapping.yaml --out <dir> [--check]
   ```

   It writes `scenario-candidates.l2.json` (an L2 graph document) and
   `scenario-warnings.md`, and **refuses**:
   - an id the vocabulary does not hold — a typo is not a new process;
   - a recommendation with no mapping entry — coverage is 100 %;
   - a mapping entry for a recommendation the source does not hold;
   - a `declared` link that names nobody.
4. **Tier 2.** `node tools/validate.mjs <l1-graph.json> scenario-candidates.l2.json`
   in a smart-kg checkout; give it the L1 document too, or every
   `implementedBy` edge reads as dangling.

### The WARNING format

One line per warning, greppable, in the report and on stderr:

```
WARNING process-not-determined <key>: no <guide> process (<ids>) realises this; domain process catalogue absent. <basis>
WARNING persona-glossary-candidate <key>: persona "<term>" is a glossary candidate — … <basis>
```

A warning is not a refusal: the run succeeds, and the warning is the work
list for whoever owns the guide's processes or the glossary.

### Review and sign-off

Everything this skill writes is a **candidate**. A person reviews an entry and
records it in the mapping (`review: {by, at}`); the run then marks that entry's
links `reviewed`. A person may also turn a link `declared` (with `by`). An
agent never writes either. The coverage exclusions of Part 1 are signed the
same way.

## What smart-kg L2 could not hold

`user-scenario` declares only `id`, `title`, `description`, `sourceKind`,
`source` and `resolutionStatus`, and tier 2 refuses any other node property.
So `domain`, each link's `linkSource` and the `reviewStatus` go on the edges'
open `properties`; the act and outcome live only inside `description`. If they
are to be queried as fields, smart-kg's `user-scenario` (or `UserScenario.fsh`)
needs the properties.

## What it feeds, later

The scenarios are the hinge to L2. Each `realises` edge names the process —
and so the **BPMN** whose lane is the persona — a scenario will be drawn in;
the recommendation's conditions become **DMN** rules (for measles, the
IMMZ.D2.DT.Measles.* and IMMZ.D5 tables already exist); and the user story
becomes a functional **requirement** (`functional-requirement fulfilledBy
persona`). None of that is drawn here. `could-not-determine` scenarios are the
ones with no process to draw into yet.

## The worked example

`smart-base/scripts/fixtures/l1-recommendation-scenarios/measles/`: the 75
recommendations of the WHO measles position paper (WER 92(17), 2017) against
smart-immunizations at `86898e6`, with the vocabulary, the mapping, the output
and the warnings. `smart-base:l1-scenarios:measles:check` keeps it current. Its
real home is smart-immunizations' library.

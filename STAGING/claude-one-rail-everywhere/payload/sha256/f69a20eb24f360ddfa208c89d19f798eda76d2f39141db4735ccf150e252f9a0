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
| extraction | `recommendation` and `remark` nodes, verbatim — or, for implementation guidance, `implementation-practice` nodes | L1 | L1 **3.0**, `kg/src/l1.ts` in litlfred/smart-base (`KGRecommendation`); `implementation-practice` is the `l1-library` extension, `kg/src/l1-library.ts` (`KGImplementationPractice`); not smart-kg 1.0 |
| scenario | one `user-scenario` candidate per recommendation, joined to `persona` and `business-process` | L2 | smart-kg `ontology/l2/l2.json`, unchanged; smart-base `UserScenario.fsh` |

### Implementation guidance prints practices, not recommendations (owner ruling 1b, 2026-10-12)

A guideline's recommendation is a GRC-approved normative statement. A
publication whose `publicationType` is **`implementation-guidance`** (or
**`methodology`**) "makes no recommendations of its own" (handbook for
guideline development §1.9) — a "how to" document, such as a digital
transformation handbook with its own "Best practices" lists. What it prints as
normative is an **`implementation-practice`** node, a class of its own, never a
`recommendation` with a new kind code: every `recommendation-kind` (including
`good-practice-statement`) is a guideline's.

- Record the type in the curation: `publication.publicationType`. With
  `implementation-guidance` or `methodology`, every `as: recommendation`
  decision emits an `implementation-practice` node at
  `<publication>/implementation-practice/<key>`, and the graph names
  `l1-library.context.jsonld` so the validator scopes L1 + the extension.
- The class lives in `kg/src/l1-library.ts`, **not** `kg/src/l1.ts`:
  `generated/l1/l1.json` must stay equal to WHO smart-kg's (`kg/test/parity.test.ts`).
- It carries `identifier`, `statement` (verbatim) and `contentHash`; no `kind`,
  `direction`, `strength` or certainty — nothing graded it. A `kind` on such a
  decision is refused.
- **No remark.** L1 3.0's `remark` is minted under a recommendation, so a
  `remark` decision in such a publication is refused: exclude the sentence,
  make it its own practice, or wait until remark is licensed on a practice
  upstream.
- `kg/src/validate.ts` refuses a `recommendation` defined in an
  implementation-guidance or methodology publication.
- The output file is `l1.json`. It was `recommendations.l1.json` until the
  owner ruled, 2026-10-12, *"Rename to l1.json"*: the graph holds
  implementation-practice nodes as well as recommendations, so the old name
  was inaccurate. No alias is kept; the scenario half and its run context pin
  the graph by path and were regenerated against the new one.

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

### Part 1 as a tool: `l1-recommendation-candidates`

Steps 3–6 are one Tool node (`smart-base/tools/index.ts`), run twice around
the agent's judgement:

```sh
# 1. mechanical: the work list — every normative sentence, with hints; nothing decided
bun run smart-base/scripts/l1-recommendation-candidates.ts --entry smart-base/library/<id> --out <dir>
# 2. agent: write <dir>/curation.yaml (l1-recommendation-curation/v1), one decision per location
# 3. mechanical: the gates, and the L1 3.0 graph
bun run smart-base/scripts/l1-recommendation-candidates.ts --entry smart-base/library/<id> \
  --curation <dir>/curation.yaml --out <dir> [--check]
```

**The curation is the agent's step, and only the agent's.** The script hints
(`licence-or-imprint`, `glossary-page`, `layout-fragment`) and proposes the
publication's identity from the printed ISBN; it never decides. Per candidate
location (`p<page>:s<n>`, `l1-coverage`'s own), the agent records one of:

| `as` | means | fields |
|---|---|---|
| `recommendation` | an L1 `recommendation` node | `key`; `statement` only to narrow a joined list to one bullet, or to join a split sentence; `kind` only where printed |
| `remark` | a `remark` of a recommendation, by `hasRemark` | `of`, `remarkType` |
| `part-of` | inside another recommendation's statement | `of` |
| `exclude` | a PROPOSED exclusion, one of the fixed reasons | `reason`; `signedOffBy` is a person's acting as `l1-extraction-reviewer`, never an agent's |

Every decision carries a `basis`. A location may carry a list of
`recommendation` decisions: the splitter reads a bulleted list as one sentence.

It **refuses** a statement not printed in the entry (normalised), an override
that neither contains nor is contained in its candidate, a location the entry
does not hold, a reused key, and a remark of an undeclared key — then checks
the graph with `kg/src/validate.ts`. It writes `recommendation-candidates.json`
(the work list), `l1.json`, `exclusions.proposed.json`,
`extraction-warnings.md` and `run-context.json`.

**Who signs an exclusion (owner ruling 3b, 2026-10-12).** Each record in
`exclusions.proposed.json` names the role that must sign it, as a role-graph
`RoleRef` (`cat-harness/schemas/role-graph.ts`): `"signerRole": {"role":
"l1-extraction-reviewer"}`. The role is declared in
`smart-base/scenarios/roles.json` (title *L1 extraction reviewer*, a person,
inheriting the harness's `reviewer`). The record stays unsigned — no
`signedOffBy` — until a person acting in that role signs it; the skills and
processes that equip the role are bean `4nfs`.

**Provenance.** Each run of either tool writes a cat-harness
`folio-run-context/v1` (`schemas/run-context.ts`) as `run-context.json`
beside its output — the platform commit, the mounts, the script and its hash,
the inputs' hash basis — the same record `pdf-ocr.py` writes at ingest. The
work list cites it by reference. `--check` ignores the context, as it ignores
`generatedAt`: a context moves with every commit.

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

1. **The vocabulary.** For the target guide, read its two pages
   (`business-processes.md`, `personas.md`) from a guide checkout into the
   vocabulary JSON; for the generic rung, read smart-base's ActorDefinitions:

   ```sh
   bun run smart-base/scripts/l1-scenario-vocabulary.ts --guide <guide checkout> --out guide-vocabulary.json
   bun run smart-base/scripts/l1-scenario-vocabulary.ts --fsh-actors <smart-base checkout>/input/fsh/actors --out smart-base-generic-personas.json
   ```

   Each file records the repository, the commit, and the file and line every
   entry came from. The guide's name, namespace and repository are read from
   the checkout itself — its `<name>.json` declaration and its
   `sushi-config.yaml` `canonical` — so the script names no guide. Persona ids are `slug(title)` where the guide prints none
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
     --l1 <recommendations.yaml | l1-graph.json> --vocabulary guide-vocabulary.json \
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
agent never writes either. The coverage exclusions of Part 1 are signed by a
person acting as `l1-extraction-reviewer`, and by no one else.

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

## The worked examples

**An ingested handbook, end to end.**
`smart-base/library/9789240116191-eng/l1-extraction/` is the *Digital
transformation handbook for health product catalogue* (WHO, 2025) run through
both tools: 48 normative sentences. The handbook is implementation guidance,
so the agent's curation took **22 implementation practices** (not
recommendations; ruling 1b) and proposed 30 exclusions (licence text, glossary
definitions, background on SMART Guidelines, chapter checkpoints, and the
definition of the data owner on page 26, which was a remark of NPC-R06 until
ruling 1b made NPC-R06 a practice) — each naming `l1-extraction-reviewer` as
its signer and none signed, so coverage reads 18/48 captured until a person
signs them. The
scenarios reuse the handbook's own roles (data owner, custodian, steward,
project manager, solution architect: 18 links), one generic
`DAK.Persona.DataManager`, and 3 glossary candidates (the national regulatory
authority, twice, and the master data governance group). The handbook prints no
business process with an id and no health-system catalogue exists (bean
`2ipj`), so all 22 are `could-not-determine`: 26 warnings, one of them
`practice-implementedBy-unlicensed` — smart-kg's L2 licenses `implementedBy`
from a recommendation only, so from a practice it is a proposal for L2. That is the result,
not a defect: it is the work list for the catalogue. The test
`l1-recommendation-candidates.test.ts` keeps it current.

**An authored L1, scenario half only.**

The 75 recommendations of the WHO measles position paper (WER 92(17), 2017),
mapped against the immunization guide's own personas and processes, with the
vocabulary, the mapping, the output and the warnings. It lives in that guide's
library, which is its home, with the check that keeps it current (owner,
2026-10-14). smart-base, which every guide builds on, holds no guide's example:
<https://github.com/litlfred/smart-immunizations/tree/main/library/l1-recommendation-scenarios/measles>.
The generic rung it was run with stays here, as
`smart-base/scripts/fixtures/l1-recommendation-scenarios/smart-base-generic-personas.json`,
because the handbook example above uses it too.

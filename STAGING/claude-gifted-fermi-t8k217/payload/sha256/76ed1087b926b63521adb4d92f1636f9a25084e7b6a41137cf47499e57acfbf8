---
# folio-assistant-4ak5
title: 'PER-HARNESS KG EXPORT: every instance publishes its own JSON-LD + schema (split cat-harness.jsonld); root index.jsonld meta-skeleton at depth 1'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T21:36:29Z
updated_at: 2026-10-05T15:13:08Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02, verbatim: "bean: please make sure harnesses generate json(ld)+schema for their semi-static KGs, their subgraphs etc. there are some rules in the KG corpsu but scattered. right now, i dont see folio-assistnat.jsonld in gh-pagaes for example. i think all subsumted into cat-harness? these should be split out into their component sub-grpah/harnesses. see related beans. maybe we also need index.json index.jdonld at root of repo as meta-sleton naming all the KG harnesses (and maybe materialziing them at depth 1 so a single retriveal gets the subgraph/harness metadata, no heavy assetds)"

## What is true today
Measured 2026-10-02 against `origin/gh-pages` (the site built from `909678c`) and `.github/workflows/docs-site.yml` on `main`:

- **The site exports one harness graph, and it is everything at once.** The step "Export the knowledge graph and its schema" runs `kg-export.ts` once, for `print-stub.ts ./cat-harness`. It writes `cat-harness.jsonld`, its `.json` copy and the translated `cat-harness.{ar,es,fr,ru,zh}.jsonld`, plus `harness-schema-export.ts` output. `kg-export.ts` walks the whole tree, so content declared by other instances is subsumed into `cat-harness.jsonld`. That matches the owner's reading: "all subsumed into cat-harness".
- **`bootstrap` is the one other instance with its own export**: `bootstrap/bootstrap.jsonld`, from `bootstrap-tools/scripts/export-graph.ts`.
- **A few other graphs are published on their own:**
  - `cat-harness-glossary.jsonld` and `cat-harness-code-lists.jsonld`;
  - per-instance `ns.jsonld` (`cat-harness/`, `folio-assistant-core/`, `bootstrap/`);
  - `fsh-guts.jsonld`, which is deliberate (docs-site.yml line ~503). Bean `9c7h` will need to revisit it;
  - `assets/prov/*.prov.jsonld`.
- **Instances with a declaration (`<instance>/<instance>.json`) but NO published graph:**
  - `cat-harness-tools`, `fhir-harness`;
  - `folio-assistant-core`, which has only `ns.jsonld`;
  - `folio-assistant-sci`;
  - `smart-base`, `smart-ig`, `smart-immunizations`, `smart-trust`;
  - `who-iris`, which has only `dublin-core/`;
  - `who-style-guide`.
  - The state graphs `beans/`, `todos/` and `interaction/` declare themselves too.
- **There is no `folio-assistant.jsonld`.** The repository root has no instance declaration of its own: it is a container of instances, not one.
- **There is no root index.** Nothing at `<site>/index.jsonld` or `<site>/index.json` names the harnesses, so a consumer cannot discover them without already knowing the stubs.

## What this bean asks for
1. **One JSON-LD export plus one schema per declared instance (harness or folio)**, written to `<site>/<stub>/<stub>.jsonld`, with its `.json` copy and `<stub>/schema/…`. Each export covers ONLY the directories that instance declares in its `<instance>.json`. Dependencies are REFERENCED by IRI, not inlined. That is the instance-level case of bean `c1m4`'s referenced/hydrated pair.
2. **Split `cat-harness.jsonld`** into its component instances. `cat-harness.jsonld` then holds only `cat-harness`'s declared directories. Keep a redirect or alias at the old URL for one release, because published `@id`s point at it.
3. **A root meta-skeleton at `<site>/index.jsonld`** (plus `index.json`, and a committed copy at the repository root) that names every KG harness or instance. Each entry is materialised to **depth 1**:
   - stub, title, description and version;
   - `dependsOn`;
   - the declared directories with their graph kinds;
   - the IRIs of its export, schema and named subgraphs (c1m4);
   - counts and a content hash.

   It carries **no heavy payloads**. One fetch gives a consumer the whole harness map.
4. **Gather the scattered rules into ONE skill.** The rules on which graph is published, where, under what IRI, with which schema, and what is stripped (fsh-guts, unpublished kinds) are spread over at least:
   - `kg-export.ts`'s docblock and `docs-site.yml` comments;
   - `kg/kg-core/directory-conventions.md`, `content-context-and-state-graphs.md` and `fsh-guts.md`;
   - `ui/ui-core/kg-viewer.md`;
   - bean `x3bd` (topical KG directories) and bean `9wb0` (publication is a state).

   Pick the home with `where-does-this-go`. Fold the rules into it and leave pointers behind.
5. **Add a gate.** A check fails when an instance with a declaration has no export on the site, or when the root index names an instance with no export, or misses one.

## Related
- Epic `whlc` (this bean's parent), especially:
  - `c1m4`: the subgraph contract and its IRIs `<BASE>/subgraph/<HARNESS>/<NAME>/{index,hydrated}.jsonld`; the root index is its top level;
  - `f233`: skeleton vs payload; the root index is the skeleton of skeletons;
  - `q8ar`: late materialisation;
  - `ax6r`: the generated workflow index.
- `7x5n`, the separation epic: per-instance exports are what lets each harness be seeded standalone. `ho66` covers the standalone rehearsal.
- `x3bd`: topical KG directories. `9wb0`: publication state.
- Owner ruling 2026-10-02, special branches `cat/<harness>/<name>` (note on `fs43`): the same `<harness>/<name>` path shape, so a harness's branches, subgraphs and exports line up.

## Done when
- [ ] every declared instance has `<site>/<stub>/<stub>.jsonld`, its `.json` copy and a schema, each scoped to its own declared directories
- [ ] `cat-harness.jsonld` holds only cat-harness's own graph; the old URL resolves for one release
- [ ] `<site>/index.jsonld` and `index.json` name every instance at depth 1, with no payloads, plus a committed root copy
- [ ] one skill holds the publication rules; the old locations point to it
- [ ] a CI gate enforces export-per-instance and the completeness of the root index



## Claimed 2026-10-04 — items 1 and 5 only (session_01Jf39Vh4B8EQT6TBYzTtMCA, branch claude/zealous-thompson-y8dcf1-4ak5)

Scope agreed with the owner: items 1 and 5. Items 2–4 (the split, the root index, the rules skill) are offered to session_01AxhsSvodhTgaioG1nUBWkh, which holds c1m4/f233/q8ar/ax6r; no reply yet. The root index is proposed as built at publish time rather than committed; that change to this bean waits on that session and the owner.

- **Item 1:** `scripts/instance-exports.ts` exports every declared instance the site did not, derived from the declarations. Eleven new documents: bootstrap-tools, cat-harness-tools, cat-openapi, fhir-harness, folio-assistant-core, folio-assistant-sci, the four smart-*, who-iris. cat-harness, the checkout root and bootstrap keep their own publishers, named with why in PUBLISHED_ELSEWHERE.
- **Item 5:** `check:published-instance-exports` now fails when the deploy does not run the derived publisher, when a workflow running it drops an exempt instance's own publisher, or when an exemption names no declared instance.



## Owner ruling 2026-10-04 — the root index is built at publish time, not committed

Asked: build the root index (item 3) only when the site publishes, with no committed copy at the repository root? The owner answered **"1"**, i.e. *"Yes, build it at publish time only."* So item 3's "plus a committed root copy" and the matching Done-when clause are dropped. Why: a committed generated file conflicts whenever two PRs change the set of harnesses, the churn measured across this session's merges. q8ar's slices already work this way. Item 3 stays with session_01AxhsSvodhTgaioG1nUBWkh.



## Claimed 2026-10-05: item 2 only (session_01BccmnVFbtRpKxM39kyVw9q, branch claude/4ak5-item2-split-cat-harness-jsonld)

Item 2 was offered to session_01AxhsSvodhTgaioG1nUBWkh, which held c1m4/f233/q8ar/ax6r. That session stalled, and this session took over its work, including #1955 (owner, 2026-10-04). Item 3 landed with #1955. Items 1 and 5 landed from session_01Jf39Vh4B8EQT6TBYzTtMCA.

**Owner ruling, 2026-10-05: the full split (option B).**
- cat-harness.jsonld is exported in instance scope, so it holds only cat-harness's own declared directories.
- Every dropped @id gets a deprecated tombstone, with owl:deprecated and dcterms:isReplacedBy pointing at the owning instance's export, for one release. GitHub Pages cannot redirect a fragment IRI.
- gen-subgraph-jsonld frames each instance with its own export's @ids, so the committed subgraph tree stops minting cat-harness.jsonld#<foreign> fragments.
- Measured before the change: about 850 of cat-harness.jsonld's nodes belong to other instances (folio-assistant-core ~511, fhir-harness ~142, folio-assistant-sci ~107, smart-base ~87, who-iris 2).



## Item 4 (2026-10-05, session_01BccmnVFbtRpKxM39kyVw9q, branch claude/4ak5-item4-publication-rules-skill)
The publication rules now live in instance-publication, §"What each instance publishes — graph, address, schema, and what is stripped". The router (where-does-this-go, row 10) points there. The other locations now point to it instead of restating the rules: kg-export.ts, docs-site.yml, directory-conventions, fsh-guts, kg-viewer, kg-export.md, and content-context-and-state-graphs (See also). Beans x3bd and 9wb0 each have a note appended.

Still open, so the item 1 box stays unticked: no instance publishes its own schema yet. instance-exports.ts writes only the document and its .json copy.



## Item 1, schema half (2026-10-05, session_01BccmnVFbtRpKxM39kyVw9q, branch claude/4ak5-per-instance-schema)
**Owner ruling, 2026-10-05: option B.** Each instance publishes <site>/<stub>/schema/:
- its own skill I/O contracts, with $id under its own base. Measured: 28 are unpublished today (folio-assistant-core 12, fhir-harness 8, folio-assistant-sci 6, smart-base 2).
- its own Zod schema modules, rendered to JSON Schema.
- a <stub>.schema.json index that $refs the shared declaration schema and lists the rest.
The export links to the index, and a gate checks that each instance publishes them.

Which Zod exports are public: exactly the schema nodes the instance's own export already lists (schema-nodes.ts), so there is one answer, not two.

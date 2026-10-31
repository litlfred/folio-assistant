---
name: figure-rebuild
description: >
  Turn a source publication's figures into computable diagrams when a folio
  is built from its L1 entry. Every declared figure gets a block, and each one
  is rebuilt in the form its type calls for: an ArchiMate view, BPMN, DMN, a
  FHIR logical model, or an SVG generated from data, always from one schema-backed source. The PDF crop stays
  beside the rebuild as the cited source. The figure-coverage check counts
  what is missing and what is still only a picture.
graph-typologies:
  - library
---

# Figure rebuild: a figure is data, not a picture

Owner, 2026-10-31, after reading the ingested product catalogue and supply
chain handbooks (litlfred/dth-pc, litlfred/dth-sc): *"the ingested dth-pc and
dth-sc did not have any of the figures that i could see.... where they
extracted into KG? can we recreate them computably?"* The owner then chose to
**pick the form by figure type** (option A).

Two separate failures sat behind that question:

1. **Figures went missing silently.** The vector arm matched only `Fig.` and
   `Figure`, and the supply chain handbook writes `Fig 1.`, so nine of its 32
   figures had no render and no block (cat-harness-tools#1119). Nothing
   compared the publication's declared figures with the folio's blocks.
2. **The figures that did arrive were pictures.** A `figure` block whose
   `file` is `vfig-pNNN.png` has a caption, a page and glossary links in the
   KG. Its boxes, arrows and labels are pixels: no query can reach them.

## The steps, after the folio is seeded

1. **Every declared figure has a block.** Run
   `bun run cat figure:coverage --entry <library>/<doc-id> --folio folio/<doc>`.
   A `missing` figure is a bug in extraction or seeding. Fix that (re-run the
   vector arms, inspect, place the block) rather than excluding it. The one
   legitimate block exclusion is content the folio may not copy, such as a
   third-party figure used by permission. It is signed off by a person
   (`scope: "block"`), and the folio says in prose what the figure was.
2. **Classify each figure by what it draws**, by looking at the render, never
   by its labels alone (see `l1-document-ingestion`, "the text layer is not
   the figure"):

   | The figure draws | Rebuild as | Where it lives |
   |---|---|---|
   | actors, systems, components, layers of an architecture | an **ArchiMate view** | the reference architecture the folio mounts (e.g. smart-ra `tools/archimate-dth/`), linked from the block's `meta.figureViews` |
   | a workflow with tasks, gateways, lanes | **BPMN 2.0** | the folio's `processes/`, or the DAK it is adapted from |
   | a decision or a transition rule | **DMN 1.3** | `processes/decisions/` |
   | classes, attributes, cardinalities | **FHIR logical models** (FSH), drawn as a UML class diagram generated from them | the upstream IG (e.g. smart-pcmt), else a litlfred FSH repo |
   | a graph of named boxes and arrows | find what the boxes ARE (processes, actors, systems) and model it as **ArchiMate** elements and relationships | the reference architecture |
   | phases, layers, nested shapes, a tree, a staircase | an **SVG generated from data**: a data file plus a generator script, like dth-hrh `scripts/folio/diig_phases_hrh.py` | the folio's `media/` with the generator beside it |
   | a table of values drawn as a picture | a **table** block | the block |
   | a country example, a photograph, a screenshot, a third-party figure | **keep the cited picture** (`scope: "rebuild"` exclusion, signed off) | unchanged |

   **One source, never a copy (owner, 2026-10-31: "dont want to duplicate
   content").** Every rebuilt figure is generated from, or links to, ONE
   schema-backed source: an ArchiMate model, a BPMN or DMN file, a FHIR
   logical model, or a data file whose labels are glossary IRIs. A figure
   that appears in several publications (the DIIG phases chart, the SMART
   Guidelines layers, the ANC workflow) has one source in the layer they all
   mount, and each folio points at it. Content that already lives upstream
   (smart-pcmt's FHIR models for dth-pc) is linked, never re-typed.
3. **Start from the drawing's own structure.** `pdf-vector-figures.py`
   already records, per render, the labelled boxes (`assembly.boxes`) and
   which open strokes join two of them. That is a draft node and edge list.
   Check it against the render: the assembly does not know arrow direction
   or meaning, and a label in white space belongs to no box.
4. **Keep the picture as evidence.** The rebuilt block cites the PDF page and
   keeps `meta.source.file` pointing at the crop, so a reviewer can compare.
   Record how it was made in `meta.source.method`: `archimate-view`, `bpmn`,
   `dmn`, `fhir-logical-model`, `generated` or `redrawn`, plus `generator`
   when a script draws it and the source's path or IRI.
5. **Assert nothing the figure does not draw.** A rebuild is a transcription
   of the drawing. A relation the figure does not draw is not added, and
   counts, dates and country facts stay cited source content, never model
   facts (the L2 DTH workplan rule: no empirical claims in formal content).
   smart-ra's `dth_sc.py` states the same rule in its view documentation.
6. **Re-run the check.** `--require-computable` fails while any figure is
   still a `picture` or only `linked`, so a folio can adopt it as a gate once
   the rebuilds are done.

## Routes by figure type, in detail

The owner asked for each of these on 2026-10-31 while reading dth-pc and
dth-sc.

### A workflow picture becomes BPMN XML

A figure drawn in BPMN notation (lanes, events, gateways, tasks, groups,
subprocesses), such as the ANC workflow in dth-pc Fig. 6 and dth-sc Fig. 7, is
transcribed into a `.bpmn` file.

1. **Look for the source's own BPMN first.** If the publication it is adapted
   from (a DAK, a DTH, an IG) publishes the process as `.bpmn`, mount or cite
   that file; never redraw it. WHO smart-anc, checked 2026-10-31, publishes no
   `.bpmn` for its ANC workflow, only PlantUML pictures of other processes. So
   that figure is transcribed.
2. Transcribe exactly what is drawn. Keep the source's activity numbers and
   names as task ids and names (`10.5 Nutrition supplementation`), the lanes,
   the gateway labels on their flows, a group as `bpmn:group`, and a
   subprocess as `bpmn:subProcess`. Include `bpmndi` coordinates taken from
   the render, so the diagram looks like the source.
3. **What the figure emphasises becomes data, not colour.** The purple
   outline on "connections to the supply chain" becomes a marker on those
   tasks, an extension element or a documented category, so a query can find
   them.
4. Shared processes live once, in the layer the folios mount (dth-sc for the
   supply chain handbooks), and each folio's figure block points at that file.
5. Validate with the cat-harness `bpmn-authoring` checks, then render the SVG
   with the same tool the folio uses for its own processes.

### A data model becomes FHIR logical models, rendered as UML

A class diagram with attributes and cardinalities (dth-pc Fig. 9: Generic
Product, Trade Item, Regulated Trade Item) is a data model.

1. **Find the newer computable source first.** dth-pc's data model is carried
   forward in smart-pcmt (owner, 2026-10-31): `Product` and
   `ProductAuthorization` logical models. Link to those, cite the handbook
   figure as the original, and list the differences rather than hiding them.
   Read WHO and smart-* repositories; never change them.
2. Only where no source exists, transcribe it as FSH `Logical:` models in a
   litlfred repository. sushi must run without errors before the commit.
3. Draw the figure as a UML class diagram generated from the
   StructureDefinitions, never from the picture. Show each entity as an
   IG-style structure tree, using fhir-harness `logical-model-schemas` and
   `ig-ast-render`.
4. In mapping tables, every FHIR path links to the spec page for its version
   (`https://hl7.org/fhir/R5/<resource>-definitions.html#<Resource.path>`), and
   every entity links to its logical model or profile. State the FHIR version
   when the source and the mapping differ (smart-pcmt is 4.0.1; dth-pc maps to
   R5, where `InventoryItem` first exists).

### A layered or phased chart becomes an SVG generated from data

Charts such as the SMART Guidelines L1–L5 layers, the DIIG phases, nested
strategies or a cost tree are not graphs. Write their content as a data file:
layers, boxes, their text, and which feeds which. Then generate the SVG with a
script (precedent: dth-hrh `scripts/folio/diig_phases_hrh.py`).

- Labels are SVG `<text>`, never pixels, so they can be searched,
  translated and read aloud.
- A label that names a glossary concept (L1 Narrative, Digital adaptation
  kit, Localisation) links to the SKOS term, an `<a href>` around the text.
- A chart that appears in several publications is generated once, in the
  shared layer.

### Mermaid is a rendering, never a source

Mermaid is a drawing language, not a schema. Nothing downstream consumes it:
no KG import, no validator, and the document site does not render it. Its node
names are local strings with no IRI, so they cannot link to a glossary term,
an ArchiMate element or a FHIR model. A hand-written `.mmd` is therefore a
second copy of content, which the one-source rule forbids. Mermaid may appear
only as a view GENERATED from a schema-backed source, when it lays out better
than the native renderer, and then the generated text and SVG are build
output, not authored files.

### Drop the flattened figure text from the prose

Page-level seeding puts a figure's text layer into the prose block of its page
("Fig. 1: Product master data Product identifier, Name, ..."). That text is
neither prose nor a figure. Once the figure has a block, remove its text from
the prose, from the caption line to the end of the figure's labels. The labels
live in `vector-labels.json` and, after a rebuild, in the computable source.
The `l1-coverage` check is unaffected, because figure labels are not
normative sentences.

### Link table cells

Tables seeded from a publication hold names that the folio already defines.
Link them:

- a chapter or section name links to its section anchor in the folio;
- an organisation or role (Ministry of Health, National Regulatory Authority,
  Central Medical Stores, Data officer) links to its glossary term, and
  through that to the ArchiMate actor or role the term maps to;
- a cross-reference to a figure or table ("Fig. 9") links to the block.

Match names only on an exact glossary label or `altLabel`. A cell with no
match stays plain text and is listed for review. A guessed link is worse
than none.

### Example data becomes FHIR example instances

A figure or table that shows example records, such as products, packs or
identifiers with quantities, is instance data and not a drawing. Examples are
dth-pc Fig. 11 (packaging variations) and the NPC01101001 table. Write
the records once as FSH `Instance:`s of the upstream logical model
(`InstanceOf: Product`, `Usage: #example`) beside that model. The figure or
table is then generated from the compiled instances. For dth-pc these instances
are in litlfred/smart-pcmt (owner chose this place on 2026-10-31). The
instances carry only what the source prints:

- A value the model requires but the source omits gets
  `data-absent-reason#unknown`, never a plausible guess.
- Numbers that do not add up in the source are transcribed as printed, and
  the mismatch is listed in the PR.
- A column with no clean element is left out and listed, not forced.

### A repeated activity header comes from the step records

A bar that repeats over each activity, such as INPUTS / STEPS / RESOURCES /
OUTPUTS in dth-pc, is a view of that activity's step-table record. Generate
it from the record. Each input and output links the BPMN data object it
names, and nothing is typed into the bar.

## Reviewing the classification

An agent proposes, and a person decides. The owner chose on 2026-10-31 that
review can happen either in the folio's Contributor Log sheet or in a GitHub
issue, and the result always lands in the folio's `figures.json` by a PR.

1. **Propose.** An agent looks at each figure's render and vector-layer
   structure. It proposes a route from the table in step 2 and an upstream
   source to reuse, if one exists, and gives its evidence.
2. **Review in the sheet.** Write one row per figure, or per batch, to the
   Contributor Log's Agent tab, one row per change set. The script copies
   the rows across, so the sheet needs no new columns:
   - **Title:** `Fig N: route`
   - **Selected Sections:** the section that holds the figure
   - **Feedback:** `Decision needed: <question>`, followed by lettered options
     with the recommendation marked
   - **Agentic status:** `Needs human`

   An Editor accepts the recommendation by setting Ready for agent to Yes, or
   types another letter. The steps are in `review-sheet-script`, "A question
   to people goes in the sheet".
3. **Or review in an issue.** One issue per figure, labelled `figure-route`,
   holding the same question. The row's Issue column and `feedback-issue.ts`
   keep a sheet row and its issue linked, so either one can start the review
   and the decision closes both.
4. **Record.** Accepted routes are written to `figures.json` in a PR, with
   who approved each one. `figure-coverage` then holds the folio to them.

## Reading the report

| State | Meaning |
|---|---|
| `missing` | declared by the publication, no block in the folio |
| `excluded` | no block, by a signed-off `scope: "block"` exclusion |
| `picture` | only crop or image blocks |
| `linked` | a picture whose block links a model view; the view may not draw the whole figure |
| `computable` | a diagram or table block, or a figure block with a rebuild method |
| `cited` | kept as a picture on purpose, by a signed-off `scope: "rebuild"` exclusion |

As in `l1-coverage`, an agent may **propose** an exclusion, but only a person
signs one off. Declared figures are read with cat-harness-tools
`declaredFigureCaptions`, the same reading `check:l1-complete` uses, so the
two checks agree on what the publication declares.

## Related

- [`l1-document-ingestion`](l1-document-ingestion.md): the vector arms that render and label figures
- [`l1-coverage`](l1-coverage.md): the same question asked of normative sentences
- [`archimate-models`](../../../../cat-harness/skills/ui/ui-core/archimate-models.md): authoring the views

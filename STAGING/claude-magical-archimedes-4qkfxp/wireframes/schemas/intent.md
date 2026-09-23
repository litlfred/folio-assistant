# Schemas visualiser — as-is intent

**Covers** five declared refs that share one template:
- `cat-harness/docs/cat-harness/schemas/cat-harness/index.html` (`cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/schemas/bootstrap-tools/index.html` (`bootstrap-tools/bootstrap-tools.json`, `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/schemas/detangle/index.html` (`detangle/detangle.json`, `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/schemas/folio-assistant-core/index.html` (`folio-assistant-core/folio-assistant-core.json`, `cat-harness/cat-harness.json`)
- `cat-harness/docs/cat-harness/schemas/large-datasets/index.html` (`large-datasets/large-datasets.json`, `cat-harness/cat-harness.json`)

All five are written by `cat-harness/scripts/gen-schema-viz.ts`. It is a zero-dependency viewer that fetches its projection (`assets/schemas/index.json`) relative to its own location. The drawing uses `cat-harness` (812 declarations, 122 modules, 517 edges, 8 undetermined). The others use the same layout with less data: bootstrap-tools 11 / 2 / 6, detangle 10 / 2 / 6, folio-assistant-core 60 / 11 / 31, large-datasets 11 / 2 / 1.

**Who it is for:** the owner or a maintainer reading an instance's schemas. The owner's ask, quoted in the generator: *"browsable, so i can give overview like browsing"*. It is "a navigation requirement rather than a poster requirement".

**What they need to do:**
- browse and search the declarations, and narrow them by kind (interface, type-alias, zod-object, …) and by module
- pick one declaration and see it "drawn as a UML class with its fields, its generalisations above it and its references below", with its fields table and references
- open the relationship diagram for a module, which is limited to 40 declarations in scope

**What it must show:** the counts line, the note that string-id references are not drawn, the collapsible relationship diagram, the faceted index (search, kind, module, list), and the detail pane.

## Observed on main (edf3a89+)

Rendered at 1280×800 and 390×844, including after selecting `ArchiveContentsSchema` and after opening the diagram.

1. **Header:** "Schema graph", then `cat-harness · 812 of 812 declarations · 122 modules · 517 edges · 8 undetermined`, then the note.
2. **Relationship diagram:** a `<details>`, closed by default. Opened with no module chosen, it shows only "812 declarations in scope — too many to draw as a relationship diagram (the limit is 40 …). Pick a module in the filter above and the diagram for it appears here", over about 200 px of empty panel.
3. **Two panes at 1280 px:** a 532 px left pane and the detail pane on the right.
   - **Left:** a search field ("Search declarations…"), and the "any kind" and "any module" selects, all with `aria-label`s. Below them is the declaration list, a `<ul>` of buttons in a 560 px scroll box (`ActorReachSchema` zod-enum · actor-reach.ts, `EffectiveReach` type-alias, …). The selected button carries `aria-current`.
   - **Right:** "Select a declaration." until one is picked. After picking one: its name, `cat-harness/schemas/archive-contents.ts · zod-object`, an SVG class box with its fields truncated ("… 1 more") and an `entries[]` edge to `ArchiveEntrySchema`, a Fields table (name, type, notes), and References.
4. **At 390 px** the panes stack: the header, the diagram summary on two lines, the filters wrapping to two rows, the 560 px list box, and the detail pane below it.

## Findings

1. **On a phone, picking a declaration shows nothing.** The detail pane is below the 560 px list box, and selecting an item leaves the page where it is (`scrollY` stays 0). The reader sees the highlight move and has to know to scroll past the list to find the result.
2. **Nested scrolling on a phone.** The 812-item list is a 560 px scroll box inside a scrolling page. At 390×844 the box takes about two-thirds of the screen height, so most swipes over the page land in the list.
3. **The diagram's instruction points the wrong way.** Opened with no module chosen, the panel says "Pick a **module** in the filter above", but the module filter is *below* the diagram. The panel also keeps about 200 px of empty height.
4. **The field table breaks identifiers mid-token at 390 px.** "n_entrie / s", "uncompre / ssed_byt / es", "z.literal(ARC / HIVE_CONTENTS / _SCHEMA_ID)". Names and types become hard to read or copy.
5. **The UML box truncates field types** at a fixed width, even at 1280 px ("$schema: literal(ARCHIVE_CONTENTS_SCH", "n_directories: number().int().nonnegative("). The full types appear only in the Fields table below.

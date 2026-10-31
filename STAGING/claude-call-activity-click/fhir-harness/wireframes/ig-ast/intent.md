# ig-ast — as-is intent

## Covers

The `ig-ast` kind viewer, declared by this layer, the FHIR IG layer (owner, 2026-10-16: the kind belongs here), for every `ig-ast` directory an instance in the checkout declares. Drawn by this layer's Tool `ig-ast-pages` (`scripts/gen-ig-ast-pages.ts`): a hub at `<locale>/fhir-harness/ig-ast/` and one page per declaring instance under it. The route key is the one `index.json` records for this wireframe.

### How this was drawn

From the pages `gen-ig-ast-pages --site` writes in a checkout of the index with the pull request that adds the viewer overlaid, not from a built site. Only one instance, an IG layer above this one, declares an `ig-ast` directory, and its branch family is not restored in a checkout, so the drawing is the hub and the "unknown" instance page. That instance is drawn as `<ig>`: this layer names no layer above it.

Kept here, beside the viewer it draws, rather than in the platform's docs: `check:wireframes` reads the `wireframes/` of every declared docs directory, so the viewer and its wireframe land in one pull request.

## Who it is for, and what they need to do

- **Readers:** an IG author or a reviewer working on the AST-only Publisher path.
- **Tasks:**
  - see which instances hold IG ASTs, and whether this build has them
  - for a restored AST, see what it holds and what stays provisional
  - reach the branch family an AST would be restored from

## What it must show

1. The mark that an AST is a cache, never an authority, on every page.
2. A directory that is not on disk as **unknown**, never as zero, naming its branch family.
3. Per restored AST: package id, resources by type, dependency edges, rebuild plan, provisional items.
4. Every declaring instance, linked from each page.

## Findings

1. **The restored-AST view is not drawn.** No AST is restored here, so the per-AST tables exist only in the generator. Redraw once `ig-cache` restores one.
2. **The mark is colour-and-border only.** The amber left border carries no meaning the words do not, so this is cosmetic.

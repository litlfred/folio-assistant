# openapi — as-is intent

## Covers

The `openapi` kind viewer that this harness declares (`visualisers` id `openapi`, Tool `openapi-pages`). It covers every `openapi` directory that an instance in the checkout declares. The tools layer's `openapi/scripts/gen-openapi-viewer.ts` draws it, reusing the renderer `gen-openapi-pages.ts` that an IG repository's own site uses. It writes a hub at `<locale>/cat-harness/openapi/`, and under it one page per declaring instance: the instance's documents, a page per document, and a page per operation. Each document is copied beside its pages, because the pages fetch it from there. The route key is the one `index.json` records for this wireframe.

### How this was drawn

Drawn from the pages that `openapi:viz` writes in a checkout of the index, with the pull request that adds the viewer overlaid. One instance declares an `openapi` graph: an IG layer above this one, drawn as `<ig>`. The operation rows and the parameter and response sections are abridged, because the loader draws them in the browser from the document.

## Who it is for, and what they need to do

- **Readers:** an IG author, an implementer of the API, or a reviewer.
- **Tasks:**
  - see which instances hold OpenAPI documents
  - open a document and list its operations
  - open one operation and read its parameters, request body and responses
  - follow a Swagger-style deep link from the IG's pages to the operation's own page

## What it must show

1. Every declaring instance on the hub, with the documents each holds.
2. An instance whose graph does not read as **unknown**, with the error, never as an instance with no documents.
3. Per document: its title, version and operations, and where it was ingested from.
4. Per operation: method, path, summary, and the parameters and responses drawn from the document.

## Findings

1. **The instance index is the renderer's bare list.** It has no link back to the hub, so a reader climbs one level up the URL. This is a known gap in `gen-openapi-pages.ts`'s graph index, which is shared with the IG sites.
2. **The IRIs extend the instance's graph path, not this route.** Each JSON-LD node's `@id` stays the IRI under the instance. The pages here render that asset and do not mint a second identity for it. On the main site the IRI's own address serves only the document.

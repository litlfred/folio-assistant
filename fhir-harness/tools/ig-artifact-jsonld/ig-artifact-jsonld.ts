import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "ig-artifact-jsonld",
    title: "Write one JSON-LD node per IG artefact, and check a built site's nodes",
    description:
      "`write` turns an artefact index into `artifact/<Type>-<id>.jsonld` (and a `.json` twin) under a docs root: one `folio-ig-artifact-jsonld/v1` node per artefact, in borrowed vocabularies only (the FHIR RDF class, dcterms, schema.org, PROV), naming the artefact's canonical URL, its representations and, for a compiled copy, what built it. `check` is the kind's QA: over a BUILT site, every artefact has its node and no node is an orphan, each node is its own file's, its twin matches, and every local resource it names is on the site. It also writes and checks the index node, `artifact/index.jsonld` (`folio-ig-artifact-index-jsonld/v1`): every artefact once, each entry naming its node. These are the assets the thin pages render.",
    install: { none: true },
    invoke: { shell: "bun run fhir-harness/scripts/ig-artifact-jsonld.ts" },
    io: {
      inputs: [
        { name: "command", schema: t("Text"), required: true, description: "`write` or `check`." },
        { name: "index", schema: t("RepoPath"), required: true, description: "The `folio-fhir-artifact-index/v2` to write from, or to check against." },
        { name: "out", schema: t("RepoPath"), required: false, description: "`write`: the docs root the nodes go under." },
        { name: "dir", schema: t("RepoPath"), required: false, description: "`check`: the built docs root to check." },
        { name: "base", schema: t("Url"), required: false, description: "`write`: the docs root's published URL, for absolute IRIs." },
        { name: "compiled-data", schema: t("RepoPath"), required: false, description: "`write`: where compiled resource files are served, from the docs root." },
      ],
      outputs: [
        { name: "nodes", schema: t("Count"), description: "Nodes written, or checked; `check` exits 1 with each finding named." },
      ],
    },
    satisfies: ["ig-build-pipeline"],
    selection: {
      when: "An IG's pages are thin (the default of `gen-ig-pages`), or a consumer wants the artefacts as linked data.",
      limits: "Identity and representations only, never the resource's content: the resource is one of its encodings, fetched by the page. Upstream URLs are not fetched by `check`.",
      cost: "Milliseconds per artefact.",
    },
    requires: { runtime: ["bun"], network: false },
  }),
);

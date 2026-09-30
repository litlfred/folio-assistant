/**
 * fhir-harness's Tool nodes — the `tools` graph for the bare FHIR IG layer.
 *
 * @module fhir-harness/tools
 * @graphNode tool
 *
 * ## Two build tools, and they are here because the layering rule put them here
 *
 * Both arrive from `WorldHealthOrganization/smart-base`'s build labelled
 * **"DAK Postprocessing"**, and neither is DAK-shaped: ANY implementation
 * guide depending on `hl7.fhir.uv.cql` produces `Library` resources carrying
 * base64 payloads and inline CQL/ELM, and the same build's own
 * *"Delete files >100MB before deployment"* step is that concern one layer
 * down.
 *
 * The placement question in
 * [`smart-stack-layering`](../../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md)
 * asks *would a non-WHO FHIR IG need this?*, and requires the answer to be
 * backed by naming one. It can be named, so they are here.
 *
 * **This file is the layering made real rather than asserted.** They were
 * described as belonging here in the previous round and still declared
 * nowhere — and a layer boundary that exists only in prose is one no
 * consumer can act on.
 *
 * ## What is NOT here, and must not drift in
 *
 * Nothing that knows about `dak.config.json`, the DAK API surface, or any
 * `smart.who.int` canonical. `ig-build-pipeline` carries the full refusal
 * list. A WHO reference added here fails no gate; it just quietly makes the
 * layer unusable for the non-WHO IG it exists for.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineTool, type ToolDefinition } from "../../cat-harness/schemas/tool.js";
import { toolTypeIri } from "../../cat-harness/schemas/tool-types.js";
import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";

/** The INSTANCE root — `<repo>/fhir-harness`, where `fhir-harness.json` lives. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function decl(): { canonicalUrl?: string } {
  const p = declarationPathIn(ROOT);
  if (p === undefined || !existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as { canonicalUrl?: string };
  } catch {
    return {};
  }
}

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? decl().canonicalUrl ?? "";
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

  return [
    defineTool({
      id: "strip-library-binaries",
      title: "Strip binary payloads from Library resources",
      description:
        "Remove base64 `content.data` from published `Library` resources, so an IG embedding compiled CQL does not ship the bytes twice.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/strip_library_binaries.py" },
      io: {
        inputs: [
          { name: "igOutput", schema: t("RepoPath"), required: true, description: "The Publisher's `output/`. It runs AFTER the build — the resources it edits are published ones." },
        ],
        outputs: [
          { name: "stripped", schema: t("Count"), description: "How many resources were altered. Zero is a determined empty when the output directory was found; a missing output directory is a different state." },
        ],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when:
          "The IG depends on `hl7.fhir.uv.cql` or otherwise embeds compiled artefacts in `Library.content`. Not a WHO condition — it is a property of the dependency.",
        limits:
          "It edits PUBLISHED output, so what it removes is gone from the deployed artefact but still present in whatever the Publisher validated. The two are no longer byte-identical, which matters to any fixity check pointed at the deployed copy.",
        cost: "Seconds. Deferring it costs the >100MB purge later in the same pipeline, which deletes whole files rather than payloads.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "strip-library-content",
      title: "Replace inline Library content with URL references",
      description:
        "Replace inline CQL/ELM in `Library` resources with a URL reference to the published copy.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/strip_library_content.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true }],
        outputs: [
          { name: "rewritten", schema: t("Count") },
          { name: "references", schema: t("Url"), description: "The base the replacement references resolve against. If it is wrong, every rewritten Library points at nothing and the resource still validates." },
        ],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "Same condition as `strip-library-binaries`; upstream runs the two as adjacent steps.",
        limits:
          "A reference is only as good as what serves it. This trades a self-contained resource for a dereferenceable one, which is the right trade for a published IG and the WRONG one for an air-gapped consumer — `network-reach` is a declared topology axis here, and this tool is not safe under `air-gapped` without the referenced copies travelling too.",
        cost: "Seconds, and a permanent dependency on the publication base staying served.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "ig-site-data",
      title: "Populate site.data.fhir for a just-the-docs IG render",
      description:
        "Write the IG Publisher's Jekyll variables (`site.data.fhir.ig.*`, `packageId`, `canonical`) for ONE implementation guide, from `sushi-config.yaml` or a published IG's `fhir-artifact-index`, so pages written for the Publisher render on just-the-docs unchanged. fhir-harness declares `site.data` as a pass-through Liquid prefix; this is what Jekyll then reads (bean `bamf`).",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-site-data.ts" },
      io: {
        inputs: [
          { name: "ig", schema: t("RepoPath"), required: true, description: "The IG root: holds `sushi-config.yaml`, or `fhir-artifact-index/index.json` for a published IG." },
          { name: "out", schema: t("RepoPath"), required: true, description: "`<site>/_data/fhir.json` — Jekyll has one `_data/`, so one IG per site, as under the Publisher." },
          { name: "check", schema: t("Flag"), required: false, description: "Write nothing; exit 1 when the file is stale." },
        ],
        outputs: [
          { name: "written", schema: t("Count"), description: "Fields written, each from a named source." },
          { name: "undetermined", schema: t("Count"), description: "Fields a Publisher build would have that no source here carries. LISTED, never written as empty strings, because Jekyll prints an empty string and an absent value identically." },
        ],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "Rendering an IG's pages through just-the-docs instead of, or beside, the IG Publisher (`ig-publisher-reduction` P0).",
        limits:
          "Only the ImplementationGuide resource's fields plus `packageId` and `canonical`: there is no Publisher-written `_data/fhir.json` here to copy a fuller schema from, and a field written from memory would be a guess. A source describing a different package is refused, not merged.",
        cost: "Milliseconds; reads two files.",
      },
      requires: { runtime: ["bun"], network: false },
    }),
    defineTool({
      id: "build-ig-site",
      title: "Stage one IG as its own just-the-docs Jekyll site",
      description:
        "Turn an IG source repository into ONE Jekyll source for just-the-docs, as the IG Publisher builds one IG per site: `input/pagecontent` pages with title, parent and order from `sushi-config.yaml` `pages:`, the files the Publisher resolves `{% include %}` against, images, `_data/fhir.json` from `ig-site-data`, and a `_config.yml`. The pages render unchanged, `{{ site.data.fhir.* }}` included (bean `bamf`, owner's choice of one site per IG).",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/build-ig-site.ts" },
      io: {
        inputs: [
          { name: "ig-src", schema: t("RepoPath"), required: true, description: "The IG source repository: `sushi-config.yaml` and `input/`." },
          { name: "out", schema: t("RepoPath"), required: true, description: "The Jekyll source directory to write." },
          { name: "baseurl", schema: t("RepoPath"), required: false, description: "Where the built site is served." },
          { name: "plantuml-jar", schema: t("RepoPath"), required: false, description: "Render `input/images-source/*.plantuml` as the Publisher does; without it a visible `not rendered` marker stands in." },
        ],
        outputs: [
          { name: "pages", schema: t("Count"), description: "Pages staged." },
          { name: "not-rendered", schema: t("Count"), description: "Included files the source does not hold and nothing rendered, each replaced by a VISIBLE marker and listed, never an empty include." },
        ],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "Rendering an IG's own pages through just-the-docs (`ig-publisher-reduction` P0).",
        limits:
          "Fragments only the Publisher's own generation writes (dependency tables, artefact summaries) are not produced here and show as markers. A page `sushi-config.yaml` does not list keeps its file name as title and is reported.",
        cost: "Seconds; copies files. Rendering diagrams adds a Java process per diagram.",
      },
      requires: { runtime: ["bun"], network: false },
    }),
  ];
}

/**
 * fhir-harness's Tool nodes — the `tools` graph for the bare FHIR IG layer.
 *
 * @module fhir-harness/tools
 * @graphNode tool
 *
 * ## Two tools, and they are here because the layering rule put them here
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
  ];
}

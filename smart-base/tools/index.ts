/**
 * smart-base's Tool nodes — the `tools` graph for the WHO SMART base layer.
 *
 * @module smart-base/tools
 * @graphNode tool
 *
 * ## Why these are here, and what changed on 2026-09-22
 *
 * The owner: *"things like dmn -> fhir questionnaire should be a tool. the
 * skill/tools under smart-base should consolidate under the smart-base/tools/
 * directory under this repo"*, and the goal it serves — *"want to slowly get
 * smart-base back to a more conventional IG state w/o tooling"*.
 *
 * So the direction of travel is: `WorldHealthOrganization/smart-base` stops
 * being a toolchain host and becomes an ordinary FHIR IG. The capabilities it
 * hosts today move here, where the harness can declare, bind and audit them.
 *
 * ## This is NOT vendoring, and the distinction is the whole reconciliation
 *
 * `smart-base.json`'s own header says the upstream toolchain is not vendored
 * here, and [`smart-base-tools`](../../cat-harness/skills/authoring-who-smart-guidelines/smart-base-tools.md)
 * argues why: a copy of the Python would be a second, drifting toolchain.
 *
 * **That argument is about copies of the CODE and it still stands.** A Tool
 * node is a DECLARATION — what the capability is, what it consumes and
 * produces, which skill it satisfies, and how it is invoked. Declaring that
 * `dmn_questionnaire_generator.py` exists and consumes DMN to produce
 * `Questionnaire` resources does not duplicate a line of it, and it is what
 * lets a process bind the step at all. The two statements are compatible:
 * **declare here, execute upstream, until the execution moves too.**
 *
 * ## Two tools are deliberately absent
 *
 * `strip_library_binaries.py` and `strip_library_content.py` arrived labelled
 * *DAK Postprocessing* and are not DAK-shaped — any IG depending on
 * `hl7.fhir.uv.cql` produces oversized `Library` resources. By the placement
 * question in
 * [`smart-stack-layering`](../../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md)
 * they belong to `fhir-harness`, and putting them here to keep the list
 * tidy would be the layering rule being overruled by a step's own name.
 *
 * ## `install: { none: true }` throughout, on purpose
 *
 * Every tool below is a Python script in a checkout whose location is given by
 * `SMART_BASE_HOME`. There is no install step and saying so explicitly is what
 * distinguishes "nothing to install" from "nobody finished the record" — the
 * distinction the `none` flag exists for, per `beans-manual`'s precedent.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineTool, type ToolDefinition } from "../../cat-harness/schemas/tool.js";
import { toolTypeIri } from "../../cat-harness/schemas/tool-types.js";
import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";

/** The INSTANCE root — `<repo>/smart-base`, where `smart-base.json` lives. */
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
    // ── L2 authoring transforms ──────────────────────────────────────────
    //
    // The owner named this one specifically. It is the clearest case in the
    // set for why these are tools rather than pipeline steps: it MINTS FHIR
    // RESOURCES. Delete it and the IG is missing `Questionnaire`s — not
    // missing a page. It runs in the pre-processing phase only because the
    // pipeline had nowhere earlier to put it.
    defineTool({
      id: "dmn-to-questionnaire",
      title: "DMN → FHIR Questionnaire",
      description:
        "Generate FHIR `Questionnaire` resources from a DAK's DMN decision tables. Authoring, not rendering: its output is validated and indexed by the IG Publisher like any other resource.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/dmn_questionnaire_generator.py" },
      io: {
        inputs: [
          { name: "dmnDir", schema: t("RepoPath"), required: true, description: "The directory of DMN sources. `input/dmn/` by convention." },
        ],
        outputs: [
          { name: "questionnaires", schema: t("RepoPath"), description: "The generated `Questionnaire` resources, written where SUSHI's output is collected from." },
          { name: "generated", schema: t("Count"), description: "How many were produced. Zero is a determined empty only if the DMN directory was found; absent input is a different state and is reported as such." },
        ],
      },
      satisfies: ["l2-dak-authoring", "dak-preprocessing"],
      selection: {
        when: "A DAK carries DMN decision tables and the IG is to expose them as answerable questionnaires.",
        limits:
          "It reads DMN and nothing else — a decision expressed only in prose or only in CQL is invisible to it, and it reports no error for one. It cannot tell an empty DMN directory from a DAK with no decisions.",
        cost: "Seconds, no network. It runs before the Publisher, so a failure here costs a whole build cycle to discover if it is only noticed downstream.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "dmn-to-html",
      title: "DMN → HTML",
      description:
        "Render each DMN decision table to HTML for inclusion in a page, via `dmn2html.xslt` and `dmn.css`. The only human-readable rendering of a decision table an IG has.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/transform_dmn.py" },
      io: {
        inputs: [{ name: "dmnDir", schema: t("RepoPath"), required: true }],
        outputs: [{ name: "html", schema: t("RepoPath"), description: "One HTML fragment per decision table." }],
      },
      satisfies: ["l2-dak-authoring", "dak-preprocessing"],
      selection: {
        when: "A reader needs to see a decision table. Nothing else in the toolchain renders one.",
        limits:
          "Its output is HTML, which the JSON-only render contract does not take as a representation — see `ig-render-jekyll`. Under the just-the-docs pipeline it is either given a structured output or its HTML is carried as an embedded asset. That is open (bean `kn0t`), not settled.",
        cost: "Seconds. An XSLT dependency that has no other consumer here.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "bpmn-to-fsh",
      title: "BPMN → FHIR Shorthand",
      description:
        "Derive FSH from a DAK's BPMN business processes — the render direction, of which the extractors are the inverse.",
      install: { none: true },
      invoke: { shell: "python3 scripts/smart-base-transform.py" },
      io: {
        inputs: [{ name: "bpmn", schema: t("FilesystemPath"), required: true }],
        outputs: [{ name: "fsh", schema: t("RepoPath"), description: "Generated FSH, for SUSHI to compile." }],
      },
      satisfies: ["l2-dak-authoring", "smart-base-tools"],
      selection: {
        when: "An L2 business process is to reach L3 as a computable artefact rather than as a picture.",
        limits:
          "It requires a `smart-base` checkout at `SMART_BASE_HOME`. Without one the capability is ABSENT, which `smart-base-tools` is explicit is not the same as a clean run.",
        cost: "Seconds. Needs the upstream checkout, which is the dependency this layer's direction of travel is meant to end.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    // ── The DAK configuration itself ─────────────────────────────────────
    defineTool({
      id: "dak-config-from-sushi",
      title: "sushi-config.yaml → dak.config.json",
      description:
        "Derive the DAK configuration from `sushi-config.yaml` plus repository and branch context.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_dak_from_sushi.py" },
      io: {
        inputs: [
          { name: "sushiConfig", schema: t("RepoPath"), required: true, description: "`sushi-config.yaml` at the IG root." },
          { name: "branch", schema: t("Branch"), required: false, description: "Sanitised branch name, for the publication and preview URLs." },
        ],
        outputs: [{ name: "dakConfig", schema: t("RepoPath"), description: "`dak.config.json` — ours, per bean `cz17`. Upstream still writes `dak.json`." }],
      },
      satisfies: ["dak-preprocessing"],
      selection: {
        when: "A DAK repository has no configuration yet, or its branch context has changed.",
        limits:
          "Upstream runs it TWICE — once before the branch name is sanitised and again after — which is an ordering workaround, not two facts. Do not reproduce the double run: compute it once, in the right order.",
        cost: "Seconds. It writes a file the whole DAK phase is gated on, so a silent failure here disables every step after it.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    // ── The DAK API surface ──────────────────────────────────────────────
    //
    // Four tools producing what `ig-artifact-ingestion` reconstructs an index
    // FROM. They run against the Publisher's `output/`, so they are
    // post-processing in the strict sense: they consume a rendered IG.
    defineTool({
      id: "logical-model-schemas",
      title: "Logical models → JSON Schema",
      description: "A JSON Schema per logical model, from the published FHIR resources.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_logical_model_schemas.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true, description: "The Publisher's `output/`." }],
        outputs: [{ name: "schemas", schema: t("RepoPath"), description: "`schemas/<stem>.schema.json`." }],
      },
      satisfies: ["dak-postprocessing", "ig-artifact-ingestion"],
      selection: {
        when: "A DAK IG is to expose its logical models as an addressable API surface.",
        limits: "It describes what the Publisher emitted. A model the Publisher did not publish is not reported as missing.",
        cost: "Seconds, inside the publisher container.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "valueset-schemas",
      title: "ValueSets → JSON Schema",
      description:
        "A JSON Schema per ValueSet, plus the enumeration-response schemas published at the IG root.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_valueset_schemas.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true }],
        outputs: [{ name: "schemas", schema: t("RepoPath") }],
      },
      satisfies: ["dak-postprocessing", "terminology-management"],
      selection: {
        when: "A DAK IG is to expose its terminology as an API.",
        limits:
          "The root `ValueSets.schema.json` it writes is a SCHEMA describing an enumeration response, carrying an `example` that holds the list. It is not an index instance, and reading it as one is the trap `qsf5` recorded — no FHIR IG publishes an artefact-index instance.",
        cost: "Seconds. Output size scales with the IG: 19 sidecars for smart-trust against 198 for smart-immunizations, so re-derive rather than assume.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "jsonld-vocabularies",
      title: "ValueSet expansions → JSON-LD",
      description: "JSON-LD vocabularies built from the ValueSet expansions in the published output.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_jsonld_vocabularies.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true }],
        outputs: [{ name: "vocabularies", schema: t("RepoPath"), description: "`*.jsonld` at the published root." }],
      },
      satisfies: ["dak-postprocessing", "terminology-management"],
      selection: {
        when: "The terminology is to be reachable as linked data rather than only as FHIR.",
        limits:
          "IT DEPENDS ON EXPANSION, which depends on the terminology server the build was given. An IG built against a dead or restricted `tx` produces fewer vocabularies and FAILS NOTHING — the step warns and continues. A thin output is therefore not evidence of a thin ValueSet; check the expansion before concluding anything.",
        cost: "Seconds locally; the expansion it depends on is the expensive part and happens in the Publisher run.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "dak-api-hub",
      title: "DAK API hub",
      description:
        "Generate `dak-api.html` and the per-artefact `.openapi.json` / `.displays.json` sidecars — the hub a reader enters the DAK API through.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_dak_api_hub.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true }],
        outputs: [
          { name: "hub", schema: t("RepoPath"), description: "`dak-api.html`." },
          { name: "sidecars", schema: t("RepoPath"), description: "`.openapi.json` and `.displays.json` under `schemas/`." },
        ],
      },
      satisfies: ["dak-postprocessing", "ig-artifact-ingestion"],
      selection: {
        when: "The DAK API is to have a reader-facing entry point.",
        limits:
          "`dak-api.html` links its schemas to a `schemas/` directory that the root enumeration schemas are NOT in — the documented discrepancy `qsf5` found. Do not resolve a sidecar by composing the hub's path; resolve it from the index.",
        cost: "The largest script in the upstream set. It runs inside the publisher container against the full output.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    // ── The metadata → Jekyll bridge ─────────────────────────────────────
    //
    // The seam the just-the-docs transition cuts at. It already does what
    // `jut3` asks for; what it needs is re-pointing, not redesigning.
    defineTool({
      id: "smart-liquid-variables",
      title: "IG metadata → Liquid variables",
      description:
        "Scan the Publisher's `output/` for `{ResourceType}-{id}.json` and emit a Liquid include assigning `smart__<ResourceType>__<id>__<category>__<key>` for each published resource.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_smart_liquid.py" },
      io: {
        inputs: [
          { name: "igOutput", schema: t("RepoPath"), required: true, description: "The Publisher's `output/`; the script names this its source of truth." },
          { name: "igRoot", schema: t("RepoPath"), required: false, description: "Repository root, where `input/` lives. Defaults to `.`." },
        ],
        outputs: [
          { name: "include", schema: t("RepoPath"), description: "`input/includes/smart.liquid`, copied to `output/smart.liquid`." },
          { name: "categories", schema: t("Text"), description: "`url__canonical`, `url__page`, `url__json`, `text__display`, `link__html`, `elements__<key>`." },
        ],
      },
      satisfies: ["dak-postprocessing"],
      selection: {
        when:
          "Page content needs to reference a published resource by canonical URL, page URL, download URL or display label without hard-coding any of them. It is the existing answer to \"use IG Publisher metadata to populate the variables Jekyll processes\".",
        limits:
          "The documentation page it writes, `input/pagecontent/smart.liquid.md`, is processed BY THE NEXT BUILD — the script says so itself and works around it by writing `output/smart.liquid.html` directly. A surface that takes two builds to converge cannot underpin an incremental staging loop. Resource ids are normalised by replacing every non-alphanumeric character with `_`, so two ids differing only in punctuation collide into one variable name.",
        cost: "Seconds. The variables are recomputed from scratch on every run; there is no delta path.",
      },
      requires: { runtime: ["python3"], network: false },
    }),
  ];
}

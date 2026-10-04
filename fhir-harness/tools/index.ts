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
 * [`smart-stack-layering`](../../smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md)
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
 * Nothing that knows about `dak.config.json`, a DAK name or label, or any
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
    defineTool({
      id: "ig-pages",
      title: "Generate an IG instance's reader-facing pages from its artefact index",
      description:
        "Write `<instance>/docs/` — an index page, one page per artefact, a page per over-large category and per menu group — from `fhir-artifact-index/index.json` (and `menu.json` when ingested), styled by the template chrome an owning instance ingested. Moved here because nothing in it belonged to one IG (#1767); with `--summary` it writes an instance's landing page. For an IG whose SOURCE is at hand, `build-ig-site` renders the IG's own pages instead; this is for an IG known only by what it published.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/gen-ig-pages.ts" },
      // The viewer for this kind: each instance's index page declares
      // `renders` / `rendered-by: ig-pages`, so harness-tiles opens it for
      // the instance's artefact index (#1767, stage C3).
      renders: ["fhir-artifact-index"],
      io: {
        inputs: [
          { name: "instance", schema: t("RepoPath"), required: true, description: "The instance directory: holds `fhir-artifact-index/` and receives `docs/`." },
          { name: "label", schema: t("Text"), required: false, description: "The IG's display name. The index carries only the package id, which stands in when this is absent." },
          { name: "chrome-owner", schema: t("Text"), required: false, description: "The instance whose `chrome.json` styles the pages. Absent, the pages are unstyled and the build says so. The banner's identity is always the index's; a chrome ingested from another IG lends its tokens, never its status." },
          { name: "summary", schema: t("Flag"), required: false, description: "Open the index page with the instance's own declaration (`harness_details.html` with `instance=`), making it the instance's landing page." },
          { name: "check", schema: t("Flag"), required: false, description: "Write nothing; exit 1 when any page is stale or orphaned." },
        ],
        outputs: [
          { name: "pages", schema: t("Count"), description: "Pages written; the menu and chrome are reported as present or COULD NOT DETERMINE, never silently absent." },
        ],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "An ingested IG needs a URL on the docs site and its source repository is not at hand.",
        limits:
          "Narrative pages are not held — the harvest keeps artefacts — so menu entries link upstream. Bodies are still partly HTML inside markdown (`jut3`).",
        cost: "Seconds; one file per artefact.",
      },
      requires: { runtime: ["bun"], network: false },
    }),
    // ── An IG's JSON surface ─────────────────────────────────────────────
    //
    // Moved down from the layer above (#1767, stage B′). Each turns ANY IG's
    // published output into JSON Schema or JSON-LD, so — would an IG with no
    // overlay need it? — they are this layer's, as the Library strippers
    // above already are, and they satisfy `ig-build-pipeline` for the same
    // reason. A skill of the layer above cannot be satisfied from here
    // without an upward edge. The Python lives in the IG's own `input/scripts/`.
    defineTool({
      id: "logical-model-schemas",
      title: "Logical models → JSON Schema",
      description: "A JSON Schema per logical model, from the published FHIR resources.",
      install: { none: true },
      invoke: { shell: "python3 input/scripts/generate_logical_model_schemas.py" },
      io: {
        inputs: [{ name: "igOutput", schema: t("RepoPath"), required: true, description: "The Publisher's `output/`." }],
        outputs: [{ name: "logicalModelSchemas", schema: t("RepoPath"), description: "`schemas/<stem>.schema.json`, one per logical model." }],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "An IG is to expose its logical models as an addressable JSON Schema surface.",
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
        // Named for what it is (#1168, B9a): as `schemas` it matched
        // `logical-model-schemas` port for port, and the two would derive as
        // alternatives when they write different schema families.
        outputs: [{ name: "valueSetSchemas", schema: t("RepoPath"), description: "One schema per ValueSet, plus the enumeration-response schemas at the IG root." }],
      },
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "An IG is to expose its terminology as JSON Schema.",
        limits:
          "The root `ValueSets.schema.json` it writes is a SCHEMA describing an enumeration response, carrying an `example` that holds the list. It is not an index instance, and reading it as one is the trap `qsf5` recorded — no FHIR IG publishes an artefact-index instance.",
        cost: "Seconds. Output size scales with the IG — measured at 19 against 198 across two published IGs — so re-derive rather than assume.",
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
      satisfies: ["ig-build-pipeline"],
      selection: {
        when: "The terminology is to be reachable as linked data rather than only as FHIR.",
        limits:
          "IT DEPENDS ON EXPANSION, which depends on the terminology server the build was given. An IG built against a dead or restricted `tx` produces fewer vocabularies and FAILS NOTHING — the step warns and continues. A thin output is therefore not evidence of a thin ValueSet; check the expansion before concluding anything.",
        cost: "Seconds locally; the expansion it depends on is the expensive part and happens in the Publisher run.",
      },
      requires: { runtime: ["python3"], network: false },
    }),

    // ── The terminology a mapping check resolves against ─────────────────
    //
    // Owner, 2026-09-30, on what the `fhir` half of `check:term-mapping`
    // asserts: **"published IG at a version"** (bean `ejug`). So this node
    // refreshes a PIN, and a live terminology service is not this node: "this
    // code exists in IG X at version V" and "this code is in a curated
    // collection today" are different claims that can disagree. A service
    // node, when one is reachable, earns its own node beside this one.
    //
    // Moved down from cat-harness, where it was named for, and hard-coded
    // the paths of, one IG (#1767, stage B′). Which IG is pinned is
    // the caller's to say, which keeps this layer naming none.
    //
    // `satisfies: ["vocabulary-authority"]`: that core skill decides WHICH
    // vocabulary owns a fact, and this node supplies the FHIR side's
    // authority. Satisfying a core skill from here is the allowed direction.
    defineTool({
      id: "pin-ig-terminology",
      title: "Snapshot a published IG's terminology at its pinned version",
      description:
        "Read every CodeSystem concept out of a FHIR IG clone checked out at its pinned tag and write a `folio-pinned-terminology/v1` snapshot: the offline, version-fixed answer `check:term-mapping` resolves its `fhir` target against. Which IG, which pin record and which snapshot path are the caller's (`--pin`, `--out`, `--source`); this layer names none (#1767, stage B′).",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/pin-ig-terminology.ts --from <clone> --pin <pin record> --out <snapshot> --source <repository URL>" },
      // `network: false` is the claim that matters and it is exact: the
      // script reads a clone from disk and never fetches. The clone is made
      // by hand at the pinned tag, because cloning an external repository is
      // not something a gate should do, and because neither IG host is
      // reachable from here anyway.
      requires: { runtime: ["bun", "git"], network: false },
      io: {
        inputs: [
          // NO `arg` binding, and that is the type speaking rather than an
          // omission. `FilesystemPath` exists precisely for a path that may
          // point OUTSIDE the repository — the clone is made in a scratch
          // directory — and its own docblock says it is "refused as a
          // command-line word": `..` is what `RepoPath` forbids, and
          // weakening `RepoPath` to admit this would remove traversal
          // protection from every port that uses it. `check:tools` refuses
          // the pairing (measured 2026-09-30), so declaring `--from` here
          // would be asserting a safety property the type withholds. The
          // flag is in `invoke.shell`, where it is a person's command line
          // rather than a contract a caller may fill from untrusted input.
          { name: "from", schema: t("FilesystemPath"), required: true, description: "A clone of the IG checked out at the PINNED tag, passed as `--from`. The script refuses unless that clone's `sushi-config.yaml` version equals the pin's, so a newer clone cannot silently become the snapshot." },
        ],
        outputs: [
          { name: "snapshot", schema: t("RepoPath"), description: "The `--out` path, `folio-pinned-terminology/v1`: the version, the source, and every `system#code` with its display, sorted." },
        ],
      },
      satisfies: ["vocabulary-authority"],
      selection: {
        when:
          "The authority a term is checked against must be a fixed artefact a reader can name and re-fetch — a published IG at a version. Also the only option where the vocabulary's host is unreachable, which is the case in this container.",
        limits:
          "The version comes from the `--pin` record and NEVER from this script, so refreshing means moving the pin first and re-running; re-running against a newer clone is refused rather than silently accepted. It answers only for what the IG publishes at that version — a code added after it, or curated in a collection rather than published, is absent, and `check:term-mapping` reports that as `unmapped` (a checked miss) and not as `undetermined`. Nothing here dereferences a code system IRI.",
        cost:
          "One shallow clone at the tag (~120 KB of FSH at v1.0.0) and a few seconds. The snapshot is committed, so no run at check time.",
      },
    }),

    // ── The IG AST (bean `a9tx`) ─────────────────────────────────────────────
    // The producer is `ast-export`, a library ON TOP of the IG Publisher in
    // litlfred/fhir-ig-publisher@claude/ast-export; the consumer is
    // `scripts/ig-ast.ts` here. Owner, 2026-09-30: no GitHub Actions for now,
    // and any CI later calls THESE tools rather than re-implementing them.

    defineTool({
      id: "ig-ast-export",
      title: "Build an IG and write its AST",
      description:
        "Run one ordinary IG Publisher build through `AstPublisher` (a subclass that overrides nothing) and write the AST beside `output/`: one JSON file per resource keyed `canonical|version`, `dependencies.json` (upstream's DependencyAnalyser plus the Library/PlanDefinition/ActivityDefinition/Measure edges it leaves empty), SUSHI's `fsh-index.json`, and a manifest that declares itself a cache and records the inputs it is valid for.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher && cd fhir-ig-publisher/ast-export && mvn -q package && mvn -q dependency:build-classpath -Dmdep.outputFile=cp.txt" },
      invoke: { shell: "java -cp \"target/classes:$(cat cp.txt)\" org.hl7.fhir.igtools.ast.AstExportCli -ig <ig> [-ast-out <dir>]" },
      io: {
        inputs: [
          { name: "ig", schema: t("FilesystemPath"), required: true, description: "The IG root." },
          { name: "ast-out", schema: t("FilesystemPath"), required: false, description: "Default `<ig>/output-ast`, OUTSIDE the Publisher's `output/`." },
        ],
        outputs: [
          { name: "resources", schema: t("Count"), description: "Resources written, one file each." },
          { name: "edges", schema: t("Count"), description: "Dependency edges, including those whose target is outside the IG (kept, `resolved: null`)." },
        ],
      },
      satisfies: ["ig-publisher-fork"],
      selection: {
        when: "Producing a base AST for incremental work, or measuring what an IG's logic layer depends on.",
        limits:
          "Taken AFTER the build, so resources carry generated narratives. It is a full Publisher run: it needs the package registry and a terminology server, and an environment without them cannot run it.",
        cost: "A full IG build: minutes to tens of minutes.",
      },
      requires: { runtime: ["java", "maven", "sushi", "jekyll"], network: true },
    }),

    defineTool({
      id: "ig-ast-plan",
      title: "Plan an incremental IG build from a delta of changed files",
      description:
        "Map a delta (a commit range, a PR's diff, or the staged index) onto a base AST: which resources to rebuild (the forward cone), which to load from cache, which to remove, or a full build and why. Builds nothing.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher && cd fhir-ig-publisher/ast-export && mvn -q package && mvn -q dependency:build-classpath -Dmdep.outputFile=cp.txt" },
      invoke: { shell: "java -cp \"target/classes:$(cat cp.txt)\" org.hl7.fhir.igtools.ast.AstPlanCli -ast <ast> -ig <ig> [-head <rev> | -staged] [-out plan.json] [-fsh-users <json>]" },
      io: {
        inputs: [
          { name: "ast", schema: t("FilesystemPath"), required: true },
          { name: "ig", schema: t("FilesystemPath"), required: true },
          { name: "head", schema: t("CommitSha"), required: false, description: "Default HEAD; `-staged` diffs the index instead." },
          { name: "fsh-users", schema: t("FilesystemPath"), required: false, description: "`fsh-file-users/v1` from `fsh-cone --file-users`: lets a changed RuleSet- or Alias-only file reach its users rather than force a full build." },
        ],
        outputs: [{ name: "rebuild", schema: t("Count"), description: "The forward cone. The plan says `full`, with reasons, when a file's effect cannot be determined or the cone exceeds the threshold." }],
      },
      satisfies: ["ig-publisher-fork", "ig-ast-delta"],
      selection: {
        when: "Before an incremental build, and to show a reviewer what a change reaches.",
        limits:
          "The cone is computed on the BASE edges, so it is provisional until the rebuild: new edges can extend it. A RuleSet-only FSH file forces a full build unless `-fsh-users` is given.",
        cost: "Seconds; reads files and git.",
      },
      requires: { runtime: ["java", "git"], network: false },
    }),

    defineTool({
      id: "ig-ast-incremental-build",
      title: "Rebuild only the cone of a change and merge it into the AST",
      description:
        "Write the unchanged part of a base AST as a FHIR package into the package cache, build a temporary IG of only the rebuild set with the stock Publisher, merge the result into a mixed-provenance AST (`builtAt` per resource), and repeat while the merged graph's cone reaches resources that were not rebuilt.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher && cd fhir-ig-publisher/ast-export && mvn -q package && mvn -q dependency:build-classpath -Dmdep.outputFile=cp.txt" },
      invoke: { shell: "java -cp \"target/classes:$(cat cp.txt)\" org.hl7.fhir.igtools.ast.IncrementalBuildCli -ast <base> -ig <ig> -out <dir> [-cache-folder <dir>] [-fsh-users <json>]" },
      io: {
        inputs: [
          { name: "ast", schema: t("FilesystemPath"), required: true },
          { name: "ig", schema: t("FilesystemPath"), required: true },
          { name: "out", schema: t("FilesystemPath"), required: true },
          { name: "cache-folder", schema: t("FilesystemPath"), required: false, description: "Keeps the `*.ast-cache` packages out of `~/.fhir/packages`." },
          { name: "fsh-users", schema: t("FilesystemPath"), required: false, description: "`fsh-file-users/v1` from `fsh-cone --file-users`, so a changed RuleSet- or Alias-only file reaches its users instead of forcing a full build." },
        ],
        outputs: [{ name: "rounds", schema: t("Count"), description: "Rounds to a fixed point; exit 3 when it does not converge, which means run a full build." }],
      },
      satisfies: ["ig-publisher-fork"],
      selection: {
        when: "A plan says `incremental`.",
        limits:
          "UNTESTED end to end as of 2026-09-30. The fork README names the risks to check first, beginning with a canonical collision between the cache package and the temporary IG.",
        cost: "A Publisher run over the cone, plus loading the cache package.",
      },
      requires: { runtime: ["java", "sushi"], network: true },
    }),

    defineTool({
      id: "ig-ast-measure-real-igs",
      title: "Measure the AST export on real IGs",
      description:
        "Build smart-trust and smart-immunizations through `ig-ast-export` and print the W1/W2 measurements: counts, whether FSH sources sit where the plan expects, and logic-layer edge coverage per resource type against 458 of 458. `--byte-identical` adds a stock build and an `output/` diff.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher" },
      invoke: { shell: "fhir-ig-publisher/ast-export/scripts/run-real-igs.sh [work-dir] [--byte-identical]" },
      io: {
        inputs: [{ name: "work-dir", schema: t("FilesystemPath"), required: false }],
        outputs: [{ name: "logic-covered", schema: t("Count"), description: "Logic resources carrying at least one edge to another logic resource in the IG." }],
      },
      satisfies: ["ig-publisher-fork"],
      selection: {
        when: "Taking bean a9tx's measurements, on a machine that reaches the package registry.",
        limits: "Two named WHO IGs are the subjects because the 61 % gap was measured on one of them; the script itself knows nothing about WHO beyond their repository names.",
        cost: "Two full IG builds, three with `--byte-identical`.",
      },
      requires: { runtime: ["java", "maven", "sushi", "jekyll", "python3", "git"], network: true },
    }),

    defineTool({
      id: "fhir-cache-seed-npm",
      title: "Seed the FHIR package cache from trusted sources (exact versions)",
      description:
        "Fill `~/.fhir/packages` (or `--cache`) for an environment that cannot reach packages.fhir.org, from trust anchors only: npm account `grahamegrieve` (owner-trusted), publishers' own published-site repositories (the seeder's list, each fetch verified against the tarball's own package.json), template repos found through FHIR/ig-registry's templates.json read live each run, and an owner `--mirror`. Exact versions only (a patch wildcard resolves as the Publisher resolves it, recorded); every tarball verified; nothing computed once and kept; provenance recorded; missing versions listed, never substituted.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher" },
      invoke: { shell: "python3 fhir-ig-publisher/ast-export/scripts/seed-fhir-cache-from-npm.py [--cache <dir>] [--sushi-config <file>] [--mirror <dir|git-url>] [--template-repo <name=owner/repo>] [--missing-out <file>] [--dry-run] [name#version ...]" },
      io: {
        inputs: [
          { name: "sushi-config", schema: t("FilesystemPath"), required: false, description: "Seed what this IG pins: its `dependencies:` and the core package for its `fhirVersion`." },
          { name: "cache", schema: t("FilesystemPath"), required: false, description: "Default `~/.fhir/packages`, which SUSHI and the IG Publisher read." },
          { name: "dry-run", schema: t("Flag"), required: false, description: "Resolve and report; download nothing." },
          { name: "mirror", schema: t("FilesystemPath"), required: false, description: "A directory or git repository of `<name>#<version>.tgz` filled by `fhir-package-mirror`." },
          { name: "missing-out", schema: t("FilesystemPath"), required: false, description: "Write the missing list, one `name#version` per line: the input `fhir-package-mirror` takes." },
        ],
        outputs: [
          { name: "installed", schema: t("Count") },
          { name: "missing", schema: t("Count"), description: "Exit 1 when any is missing. Each is listed with why: not on npm, a different version only, an untrusted maintainer, or not an exact version." },
        ],
      },
      satisfies: ["ig-publisher-fork"],
      selection: {
        when: "packages.fhir.org is unreachable and registry.npmjs.org is not.",
        limits:
          "Measured 2026-10-01 over the two IGs bean a9tx measures: 20 packages install; pinned HL7 versions need `--mirror`. A template FHIR/ig-registry does not list is named with `--template-repo`. A partly seeded cache does not make a faithful build of an IG whose pins it misses.",
        cost: "One download per package; the core packages are tens of megabytes.",
      },
      requires: { runtime: ["python3", "npm", "git"], network: true },
    }),

    defineTool({
      id: "fhir-package-mirror",
      title: "Mirror FHIR packages from packages.fhir.org into a git repository",
      description:
        "On a machine that reaches packages.fhir.org, fetch exactly a missing list (from `fhir-cache-seed-npm --missing-out`), check each tarball names itself exactly, record SHA512SUMS, and commit and push to a git repository that an environment without packages.fhir.org reads with `--mirror`. The person running it is the trust anchor for what it adds.",
      install: { cli: "git clone -b claude/ast-export https://github.com/litlfred/fhir-ig-publisher" },
      invoke: { shell: "fhir-ig-publisher/ast-export/scripts/mirror-fhir-packages.sh <mirror-repo-dir> <missing.txt | name#version ...>" },
      io: {
        inputs: [
          { name: "mirror-repo-dir", schema: t("FilesystemPath"), required: true, description: "A git checkout to fill; committed and pushed when it is one." },
          { name: "missing", schema: t("FilesystemPath"), required: true, description: "The seeder's `--missing-out` file, so nothing unneeded is mirrored." },
        ],
        outputs: [{ name: "mirrored", schema: t("Count"), description: "Exit non-zero when any could not be fetched or named itself differently." }],
      },
      satisfies: ["ig-publisher-fork"],
      selection: {
        when: "The seeder reports missing packages and the environment that needs them cannot reach packages.fhir.org.",
        limits: "Run where packages.fhir.org is reachable. It mirrors exact versions only; a wildcard in the list is resolved by the seeder first.",
        cost: "One download per package; terminology packages are megabytes each.",
      },
      requires: { runtime: ["bash", "curl", "python3", "git"], network: true },
    }),

    defineTool({
      id: "ig-ast-validity",
      title: "Is this IG AST still valid for the IG's current inputs?",
      description:
        "Run folio-assistant-core's `compiledValidity` on an AST manifest's `inputs`: recompute the input digest (the same algorithm as the Java writer, pinned by a shared golden vector) and the source revision, and answer valid, stale-inputs (naming which input), or cannot-tell.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-ast.ts validity <ast> --ig <root> [--toolchain <s>]" },
      io: {
        inputs: [
          { name: "ast", schema: t("FilesystemPath"), required: true },
          { name: "ig", schema: t("FilesystemPath"), required: true },
          { name: "toolchain", schema: t("Text"), required: false, description: "The Publisher that would run now. Without it the toolchain is ASSUMED unchanged, and the result says so." },
        ],
        outputs: [{ name: "verdict", schema: t("Text"), description: "Exit 0 valid, 1 stale-inputs, 2 cannot-tell. Cannot-tell is never a pass." }],
      },
      satisfies: ["ig-ast-delta"],
      selection: {
        when: "Before trusting, planning against, or rendering from a cached AST.",
        limits: "Valid means built from these inputs, not built correctly.",
        cost: "Reads `input/` once to hash it.",
      },
      requires: { runtime: ["bun", "git"], network: false },
    }),

    defineTool({
      id: "ig-ast-diff",
      title: "List and view the delta between two IG ASTs",
      description:
        "Diff two ASTs by resource key: added, removed, changed (with a structural element-level differential) and version-changed resources, plus edges added and removed; optionally fold in the incremental plan, and render just-the-docs pages (an index that lists, a page per resource that shows) every one of which carries the provisional mark. `list <ast>` summarises one AST.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-ast.ts diff <base> <head> [--plan plan.json] [--json delta.json] [--site <dir>]" },
      io: {
        inputs: [
          { name: "base", schema: t("FilesystemPath"), required: true },
          { name: "head", schema: t("FilesystemPath"), required: true },
          { name: "plan", schema: t("FilesystemPath"), required: false },
          { name: "site", schema: t("FilesystemPath"), required: false, description: "A directory inside the IG's just-the-docs source; pages are wrapped in `{% raw %}` so FHIR narratives' Liquid is not executed." },
        ],
        outputs: [
          { name: "changed", schema: t("Count") },
          { name: "pages", schema: t("Count"), description: "Pages written: one index, one per changed or version-changed resource." },
        ],
      },
      satisfies: ["ig-ast-delta"],
      selection: {
        when: "Reviewing an incremental build, or comparing an incremental AST with a full one (W8).",
        limits:
          "Structural, not FHIR-semantic: a reordered repeating element shows a change at every index. At most 200 differential rows per resource; the rest is counted, never dropped silently.",
        cost: "Reads both ASTs once.",
      },
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "ig-ast-list",
      title: "Summarise one IG AST",
      description:
        "Counts per resource type, edges in total and resolved inside the IG, edges by origin (upstream's DependencyAnalyser or ast-export's LogicEdges), whether the AST is mixed-provenance and how many resources each revision built, and what the manifest declares provisional.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-ast.ts list <ast>" },
      io: {
        inputs: [{ name: "ast", schema: t("FilesystemPath"), required: true }],
        outputs: [{ name: "resources", schema: t("Count") }],
      },
      satisfies: ["ig-ast-delta"],
      selection: {
        when: "Before diffing or rendering, to see what an AST holds; after a merge, to see how mixed it is.",
        limits: "Counts only; it does not check the AST against the IG's inputs (`ig-ast-validity` does).",
        cost: "Reads the manifest and dependency document once.",
      },
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "ig-ast-render",
      title: "Render a computed IG AST delta as just-the-docs pages",
      description:
        "Write the pages for a delta already computed by `ig-ast-diff --json`: an index that lists, a page per changed resource that shows, every one opening with the provisional mark and with Liquid in values neutralised.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-ast.ts render <delta.json> --site <dir>" },
      io: {
        inputs: [
          { name: "delta", schema: t("FilesystemPath"), required: true, description: "`ig-ast-delta/v1`, from `ig-ast-diff --json`." },
          { name: "site", schema: t("FilesystemPath"), required: true },
        ],
        outputs: [{ name: "pages", schema: t("Count") }],
      },
      satisfies: ["ig-ast-delta"],
      selection: {
        when: "Re-rendering a stored delta without the two ASTs, e.g. into a staging site.",
        limits: "Shows what the delta records; it cannot add a differential the delta did not compute.",
        cost: "Milliseconds per page.",
      },
      requires: { runtime: ["bun"], network: false },
    }),
    defineTool({
      id: "ig-cache",
      title: "FHIR AST cache",
      description:
        "Restore, verify, seed and diagnose the prebuilt AST artefacts for an IG. Always try `restore` first: a full AST build via AstExportCli is expensive, a restore is fast.",
      install: { none: true },
      invoke: { shell: "fhir-harness/scripts/ig-cache.sh" },
      io: {
        inputs: [
          { name: "action", schema: t("IgCacheAction"), required: true, arg: { positional: 0 }, description: "The verb. `doctor` exists because a restore that silently missed used to look exactly like one that worked." },
          { name: "igRoot", schema: t("RepoPath"), required: false, arg: { flag: "--ig-root" }, description: "The IG whose AST is acted on." },
          { name: "package", schema: t("PackageName"), required: false, arg: { flag: "--package" } },
          { name: "remote", schema: t("PackageName"), required: false, arg: { flag: "--remote" }, description: "Git remote to fetch from / push to. Default 'origin'. Use when the IG's origin is upstream (WHO) and the cache lives on a fork." },
        ],
        outputs: [{ name: "result", schema: t("Text"), description: "A real hit, a miss, or a diagnosis — never a miss that reads as a hit." }],
      },
      satisfies: ["compiled-artefact-cache", "ig-ast-delta"],
      requires: { runtime: ["bash", "git"], network: true },
    }),

    defineTool({
      id: "ig-ast-jsonld",
      title: "Export an IG AST as JSON-LD",
      description:
        "Write an AST as linked data against `fhir-harness/schemas/ig-ast.context.jsonld`: each resource a node identified by its canonical URL (`urn:fhir:<Type>/<id>` when it has none) and typed by its FHIR resource type, each dependency edge a link to its target, and the manifest's `authority: cache` and `provisional` list carried on the graph. The AST is validated against the Zod declaration the JSON Schemas are generated from before it is exported (bean `l0lq`).",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-ast.ts jsonld <ast> > ast.jsonld" },
      io: {
        inputs: [{ name: "ast", schema: t("FilesystemPath"), required: true }],
        outputs: [{ name: "jsonld", schema: t("FilesystemPath"), description: "JSON-LD on stdout." }],
      },
      satisfies: ["ig-ast-delta"],
      selection: {
        when: "Handing an AST to a consumer that reads linked data, or joining it with another graph by canonical URL.",
        limits: "Exports the manifest and edges, not each resource's full JSON; a consumer that needs the resource body reads its `file`. Still a cache: the export carries the provisional mark, it does not remove it.",
        cost: "Reads the manifest and dependency document once.",
      },
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "ig-binary-audit",
      title: "Measure the IG Publisher's binary outputs on a pages branch",
      description:
        "Read a pages branch's git tree and report the Publisher's binary outputs (full-ig.zip, package.tgz and variants, package.db, validator packs, the definitions/examples/expansions zips, spreadsheets) by name: copies, bytes, and how much of it sits in branch previews. Reads the tree, never a checkout, so a multi-gigabyte branch costs a depth-1 fetch.",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ig-binary-audit.ts --repo <checkout> [--ref origin/gh-pages] [--previews branches/] [--json]" },
      io: {
        inputs: [
          { name: "repo", schema: t("FilesystemPath"), required: false, description: "A clone that has the pages branch fetched." },
          { name: "ref", schema: t("Text"), required: false, description: "Default `origin/gh-pages`." },
        ],
        outputs: [{ name: "audit", schema: t("Text"), description: "A table, or `ig-binary-audit/v1` JSON with `--json`." }],
      },
      satisfies: ["ig-binary-artefacts"],
      selection: {
        when: "Before configuring an IG's deploy or release step, when a pages branch nears its size limit, or before linking a download from a page.",
        limits: "Counts only the Publisher's own binary names; another large file is in `total` but not itemised. It measures, and deletes nothing.",
        cost: "One `git ls-tree` over the branch; seconds for 64,000 files.",
      },
      requires: { runtime: ["bun", "git"], network: false },
    }),

    defineTool({
      id: "ingest-ig-releases",
      title: "Record an IG's GitHub releases as pointers to their binary assets",
      description:
        "Read an IG repository's GitHub releases and write `fhir-artifact-index/releases.json` (`ig-releases/v1`): each asset's name, size, SHA-256 digest and download URL, never its bytes. The IG site's generated `releases` page lists them (bean `b8ip`).",
      install: { none: true },
      invoke: { shell: "bun run fhir-harness/scripts/ingest-ig-releases.ts --instance <dir> [--repo owner/repo] [--from releases.json]" },
      io: {
        inputs: [
          { name: "instance", schema: t("FilesystemPath"), required: true },
          { name: "repo", schema: t("Text"), required: false, description: "`owner/repo`; default the instance menu's recorded IG source, else its declaration's `repository`." },
        ],
        outputs: [{ name: "releases", schema: t("FilesystemPath"), description: "`<instance>/fhir-artifact-index/releases.json`." }],
      },
      satisfies: ["ig-binary-artefacts"],
      selection: {
        when: "After an IG repository cuts a release, so its pages list the new assets.",
        limits: "A record of what GitHub reported on the day it was read; a later release is absent until the next run. Drafts are never recorded.",
        cost: "One GitHub API call per 100 releases.",
      },
      requires: { runtime: ["bun"], network: true },
    }),
  ];
}

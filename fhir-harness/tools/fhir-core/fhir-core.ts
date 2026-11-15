import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "fhir-core",
    title: "Load the stable FHIR releases' core StructureDefinitions as a graph keyed by canonical URL",
    description:
      "Read each stable FHIR release's core package (`hl7.fhir.r4.core#4.0.1`, `hl7.fhir.r4b.core#4.3.0`, `hl7.fhir.r5.core#5.0.0`) at the version, sha1 and sha512 `fhir-core/pins.json` pins, and keep its resources, complex and primitive types and root types (Base, Element, BackboneElement, DomainResource, Resource) under `fhir-core/<release>/`, keyed by canonical URL. `index` writes the release's manifest (each definition's kind, type, base and sha256); `materialise` writes the bodies byte for byte as the package holds them; `check` holds the two to the pins offline; `resolve` answers which file a canonical URL is kept in. A package that cannot be fetched or verified is recorded as `unread` with the reason, never as an empty graph.",
    install: { none: true },
    invoke: { shell: "bun run fhir-harness/scripts/fhir-core.ts <index|materialise|check|resolve <url>>" },
    io: {
      inputs: [
        { name: "root", schema: t("RepoPath"), required: false, arg: { flag: "--root" }, description: "The fhir-harness layer root. Default: the layer this script is in." },
        { name: "release", schema: t("Slug"), required: false, arg: { flag: "--release" }, description: "One release (R4, R4B or R5). Default: every pinned release." },
        { name: "tgz-dir", schema: t("RepoPath"), required: false, arg: { flag: "--tgz-dir" }, description: "A directory of already-downloaded `<name>-<version>.tgz`; still hash-checked against the pin." },
      ],
      outputs: [{ name: "definitions", schema: t("Count"), description: "Definitions indexed or materialised per release; an unread release is named with its reason." }],
    },
    satisfies: ["ig-build-pipeline"],
    selection: {
      when: "Before a reader resolves a FHIR core type by canonical URL (a class diagram of an IG's logical models or profiles), or when a pin changes.",
      limits: "Stable releases only. Constraint profiles, extension definitions and logical models in the core package are left out and counted.",
      cost: "One 13-17 MB download per release, then seconds; `check` and `resolve` are offline.",
    },
    requires: { runtime: ["bun"], network: true },
    remedies: [
      {
        host: "packages.fhir.org",
        none: "Pass `--tgz-dir` with the pinned tarballs fetched elsewhere (`fhir-package-mirror`): the bytes are still checked against the pin. Without either, the release is written `unread`, and `resolve` answers could-not-determine.",
      },
    ],
  }),
);

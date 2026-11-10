import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "ig-release",
    title: "Cut an IG release as a GitHub draft that carries its packages and AST",
    description:
      "Gather a release's files from a full Publisher build (package.tgz and its R4/R4B variants, and ast-data.zip, the IG's AST with the Libraries' ELM), say from sushi-config.yaml whether it is a pre-release, and make or refresh the GitHub DRAFT release for the tag with the files uploaded. The owner publishes the draft; a published release is never changed.",
    install: { none: true },
    invoke: { shell: "bun run fhir-harness/scripts/ig-release.ts assets|kind|draft …" },
    io: {
      inputs: [
        { name: "output", schema: t("FilesystemPath"), required: false, description: "`assets`: the Publisher's output/ directory." },
        { name: "ast", schema: t("FilesystemPath"), required: false, description: "`assets`: the AST directory (its manifest.json)." },
        { name: "tag", schema: t("Text"), required: false, description: "`draft`: the git tag the release is for." },
      ],
      outputs: [{ name: "release", schema: t("Text"), description: "The files with size and SHA-256 (`assets`), `prerelease`/`release` (`kind`), or what was done (`draft`)." }],
    },
    satisfies: ["ig-binary-artefacts"],
    selection: {
      when: "When an IG version is tagged: the IG's `ig-release.yml` caller runs it after a full AST build of the tag.",
      limits: "Makes drafts only; publishing is the owner's step on GitHub. Needs a token that may write the repository's releases.",
      cost: "One full Publisher build (in the workflow), then a few REST calls and the uploads.",
    },
    requires: { runtime: ["bun", "zip", "gh"], network: true },
  }),
);

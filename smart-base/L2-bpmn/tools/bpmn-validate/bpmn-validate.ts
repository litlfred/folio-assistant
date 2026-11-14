import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "bpmn-validate",
    title: "BPMN structure, vendor namespaces and lane → actor",
    description:
      "Check a DAK's BPMN (`validate.ts` beside this file; bean folio-assistant-tgaj, which replaced four Python validators with it): well-formed XML whose root is `<bpmn:definitions>`, no Camunda or Zeebe namespace, no duplicate id, at least one process, no bpmn-moddle (bpmn-js) import warning; every process has a `<laneSet>`, every flow node sits in a lane, and lane ids are unique and valid FSH ids; and every innermost lane names its actor by id: its `partitionElementRef` (a top-level `<bpmn:resource>`), else its own id, matched exactly against the `Instance:` ids of the ActorDefinitions in the IG's FSH (or JSON) and, for a harness process, the role ids of the mounted layers' `scenarios/roles.json`. Never by file name or title. With no file named it reads the declared process directories, `smart-base/**/processes/` and an IG's `input/bpmn/`.",
    install: { none: true },
    invoke: {
      shell:
        "bun run smart-base/L2-bpmn/tools/bpmn-validate/validate.ts [file.bpmn ...] [--root <repo>] [--fsh <dir>]... [--roles <roles.json>]... [--changed <git ref>] [--json] [--verbose]",
    },
    io: {
      inputs: [
        { name: "bpmn", schema: t("RepoPath"), required: false, description: "The .bpmn files to check; when absent, every .bpmn under the declared process directories (or, with `--changed <ref>`, those the branch changed)." },
        { name: "fsh", schema: t("RepoPath"), required: false, arg: { flag: "--fsh" }, description: "Directories of ActorDefinition FSH or JSON; default `input/fsh` and `input/resources`." },
        { name: "roles", schema: t("RepoPath"), required: false, arg: { flag: "--roles" }, description: "`scenarios/roles.json` files whose role ids a harness lane may bind; default those of smart-base and the mounted cat-harness, fhir-harness and folio-assistant-core." },
      ],
      outputs: [
        { name: "report", schema: t("Text"), description: "One `✗` line per error and `!` per warning, then a count. Exit 0 no error, 1 an error, 2 nothing to check (not a pass). `--json` prints the findings as data." },
      ],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A DAK's business process (L2, BPMN) is added or edited, before review (skill `l2-component-edit-review`, the BPMN row's checker), and on every pull request that changes a `.bpmn`.",
      limits:
        "An ActorDefinition a dependency IG declares is found only when its FSH or JSON directory is passed with `--fsh`. Reads lanes, not pools: a participant whose process has no lanes is reported as a process with no laneSet. A lane bound to a harness role is accepted here; whether that role is equipped is cat-harness's `role-model` check (`kg:audit`). A published DAK whose processes are still Visio figures is crosswalked against its personas by `smart-base/scripts/dak-swimlanes.ts` (always on, beside the `web-annex` kind's `dak-swimlanes/v1` validator), not by this Tool. It does not draw the diagram (`render:bpmn` does) or check DI completeness.",
      cost: "Seconds, no network.",
    },
    requires: { runtime: ["bun"], network: false },
  }),
);

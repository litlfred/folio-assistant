import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "dak-task-annotations",
    title: "DAK task annotations → BPMN sidecars",
    description:
      "Read a DAK document's per-task \"NOTES AND ANNOTATIONS\" from its L1 section text (who-iris), match each numbered item to the BPMN task it describes (by @id, then the label's step number with the file's process letter, then the name), add the persona from the task's lane or pool and the data elements, functional requirements and decision tables the DAK workbooks key to the activity id, and write one `dak-task-annotations/v1` sidecar (`<file>.tasks.json`) beside each BPMN (`smart-base/L2-bpmn/scripts/dak-task-annotations.ts`, schema `smart-base/L2-bpmn/schemas/task-annotations.ts`). Items no task matches are listed for a person to adjudicate; a re-run keeps adjudicated matches. `--report` prints what a set of sidecars covers and never fails. The BPMN is read, never written, and nothing FHIR-specific is involved.",
    install: { none: true },
    invoke: { shell: "bun run smart-base/L2-bpmn/scripts/dak-task-annotations.ts" },
    io: {
      inputs: [
        { name: "prefix", schema: t("DocId"), required: true, arg: { flag: "--prefix" }, description: "The DAK's id prefix: IMMZ, TB, CHUD." },
        { name: "document", schema: t("DocId"), required: true, arg: { flag: "--document" }, description: "The L1 library document id the annotations are read from." },
        { name: "l1", schema: t("RepoPath"), required: true, arg: { flag: "--l1" }, description: "A section .md of that document holding the annotations blocks; repeatable." },
        { name: "bpmn", schema: t("RepoPath"), required: true, arg: { flag: "--bpmn" }, description: "A .bpmn file or a directory of them; repeatable." },
        { name: "xlsx", schema: t("WorkbookPath"), required: false, arg: { flag: "--xlsx" }, description: "A DAK workbook (data dictionary, requirements, decision-support logic); repeatable." },
      ],
      outputs: [{ name: "sidecars", schema: t("RepoPath"), description: "One <file>.tasks.json beside each BPMN (with --write)." }],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A DAK's BPMN task annotations are to be made computable: recorded beside the BPMN for review and put in the knowledge graph by kg-extract-bpmn.",
      limits:
        "Reads the flattened L1 text, so an item's page is not recorded; a step number is accepted only where the list's sequence allows it, which keeps page numbers out but can merge a mis-numbered item into its predecessor. Sub-steps a figure draws but the annotations do not describe are listed as unannotated.",
      cost: "Seconds, no network.",
    },
  }),
);

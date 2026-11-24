import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "dmn-to-html",
    title: "DMN → HTML",
    description:
      "Render each DMN decision table to an HTML fragment for a page, via `dmn2html.xslt` and `dmn.css`.",
    install: { none: true },
    invoke: { shell: "python3 input/scripts/transform_dmn.py" },
    io: {
      inputs: [{ name: "dmnDir", schema: t("RepoPath"), required: true }],
      outputs: [{ name: "html", schema: t("RepoPath"), description: "One HTML fragment per decision table." }],
    },
    satisfies: ["dak-preprocessing"],
    selection: {
      when: "A reader needs to see a decision table as a table.",
      limits:
        "Its output is HTML, which the JSON-only render contract (`ig-render-jekyll`) does not accept as a representation. Whether the just-the-docs pipeline gets a structured output from it or carries the HTML as an embedded asset is undecided.",
      cost: "Seconds; needs `lxml` for the XSLT.",
    },
    requires: { runtime: ["python3"], network: false },
  }),
);

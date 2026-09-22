import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "ig-publisher",
  title: "The FHIR IG Publisher",
  navOrder: 12,
  nodes: [
    { id: "overview", block: "overview" },
    { id: "what-it-emits", title: "What one run emits", block: "what-it-emits" },
    {
      id: "what-only-it-can-do",
      title: "The three things nothing else can do",
      block: "what-only-it-can-do",
    },
    {
      id: "what-it-cannot-be-asked-for",
      title: "What it cannot be asked for",
      block: "what-it-cannot-be-asked-for",
    },
    {
      id: "the-version-floats",
      title: "The version floats, and that is not a detail",
      block: "the-version-floats",
    },
    { id: "where-the-rules-live", title: "Where the rules live", block: "where-the-rules-live" },
  ],
});

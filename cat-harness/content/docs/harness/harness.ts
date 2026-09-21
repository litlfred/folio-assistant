import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "harness",
  title: "The Harness",
  navOrder: 11,
  nodes: [
    { id: "overview", block: "overview" },
    {
      id: "instantiation",
      title: "Instantiation — a config file at a root",
      block: "instantiation",
    },
    {
      id: "the-dependency-walk",
      title: "How the dependency tree is walked",
      block: "the-dependency-walk",
    },
    {
      id: "harnessing-a-directory",
      title: "What harnessing a directory obliges",
      block: "harnessing-a-directory",
    },
    {
      id: "not-declared-yet",
      title: "Three things the model asks for and the code does not do",
      block: "not-declared-yet",
    },
    {
      id: "where-the-rules-live",
      title: "Where the rules live",
      block: "where-the-rules-live",
    },
  ],
});

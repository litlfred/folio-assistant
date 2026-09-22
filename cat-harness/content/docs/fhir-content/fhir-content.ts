import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "fhir-content",
  title: "FHIR content",
  navOrder: 13,
  nodes: [
    { id: "overview", block: "overview" },
    { id: "the-three-layers", title: "L1, L2, L3 — three layers, not three stages", block: "the-three-layers" },
    { id: "representations", title: "Representations, and why only one is taken", block: "representations" },
    { id: "the-artefact-index", title: "The artefact index is reconstructed", block: "the-artefact-index" },
    { id: "the-dak-surface", title: "The DAK API surface", block: "the-dak-surface" },
    { id: "where-the-rules-live", title: "Where the rules live", block: "where-the-rules-live" },
  ],
});

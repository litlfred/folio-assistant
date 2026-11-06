import { describe, expect, test } from "bun:test";
import { CORE_NAMESPACE, DSPACE_NAMESPACE } from "./own-namespace.ts";
import { DSPACE_NS } from "./dublin-core.ts";

describe("own namespaces, derived from the declaration (folio-assistant#2598)", () => {
  // The values the harness's own-namespaces code list held until 2026-10-16:
  // moving where they come from must not move what they are.
  test("the vocabulary namespace is unchanged", () => {
    expect(CORE_NAMESPACE).toBe("https://litlfred.github.io/folio-assistant-core/v0/ns/");
  });
  test("the DSpace field namespace is unchanged, and is what dublin-core mints under", () => {
    expect(DSPACE_NAMESPACE).toBe("https://litlfred.github.io/folio-assistant-core/v0/ns/dspace/");
    expect(DSPACE_NS).toBe(DSPACE_NAMESPACE);
  });
});

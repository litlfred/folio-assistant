/**
 * This instance DECLARES the paper adapter, and the harness finds it there.
 *
 * Until 2026-09-30 the harness named this directory itself —
 * `../folio-assistant-sci/adapters/paper/index.ts` in `src/builtin-adapters.ts` —
 * and its test asserted `layer: "sci"`. The dependency is inverted now (bean
 * `p11x`): the declaration lives in `folio-assistant-sci.json`, so the
 * assertion that paper is THIS instance's lives with it, and the harness's own
 * test holds in a checkout of the harness alone.
 */
import { describe, expect, test } from "bun:test";

import { BUILTIN_ADAPTERS, resolveBuiltinAdapter } from "../../../cat-harness/src/builtin-adapters.ts";
import { PaperContentAdapter } from "./index.ts";

describe("paper adapter declaration", () => {
  test("is discovered from this instance's declaration, and leads as the superset", () => {
    const paper = BUILTIN_ADAPTERS.find((a) => a.contentType === "paper");
    expect(paper).toMatchObject({ instance: "folio-assistant-sci", className: "PaperContentAdapter", extends: "document" });
    // Falling back TO paper loses nothing; falling back FROM it loses Lean and TeX.
    expect(BUILTIN_ADAPTERS[0]?.contentType).toBe("paper");
  });

  test("resolves to the class this directory exports", async () => {
    const r = await resolveBuiltinAdapter("paper");
    expect(r.fallbackReason).toBeUndefined();
    expect(r.ctor).toBe(PaperContentAdapter as never);
  });
});

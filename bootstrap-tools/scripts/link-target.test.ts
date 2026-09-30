import { describe, expect, test } from "bun:test";

import { linkTarget } from "./link-target.ts";

describe("a path written as a Markdown link target", () => {
  test("an ordinary path is unchanged, so no existing link moves", () => {
    expect(linkTarget("skills/bootstrap-kg-navigation.md")).toBe("skills/bootstrap-kg-navigation.md");
    expect(linkTarget("processes/")).toBe("processes/");
    expect(linkTarget("kg-export.@litlfred/")).toBe("kg-export.@litlfred/");
  });

  test("a space or a parenthesis cannot end the link early", () => {
    const t = linkTarget("uploads/PIIS2589750021000388 (2).pdf");
    expect(t).toBe("uploads/PIIS2589750021000388%20%282%29.pdf");
    expect(/[\s()]/.test(t)).toBe(false);
    expect(decodeURIComponent(t)).toBe("uploads/PIIS2589750021000388 (2).pdf");
  });
});

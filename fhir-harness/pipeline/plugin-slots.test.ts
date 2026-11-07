/**
 * Loading this layer's contributions registers its content type.
 *
 * Run in a fresh process: inside `bun test` another file may already have
 * loaded `ig-content-type.ts`, and the default registry would answer yes for
 * the wrong reason. Not calibrated against the explicit import alone: the
 * IG readers `stage-local-ig.ts` loads now import the schema as well (through
 * `ig-read-scope.ts`), so removing only the import in `plugin-slots.ts` still
 * passes. The import is kept so registration does not depend on that chain.
 */
import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

describe("plugin-slots.ts", () => {
  it("registers the ig content type in the default registry when the contributions loader requires it", () => {
    const here = import.meta.dir;
    const script = [
      `require(${JSON.stringify(join(here, "plugin-slots.ts"))});`,
      `const { defaultContentTypes } = require(${JSON.stringify(join(here, "..", "..", "cat-harness-tools", "schemas", "content", "content-type.ts"))});`,
      `console.log(defaultContentTypes.get("ig") !== undefined);`,
    ].join("\n");
    const r = spawnSync("bun", ["-e", script], { encoding: "utf-8", cwd: join(here, "..") });
    expect(r.stderr.trim().split("\n").filter((l) => /error/i.test(l))).toEqual([]);
    expect(r.stdout.trim().split("\n").pop()).toBe("true");
  });
});

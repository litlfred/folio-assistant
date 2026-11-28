import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { blocksOf, declaredNames, judge, leanLineNames, mainDeclarations, sourceModules } from "./lean-narrative-roundtrip.ts";

const ROOT = mkdtempSync(join(tmpdir(), "lean-roundtrip-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

function file(path: string, body: string): string {
  const f = join(ROOT, path);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, body);
  return f;
}

const LEAN = `/-!
# Codes

## Main definitions

* \`Code.UniquelyDecodable S\`: every concatenation parses one way.

## Main results

* \`Code.kraft\`, \`Code.mcmillan\`: the two inequalities.
-/
namespace Code
def UniquelyDecodable := True
theorem kraft : True := trivial
section
theorem mcmillan : True := trivial
end
end Code
theorem _root_.top : True := trivial
`;
const src = file("Lib/Codes.lean", LEAN);

describe("a narrative names only declarations its library proves", () => {
  test("declaredNamesTrackNamespaces", () => {
    expect([...declaredNames([src])].sort()).toEqual(["Code.UniquelyDecodable", "Code.kraft", "Code.mcmillan", "top"]);
  });
  test("mainDeclarationsReadTheModuleDocstring", () => {
    expect(mainDeclarations(LEAN)).toEqual(["Code.UniquelyDecodable", "Code.kraft", "Code.mcmillan"]);
  });
  test("leanAndSourceLinesAreRead", () => {
    const md = "Text.\n\n*Lean:* `kraft`, `Code.mcmillan`.\n*Source:* `Lib.Codes`, `.Other`.\n";
    expect(leanLineNames(md)).toEqual(["kraft", "Code.mcmillan"]);
    expect(sourceModules(md)).toEqual(["Lib.Codes", "Lib.Other"]);
  });
  test("unknownNameFailsAndMissingMainResultWarns", () => {
    const folio = join(ROOT, "folio");
    file("folio/ch/thm-kraft.md", "Kraft.\n\n*Lean:* `kraft`.\n*Source:* `Lib.Codes`.\n");
    file("folio/ch/thm-kraft.ts", 'export default theorem({ "lean": { "ref": "mathlib:Code.kraft" } });\n');
    file("folio/ch/thm-bogus.md", "Bogus.\n\n*Lean:* `Code.nonesuch`.\n");
    file("folio/ch/thm-bogus.ts", "export default theorem({});\n");
    const decls = declaredNames([src]);
    const v = judge(blocksOf(folio), decls, (m) => (m === "Lib.Codes" ? LEAN : undefined), "mathlib");
    const by = Object.fromEntries(v.map((x) => [x.block.md.split("/").pop(), x]));
    expect(by["thm-bogus.md"].result).toBe("fail");
    expect(by["thm-kraft.md"].result).toBe("warn");
    expect(by["thm-kraft.md"].notes).toContain("not stated: Lib.Codes: `Code.UniquelyDecodable`");
  });
});

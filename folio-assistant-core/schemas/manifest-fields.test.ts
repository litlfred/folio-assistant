/** `manifestFields` (bean f327): a DAK block's fields read from its text, never executed. */
import { describe, expect, it } from "bun:test";

import { manifestFields } from "./manifest-fields";

describe("manifestFields", () => {
  it("flattens a persona's literal, leaving out its identity", () => {
    const src = `import { persona } from "../../schema/dak";

export default persona({
  label: "pers:health-worker",
  title: "Health worker",
  uses: [],
  meta: {"source": {"library": "twg", "file": "a/b.md"}, "personaType": "person", "n": 3, "ok": true},
});
`;
    expect(manifestFields(src)).toEqual({
      title: "Health worker",
      uses: "(none)",
      "meta.source.library": "twg",
      "meta.source.file": "a/b.md",
      "meta.personaType": "person",
      "meta.n": "3",
      "meta.ok": "true",
    });
  });

  it("reads a list of scalars as one field and indexes nested entries", () => {
    const src = `export default functionalRequirement({ label: "freq:x", actors: ['a', "b"], steps: [{ n: 1 }, { n: 2 }] })`;
    expect(manifestFields(src)).toEqual({ actors: "a, b", "steps[0].n": "1", "steps[1].n": "2" });
  });

  it("keeps what it cannot read as source, never drops or guesses it", () => {
    const src = "export default persona({ label: `p`, title: TITLE, note: `hi ${x}`, // c\n meta: { a: f(1, 2) } })";
    expect(manifestFields(src)).toEqual({ title: "TITLE", note: "`hi ${x}`", "meta.a": "f(1, 2)" });
  });

  it("is undefined when there is no builder call to read", () => {
    expect(manifestFields("export const x = 1;")).toBeUndefined();
  });
});

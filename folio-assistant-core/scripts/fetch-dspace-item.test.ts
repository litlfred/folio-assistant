import { describe, expect, test } from "bun:test";

import { dspaceToRecord, licenceFromRecord } from "./fetch-dspace-item.ts";

// The shape WHO IRIS returned for 10665/340749 on 2026-10-06, cut down.
const META = {
  "dc.title": [{ value: "Leave no one behind: guidance for planning and implementing catch-up vaccination", language: "en", authority: null }],
  "dc.identifier.isbn": [
    { value: "9789240016514 (electronic version)", language: "", authority: null },
    { value: "9789240016521 (print version)", language: "", authority: null },
  ],
  "dc.identifier.uri": [{ value: "https://iris.who.int/handle/10665/340749", language: null, authority: null }],
  "dc.rights": [{ value: "CC BY-NC-SA 3.0 IGO", language: "", authority: null }],
  "dc.rights.uri": [{ value: "https://creativecommons.org/licenses/by-nc-sa/3.0/igo", language: null, authority: null }],
  "dc.subject.mesh": [{ value: "Vaccination", language: "en", authority: "D014611" }],
  "dc.description": [{ value: "  ", language: null, authority: null }],
};

describe("dspaceToRecord", () => {
  const rec = dspaceToRecord("58333fc5-9ec5-4d14-b341-5ae257dd0ad1", META, "https://iris.who.int/server/api/core/items/x", "2026-10-06T00:00:00Z");
  test("qualified names split into element and qualifier", () => {
    expect(rec.fields.find((f) => f.element === "identifier" && f.qualifier === "isbn")?.values.length).toBe(2);
  });
  test("an empty language or authority is absent, not empty", () => {
    const isbn = rec.fields.find((f) => f.qualifier === "isbn")!.values[0]!;
    expect("language" in isbn).toBe(false);
    expect(rec.fields.find((f) => f.qualifier === "mesh")!.values[0]!.authority).toBe("D014611");
  });
  test("a field whose only value is blank is dropped, not kept empty", () => {
    expect(rec.fields.some((f) => f.element === "description")).toBe(false);
  });
});

describe("licenceFromRecord", () => {
  const url = "https://iris.who.int/items/58333fc5";
  test("a recognised dc.rights is stated, quoting the field", () => {
    const l = licenceFromRecord(dspaceToRecord("u", META, "s", "t"), url);
    expect(l.status).toBe("stated");
    expect(l.id).toBe("CC-BY-NC-SA-3.0-IGO");
    expect(l.basis).toContain("dc.rights = 'CC BY-NC-SA 3.0 IGO'");
  });
  test("a near-miss is NOT mapped: 3.0 without IGO is a different licence", () => {
    const l = licenceFromRecord(dspaceToRecord("u", { ...META, "dc.rights": [{ value: "CC BY-NC-SA 3.0" }] }, "s", "t"), url);
    expect(l.status).toBe("unknown");
    expect(l.searched?.[0]?.result).toContain("not a licence this recognises");
  });
  test("no dc.rights is unknown, saying where it looked", () => {
    const { "dc.rights": _r, ...rest } = META;
    expect(licenceFromRecord(dspaceToRecord("u", rest, "s", "t"), url).searched?.[0]?.where).toContain("dc.rights");
  });
});

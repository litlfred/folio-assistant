import { describe, expect, it } from "bun:test";
import { dayOf, fhirSpecUrl, igFooterData, licenseUrl } from "./ig-footer.ts";

describe("igFooterData", () => {
  const pkg = {
    name: "smart.who.int.trust",
    version: "1.8.0",
    date: "20261001114021",
    license: "CC-BY-SA-3.0-IGO",
    fhirVersions: ["5.0.0"],
    author: "WHO",
    maintainers: [{ name: "WHO", url: "http://who.int" }],
  };
  const ig = { publisher: "World Health Organization", contact: [{ telecom: [{ system: "email", value: "x@y" }, { system: "url", value: "https://who.int" }] }], fhirVersion: ["5.0.0"], license: "CC-BY-4.0" };

  it("reads every value from the package, preferring the ImplementationGuide resource", () => {
    expect(igFooterData(pkg, ig, {})).toEqual({
      publisher: "World Health Organization",
      publisherUrl: "https://who.int",
      packageId: "smart.who.int.trust",
      version: "1.8.0",
      fhirVersion: "5.0.0",
      fhirUrl: "http://hl7.org/fhir/R5/",
      generated: "2026-10-01",
      license: "CC-BY-4.0",
      licenseUrl: "https://spdx.org/licenses/CC-BY-4.0.html",
    });
  });

  it("falls back to package.json, then to the index", () => {
    expect(igFooterData(pkg, undefined, {}).publisherUrl).toBe("http://who.int");
    expect(igFooterData(undefined, undefined, { packageId: "p", version: "1", fhirVersion: ["4.0.1"], builtAt: "20260826120000" })).toEqual({
      packageId: "p",
      version: "1",
      fhirVersion: "4.0.1",
      fhirUrl: "http://hl7.org/fhir/R4/",
      generated: "2026-08-26",
    });
  });

  it("leaves out what no source carries rather than writing undefined or a guess", () => {
    const d = igFooterData(undefined, undefined, {});
    expect(d).toEqual({});
    expect(JSON.stringify(d)).toBe("{}");
  });
});

describe("the footer's derived links", () => {
  it("names a FHIR release only for a version it knows", () => {
    expect(fhirSpecUrl("4.3.0")).toBe("http://hl7.org/fhir/R4B/");
    expect(fhirSpecUrl("6.0.0-ballot1")).toBeUndefined();
  });
  it("links an SPDX-shaped licence and nothing else", () => {
    expect(licenseUrl("CC0-1.0")).toBe("https://spdx.org/licenses/CC0-1.0.html");
    expect(licenseUrl("see the IG")).toBeUndefined();
  });
  it("reads a build stamp in either form", () => {
    expect(dayOf("2026-10-01T11:40:21+00:00")).toBe("2026-10-01");
    expect(dayOf("20261001114021")).toBe("2026-10-01");
    expect(dayOf("Oct 1")).toBeUndefined();
  });
});

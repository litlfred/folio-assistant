import { describe, expect, test } from "bun:test";

import { fileNameOf, isoDate, pageToRecord, readItemPage } from "./fetch-who-publication.ts";

// The shape of https://www.who.int/publications/m/item/analysis-and-use-of-health-facility-data-guidance-for-immunization-programme-managers
// as served on 2026-10-08, cut down to the dynamic-content blocks this reads.
const PAGE = `
<header class="dynamic-content__header dynamic-content__container">
  <div class="dynamic-content__heading__wrapper">
   <h1 class="dynamic-content__heading">Analysis and use of health facility data: guidance for immunization programme managers</h1>
  </div>
 <p>Working document</p>
  <div class="dynamic-content__data">
   <div class="dynamic-content__date">1 February 2018</div>
    <div class="dynamic-content__tag"><span>&nbsp;&#124;&nbsp;</span>Publication</div>
  </div>
 </header>
 <section class="dynamic-content__section dynamic-content__container">
  <div class="dynamic-content__section-container">
   <div class="dynamic-content__figure-container">
     <div class="button button-blue-background "><a href=https://cdn.who.int/media/docs/default-source/documents/ddi/facilityanalysisguide-immunization.pdf?sfvrsn=3cb62a74_2&amp;download=true target="_blank">Download</a></div>
   </div>
   <div class="dynamic-content__description-container">
    <div class="row">
     <div class="col-md-8">
      <div class="dynamic-content__description">
        <h3>Overview </h3>
<p>Those in the <strong>target audience</strong> will find this useful.</p>
<div>This guidance focuses on use of routine data.</div>
        <div id="dynamic-content__accordion" class="dynamic-content__accordion">
         <p><a href="/publications/m/item/other">A related item that is not the overview</a></p>
        </div>
      </div>
     </div>
     <div class="col-md-4">
      <div class="dynamic-content__details">
        <div class="detail">
         <div class="label">Number of pages</div>
         <div class="value">26</div>
        </div>
        <div class="detail">
         <div class="label">Copyright</div>
                <div class="value">&#169; World Health Organization 2018</div>
        </div>
      </div>
     </div>`;
const URL_ = "https://www.who.int/publications/m/item/analysis-and-use-of-health-facility-data-guidance-for-immunization-programme-managers";

describe("readItemPage", () => {
  const p = readItemPage(PAGE);
  test("heading, subtitle, date and type from the header", () => {
    expect(p).toMatchObject({
      title: "Analysis and use of health facility data: guidance for immunization programme managers",
      subtitle: "Working document",
      date: "1 February 2018",
      type: "Publication",
    });
  });
  test("the Overview keeps <p> and <div> paragraphs, drops inline tags, stops at the related items", () => {
    expect(p.overview).toBe("Those in the target audience will find this useful.\n\nThis guidance focuses on use of routine data.");
    expect(p.overview).not.toContain("related item");
  });
  test("details and the one download", () => {
    expect(p.details).toEqual({ "Number of pages": "26", Copyright: "© World Health Organization 2018" });
    expect(p.downloads).toHaveLength(1);
    expect(fileNameOf(p.downloads[0]!)).toBe("facilityanalysisguide-immunization.pdf");
  });
  test("a page without the heading block is refused, not read loosely", () => {
    expect(() => readItemPage("<html><h1>Something</h1></html>")).toThrow();
  });
});

describe("pageToRecord", () => {
  const rec = pageToRecord(readItemPage(PAGE), URL_, "2026-10-08T00:00:00Z");
  const field = (element: string, qualifier?: string) => rec.fields.find((f) => f.element === element && f.qualifier === qualifier)?.values[0]?.value;
  test("only what the page states, in Dublin Core", () => {
    expect(field("date", "issued")).toBe("2018-02-01");
    expect(field("format", "extent")).toBe("26 p.");
    expect(field("rights")).toBe("© World Health Organization 2018");
    expect(field("identifier", "uri")).toBe(URL_);
    expect(field("title", "alternative")).toBe("Working document");
  });
  test("no publisher is inferred from the copyright line", () => {
    expect(field("publisher")).toBeUndefined();
  });
});

describe("isoDate", () => {
  test("d Month yyyy, and nothing else", () => {
    expect(isoDate("1 December 2025")).toBe("2025-12-01");
    expect(isoDate("December 2025")).toBeUndefined();
    expect(isoDate("1 Decembre 2025")).toBeUndefined();
  });
});

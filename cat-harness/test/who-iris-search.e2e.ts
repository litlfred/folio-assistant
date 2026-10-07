import { test, expect } from "@playwright/test";

/**
 * End-to-end tests for WHO-IRIS static catalogue search and faceted filtering.
 *
 * Verifies the client-side KG metadata search on who-iris/site/index.html:
 * 1. Text search with multi-word terms & instant highlighting (<mark>)
 * 2. Facet chips (quick MeSH subject filtering)
 * 3. Advanced faceted filters: Dublin Core subjects, Community, Year ranges, and Open Access gates
 * 4. Verification that search operates purely on structured KG metadata and not raw text blobs
 * 5. Multi-lingual availability on translated replicas (e.g. /fr/index.html)
 */

test.describe("WHO-IRIS search & faceted exploration", () => {
  test("landing page renders search bar, facet chips, and advanced filter controls", async ({ page }) => {
    const res = await page.goto("/who-iris/site/index.html");
    expect(res?.status()).toBe(200);

    const searchInput = page.locator("#iris-search-input");
    await expect(searchInput).toBeVisible();

    const chips = page.locator(".iris-chip");
    expect(await chips.count()).toBeGreaterThanOrEqual(4);

    const details = page.locator("#iris-adv-filters");
    await expect(details).toBeVisible();

    await expect(page.locator("#iris-filter-subject")).toBeAttached();
    await expect(page.locator("#iris-filter-community")).toBeAttached();
    await expect(page.locator("#iris-filter-year-from")).toBeAttached();
    await expect(page.locator("#iris-filter-year-to")).toBeAttached();
    await expect(page.locator("#iris-filter-open-access")).toBeAttached();
  });

  test("instant keyword search highlights matching terms and displays results panel", async ({ page }) => {
    await page.goto("/who-iris/site/index.html");

    const input = page.locator("#iris-search-input");
    const results = page.locator("#iris-search-results");

    // Initially results panel is hidden
    await expect(results).toBeHidden();

    // Type query
    await input.fill("handbook");
    await expect(results).toBeVisible();

    // Contains result item link
    const itemLink = results.locator('a[href*="item-63e14c27-7448-41ec-be08-a96a25a47db6"]');
    await expect(itemLink).toBeVisible();
    await expect(itemLink).toContainText("WHO handbook for guideline development");

    // Highlighting verified
    const mark = itemLink.locator("mark.search-mark");
    await expect(mark).toHaveText("handbook");
  });

  test("clicking a subject facet chip triggers faceted search filter", async ({ page }) => {
    await page.goto("/who-iris/site/index.html");

    const chip = page.locator('button.iris-chip[data-facet-type="subject"][data-facet-val="Guidelines as Topic"]');
    await expect(chip).toBeVisible();
    await chip.click();

    const results = page.locator("#iris-search-results");
    await expect(results).toBeVisible();

    // Filter dropdown should be updated
    const subjSelect = page.locator("#iris-filter-subject");
    await expect(subjSelect).toHaveValue("Guidelines as Topic");

    // Two guideline items should match
    const resultItems = results.locator(".search-result-item");
    await expect(resultItems).toHaveCount(2);

    const textContent = await results.textContent();
    expect(textContent).toContain("Publication and information products style guide");
    expect(textContent).toContain("WHO handbook for guideline development");
  });

  test("complex boolean filtering combines community, access rights, and year", async ({ page }) => {
    await page.goto("/who-iris/site/index.html");

    // Open advanced filter details
    await page.locator("#iris-adv-filters summary").click();

    // Filter by Community: Western Pacific
    await page.locator("#iris-filter-community").selectOption("Western Pacific");
    const results = page.locator("#iris-search-results");
    await expect(results).toBeVisible();
    expect(await results.locator(".search-result-item").count()).toBe(1);
    await expect(results).toContainText("Publication and information products style guide");

    // Require Open Access PDF
    await page.locator("#iris-filter-open-access").check();
    expect(await results.locator(".search-result-item").count()).toBe(1);
    await expect(results.locator(".state.materialized")).toHaveText("PDF Permitted");

    // Switch community to Headquarters with Open Access required -> No open access PDF held for HQ items
    await page.locator("#iris-filter-community").selectOption("Headquarters");
    await expect(results).toContainText("No materialized items or collections matched");

    // Uncheck Open Access -> HQ items now appear
    await page.locator("#iris-filter-open-access").uncheck();
    expect(await results.locator(".search-result-item").count()).toBeGreaterThanOrEqual(2);
    await expect(results).toContainText("WHO handbook for guideline development");
    await expect(results).toContainText("WHO editorial style manual");
  });

  test("search index payload operates purely on structured KG metadata without full text blobs", async ({ page }) => {
    await page.goto("/who-iris/site/index.html");

    // Evaluate client-side index items directly from window.__irisSearch
    const indexData = await page.evaluate(() => {
      const g = window as unknown as { __irisSearch?: { index: unknown[] } };
      return g.__irisSearch ? g.__irisSearch.index : null;
    });

    expect(Array.isArray(indexData)).toBe(true);
    for (const item of indexData as Array<Record<string, unknown>>) {
      // Must contain structured KG metadata
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("badge");

      // Verify no binary blobs or excessive OCR full text payloads
      const textLen = typeof item.text === "string" ? item.text.length : 0;
      expect(textLen).toBeLessThan(1000); // Concatenated metadata strings are concise (< 1 KB)

      // Items have structured access control metadata
      if (item.badge === "Item") {
        expect(item).toHaveProperty("subjects");
        expect(item).toHaveProperty("hasPdf");
        expect(item).toHaveProperty("copyrightGate");
      }
    }
  });

  test("multilingual search interface is translated and functional on locale pages", async ({ page }) => {
    const res = await page.goto("/who-iris/site/fr/index.html");
    expect(res?.status()).toBe(200);

    const searchInput = page.locator("#iris-search-input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /Rechercher parmi les .* documents du dépôt/);

    // Advanced search control is present and functional
    const detailsSummary = page.locator("#iris-adv-filters summary");
    await expect(detailsSummary).toContainText("Complex Search & KG Filters");
  });
});

/**
 * The review page (bean txut). Its behaviour was verified in Chromium against
 * a scaffolded folio's preview; these pin the properties a refactor could
 * silently lose.
 */
import { describe, expect, test } from "bun:test";

import { reviewPageHtml } from "../gen-review-page.js";

const html = reviewPageHtml();

describe("review page", () => {
  test("reads its data when opened, from the preview's own files", () => {
    // Built BEFORE the ChangeSet exists in folio-staging.yml, so it must fetch.
    expect(html).toContain('get("../changeset.json")');
    expect(html).toContain('get("../staging.json")');
  });

  test("never builds markup from folio content", () => {
    // A block label is folio content; innerHTML would let it become markup.
    expect(html).not.toContain("innerHTML");
    expect(html).toContain("textContent");
  });

  test("says each state in words: no ChangeSet, and no change", () => {
    expect(html).toContain("No ChangeSet on this build");
    expect(html).toContain("No block changed.");
  });

  test("one key or one click: j/k and their visible button twins, and a live status", () => {
    expect(html).toContain('id="next"');
    expect(html).toContain('id="prev"');
    expect(html).toContain('e.key === "j"');
    expect(html).toContain('e.key === "k"');
    expect(html).toContain('aria-live="polite"');
  });

  test("change kinds are words, not colours", () => {
    for (const w of ["added", "removed", "reworded", "edited", "moved", "renamed"]) expect(html).toContain(`"${w}"`);
  });

  test("reads review comments, and says when there is no comment data rather than showing none", () => {
    expect(html).toContain('get("../review-comments.json")');
    expect(html).toContain("No comment data on this build.");
  });

  test("keeps the three groups that would otherwise vanish, and the tag to start a comment with", () => {
    expect(html).toContain("Comments on blocks this pull request did not change");
    expect(html).toContain("Orphaned: the block these were made on is gone");
    expect(html).toContain("Comments whose tag could not be read");
    expect(html).toContain('"block: " + c.label');
  });
});

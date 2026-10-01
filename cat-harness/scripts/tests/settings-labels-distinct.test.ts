import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../../schemas/cat-harness.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const JS = readFileSync(join(ROOT, siteDirFor(ROOT), "assets/js/docs-ui.js"), "utf8");

/**
 * Bean `ob3m` finding 12 — two unrelated controls both called "Settings".
 *
 * The LAUNCHER's is site chrome (theme, language, QR). The GLASS board's is
 * folio state (theme, avatars, opacity). Neither pointed at the other, so a
 * reader met one name for two things and a screen reader read them
 * identically. The owner ruled 2026-10-01: rename the glass one, leave the
 * launcher alone.
 *
 * This asserts the DISTINCTNESS rather than either spelling, because the
 * defect is the collision and not any particular label. A future rename of
 * either one is free; making them the same again is not.
 */
describe("ob3m finding 12 — the two Settings controls do not share a name", () => {
  const launcher = /tileButton\(GEAR_GLYPH,\s*"([^"]+)"/.exec(JS);
  const glass = /chromeTile\("glass-settings",\s*"([^"]+)"/.exec(JS);

  it("both control definitions are still findable", () => {
    // If a refactor moves either call, this test must FAIL rather than quietly
    // stop checking — a regex that matches nothing is not a passing assertion
    // (`dh4f`). The two labels below are meaningless without this.
    expect(launcher, "the launcher's gear tile: tileButton(GEAR_GLYPH, …)").not.toBeNull();
    expect(glass, 'the glass chrome tile: chromeTile("glass-settings", …)').not.toBeNull();
  });

  it("their labels differ", () => {
    expect(launcher![1]).not.toBe(glass![1]);
  });

  it("the glass one names its scope, which its own title already did", () => {
    // The title said "Folio settings — theme, avatars, opacity" while the label
    // said only "Settings"; the rename took the scope from the code itself.
    expect(glass![1]!.toLowerCase()).toMatch(/folio|board/);
  });

  it("the id is untouched — it is the contract the tests and STRIP_DEFAULT key on", () => {
    expect(JS).toContain('chromeTile("glass-settings"');
    expect(JS).toContain('"glass-settings"');
  });
});

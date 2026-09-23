/**
 * THREE states, never two — and a mark is never evidence about the present.
 *
 * The mark exists so that skipping the session-staleness check stops looking
 * like a clean run (`rq8s`). If `never-checked` collapsed into `stale`, or an
 * unparseable timestamp were read as fresh, the record would reproduce the
 * defect it was added for: a consumer that scanned nothing reporting on it as
 * though it had.
 *
 * @module scripts/tests/session-listing-mark
 */
import { describe, expect, test } from "bun:test";

import {
  MARK_FRESH_HOURS,
  SESSION_LISTING_MARK_TAG,
  freshness,
  parseSessionListingMark,
  type SessionListingMark,
} from "../../schemas/session-listing-mark.ts";

const NOW = new Date("2026-09-23T12:00:00Z");
const mark = (checkedAt: string): SessionListingMark => ({
  $schema: SESSION_LISTING_MARK_TAG,
  checkedAt,
  sessionsRead: 100,
  findings: 12,
});

describe("freshness", () => {
  /* ABSENT IS NOT STALE. "Nobody has ever looked here" and "somebody looked, a
   * while ago" are different facts, and only the first means the sweep has no
   * information at all. */
  test("no mark is `never-checked`, not `stale`", () => {
    expect(freshness(undefined, NOW)).toBe("never-checked");
  });

  test("a mark inside the window is fresh, and the boundary is inclusive", () => {
    expect(freshness(mark("2026-09-23T11:00:00Z"), NOW)).toBe("fresh");
    expect(freshness(mark("2026-09-22T12:00:00Z"), NOW)).toBe("fresh");
  });

  test("a mark past the window is stale", () => {
    expect(freshness(mark("2026-09-22T11:59:00Z"), NOW)).toBe("stale");
  });

  /* AN UNREADABLE TIMESTAMP IS NOT FRESH. `Date.parse` returns NaN, and every
   * comparison against NaN is false — so a naive `<=` would have called a
   * corrupt mark fresh forever, which is worse than having no mark. */
  test("an unparseable `checkedAt` is `never-checked`, not fresh", () => {
    expect(freshness(mark("not a date"), NOW)).toBe("never-checked");
  });

  test("the window is 24h, and the constant is what the reader uses", () => {
    expect(MARK_FRESH_HOURS).toBe(24);
    const justOver = new Date(NOW.getTime() - (MARK_FRESH_HOURS * 3_600_000 + 1_000));
    expect(freshness(mark(justOver.toISOString()), NOW)).toBe("stale");
  });
});

describe("the shape", () => {
  test("it parses a real mark", () => {
    expect(parseSessionListingMark(mark("2026-09-23T11:00:00Z")).sessionsRead).toBe(100);
  });

  /* THE FILE DECLARES WHAT IT IS. A directory is a place to look, so a mark
   * without its tag is not a mark — it is whatever else happens to be there. */
  test("it refuses a payload with no `$schema` tag", () => {
    expect(() => parseSessionListingMark({ checkedAt: "2026-09-23T11:00:00Z", sessionsRead: 1, findings: 0 })).toThrow();
  });

  test("`by` is optional — a runner that cannot name itself still leaves a mark", () => {
    expect(parseSessionListingMark(mark("2026-09-23T11:00:00Z")).by).toBeUndefined();
    expect(parseSessionListingMark({ ...mark("2026-09-23T11:00:00Z"), by: "session_x" }).by).toBe("session_x");
  });

  test("the counts must be non-negative integers", () => {
    expect(() => parseSessionListingMark({ ...mark("2026-09-23T11:00:00Z"), findings: -1 })).toThrow();
    expect(() => parseSessionListingMark({ ...mark("2026-09-23T11:00:00Z"), sessionsRead: 1.5 })).toThrow();
  });
});

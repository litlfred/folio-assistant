/**
 * Re-recording a round trip must not rewrite when it happened.
 *
 * These exist because the first re-record — adding a model identifier to a
 * verdict that already existed — stamped the CURRENT repo HEAD onto a review
 * from two hours earlier, naming a merge commit that did not exist when the
 * agents ruled. The timestamp had been preserved and the SHA had not, which is
 * the worse half: a reader uses `reviewed_sha` to place a verdict in the
 * history, and a wrong one is a confident lie where a missing one is a gap.
 */
import { describe, expect, test } from "bun:test";

import { roundTripEntries, type RoundTripPayload } from "./translation-roundtrip.ts";

const base: RoundTripPayload = {
  block: "content/docs/x/b.md",
  locale: "fr",
  backTranslation: "A back-translation.",
  backTranslator: { id: "back-translator" },
  adjudicator: { id: "adjudicator" },
  verdict: "pass",
};

describe("roundTripEntries — provenance is recorded, never invented", () => {
  test("a re-record keeps the original time and HEAD on BOTH entries", () => {
    const e = roundTripEntries(
      { ...base, reviewedAt: "2026-09-18T20:32:46.150Z", reviewedSha: "c3998d16ecf1" },
      { md: "h" },
    );
    expect(e).toHaveLength(2);
    for (const entry of e) {
      expect(entry.reviewed_at).toBe("2026-09-18T20:32:46.150Z");
      expect(entry.reviewed_sha).toBe("c3998d16ecf1");
    }
  });

  test("without them it stamps now, so a first recording is not left blank", () => {
    const e = roundTripEntries(base, { md: "h" });
    expect(Date.parse(e[0]!.reviewed_at)).toBeGreaterThan(Date.now() - 60_000);
    expect(e[0]!.reviewed_sha).toBeDefined();
  });

  test("a model identifier carries the basis for it, beside the model", () => {
    // A subagent's serving model is not observable from the dispatching
    // session. Recording the string alone would be an inference printed as a
    // fact — the move this repo deleted a whole feature for.
    const e = roundTripEntries(
      {
        ...base,
        adjudicator: { id: "adjudicator", model: "some-model", modelSource: "read from get_session" },
      },
      { md: "h" },
    );
    expect(e[0]!.reviewer!.agent_model).toBe("some-model");
    expect(e[0]!.metrics?.model_source).toBe("read from get_session");
  });

  test("no model, no model_source row — and the panel then prints 'not recorded'", () => {
    const e = roundTripEntries(base, { md: "h" });
    expect(e[0]!.reviewer!.agent_model).toBeUndefined();
    expect(e[0]!.metrics?.model_source).toBeUndefined();
  });

  test("the adjudicator rules and the back-translator does not", () => {
    const e = roundTripEntries({ ...base, verdict: "fail", severity: "major" }, { md: "h" });
    expect(e[0]!.result).toBe("fail");
    expect(e[0]!.severity).toBe("major");
    // It produced the intermediate text; it did not rule on anything, and must
    // not read as a second verdict.
    expect(e[1]!.result).toBe("n/a");
    expect(e[1]!.notes).toContain("A back-translation.");
  });
});

/**
 * Wait before a retry, using the ONE backoff the repository has. Bean `06kg`.
 *
 * ## Why this exists at all
 *
 * `cat-harness/skills/folio-core/retry-backoff.md` records an owner rule —
 * *"as rule, use logarithmic fall-off on all errors. core best practice."* —
 * and `src/core/retry.ts` is that rule as code. The skill is explicit that a
 * call site should use it rather than write a loop, because *"a retry policy
 * invented per call site is a policy nobody can change in one place"*.
 *
 * A workflow's `run:` body cannot import TypeScript. So every retry loop in
 * `.github/workflows/` wrote its own, and all four wrote the same wrong one:
 *
 *     sleep $((attempt * 5))        # 5s, 10s — linear, no jitter
 *
 * That is the schedule the skill names as the thundering herd, on the ref it
 * cites as the contended one (`gh-pages`), written by the very sessions it
 * says contend on it — four of them pushing inside ninety minutes on
 * 2026-09-20, bean `bm6d`.
 *
 * Nothing caught it because the rule had an implementation and a test **in
 * TypeScript** and four call sites **in bash** that no check read. `retry.ts`
 * passing said nothing at all about `feature-staging.yml`. That is the `dh4f`
 * shape: a consumer scans nothing and the absence reads as compliance.
 *
 * ## Why a script rather than a shell function
 *
 * A shell function copied into four `run:` bodies is still four
 * implementations, free to drift — which is exactly how six copies of
 * `stripLeanComments` ended up with three of them broken and nothing saying
 * so (bean `bqrg`). This calls {@link waitFor} directly, so the workflows and
 * `withBackoff` compute the same number from the same code, and changing the
 * policy is one edit.
 *
 * The cost is a `bun` start per wait. It is paid inside a loop that is already
 * sleeping seconds, in a job that already runs `bun` (`render-log.ts`) in the
 * same block, so `bun` being absent is not a new failure mode.
 *
 * ## Why it sleeps rather than printing a number
 *
 * `sleep $(bun run cat-harness/scripts/backoff-sleep.ts …)` would pass an EMPTY argument on any
 * failure of this script, and `sleep` with no operand is an error the loop
 * would then take as its own. Sleeping here means a fault is this script's
 * exit code, which the calling loop can see.
 *
 * ## The defaults, and why they are not `retry.ts`'s
 *
 * `waitFor`'s own defaults (1 s base) are tuned for an HTTP call. A rejected
 * push to `gh-pages` is a lost race against another session's whole job, so
 * the base is 5 s — the value the linear version started at, kept so this is a
 * change of SHAPE and not a change of scale. The cap stays `retry.ts`'s 16 s.
 */
import { waitFor } from "../src/core/retry.js";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** 5 s rather than `waitFor`'s 1 s — see the note above. */
export const PUSH_BASE_MS = 5_000;
/** `retry.ts`'s own cap, unchanged. */
export const PUSH_CAP_MS = 16_000;

if (import.meta.main) {
  const raw = flag("attempt");
  const attempt = Number(raw);
  // A bad attempt number must not silently become attempt 1 and a short wait:
  // that is the herd this exists to break, reintroduced by a typo.
  if (!raw || !Number.isInteger(attempt) || attempt < 1) {
    console.error(`backoff-sleep: --attempt must be an integer >= 1 (got ${raw ?? "nothing"})`);
    process.exit(2);
  }
  const baseMs = Number(flag("base-ms") ?? PUSH_BASE_MS);
  const capMs = Number(flag("cap-ms") ?? PUSH_CAP_MS);
  const ms = waitFor(attempt, baseMs, capMs);
  // To stderr, so a caller that ever does want the number on stdout is free to
  // add it without this line becoming part of the contract.
  //
  // The cap is stated as the cap on the IDEAL, because that is what it is:
  // `waitFor` caps `baseMs * 2 ** (attempt - 1)` and THEN multiplies by
  // `[0.5, 1.5)`, so an actual wait runs to 1.5x the cap. Measured here at
  // attempt 5: 22.9 s against a 16 s cap. Writing "capped at 16s" — which
  // this line did first — reads as a promise the number then breaks, and
  // whoever next times a job would take the 22.9 s for a bug in the cap.
  console.error(
    `backoff: attempt ${attempt} — waiting ${(ms / 1000).toFixed(1)}s ` +
      `(doubling from ${baseMs / 1000}s, capped at ${capMs / 1000}s before jitter of [0.5, 1.5))`,
  );
  await new Promise((r) => setTimeout(r, ms));
}

#!/usr/bin/env bun
/**
 * Is it safe to remove one `STAGING/<slug>/` review preview, RIGHT NOW?
 *
 * ```sh
 * bun run cat-harness/scripts/staging-cleanup-preflight.ts --slug claude-health-checks
 * ```
 *
 * ## Why this exists at all
 *
 * Bean `w2g5`, second half. `feature-staging.yml`'s `cleanup` job is the only
 * mechanism that removes a preview, and it is gated
 * `if: github.event.action == 'closed'` on a `pull_request_target` event — so
 * being *findable* as an orphan requires the pull request to be closed
 * already, which means the event has fired, the job has run and the label was
 * absent. Labelling afterwards fires nothing. **The documented remedy was
 * unreachable for every orphan the sweep could ever report.** The fix is a
 * `workflow_dispatch` path, and a dispatch input is a deletion trigger, so it
 * needs guarding at least as carefully as the label it replaces.
 *
 * This is one of those guards, and it is the one that is about the artefact
 * rather than about the caller.
 *
 * ## A dispatch that removes a preview still in use is the same defect, one level out
 *
 * The health sweep runs daily and writes a report; a person reads it, decides,
 * and dispatches. Between the sweep and the dispatch the branch can come back
 * to life — that is exactly the behaviour bean `w2g5` documents, a session
 * reusing one branch across five successive pull requests. A removal that
 * trusted a day-old verdict would reintroduce the bug on a longer timescale
 * and with a worse outcome, because the sweep only *proposes* while this
 * *acts*.
 *
 * So liveness is evaluated again, here, at removal time, through the SAME
 * {@link previewLiveness} the sweep uses. Not a second implementation: two
 * implementations of one judgement are two answers free to diverge, and the
 * one that diverges here deletes somebody's work.
 *
 * ## Three states, and the third one refuses
 *
 * - **exit 0** — every signal was evaluated and every one said no. Removal may
 *   proceed.
 * - **exit 1** — at least one signal says the preview is in use. Refuse.
 * - **exit 2** — a signal could not be evaluated. **Refuse.**
 *
 * The third is the interesting one, and it points the opposite way from the
 * health check that shares its logic. There, "could not determine" means *do
 * not accuse*; here it means *do not delete*. Both err away from removal,
 * which is the only direction that is recoverable:
 * `skills/folio-core/deletion-requires-confirmation.md`.
 *
 * @module scripts/staging-cleanup-preflight
 */
import { previewLiveness, type BranchEvidenceSet, type Probe } from "../test/health/checks.ts";
import { originSlug, probeBranches, probeOpenPrHeads } from "../test/health/probes.ts";

/**
 * What a slug may contain.
 *
 * Exactly the characters `feature-staging.yml`'s own `Determine staging slug`
 * step can produce — `sed 's|[^a-zA-Z0-9._-]|-|g'`. A dispatch input is
 * arbitrary text from a person, and this value reaches `rm -rf` in the
 * workflow, so the shape is checked rather than assumed. `.` and `..` are
 * refused by name: both are spelled entirely out of permitted characters and
 * neither names a preview.
 */
export const SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

export function slugProblem(slug: string): string | undefined {
  if (slug === "") return "the slug is empty.";
  if (!SLUG_PATTERN.test(slug)) {
    return `\`${slug}\` is not a staging slug: the workflow's own sed pipeline can only produce [A-Za-z0-9._-].`;
  }
  if (slug === "." || slug === "..") return `\`${slug}\` is a path, not a preview.`;
  return undefined;
}

export type PreflightVerdict =
  | { decision: "remove" }
  | { decision: "refuse-live"; why: string }
  | { decision: "refuse-unknown"; why: string };

/** The decision, pure, so it can be tested without a network. */
export function preflight(
  slug: string,
  openPrHeads: Probe<string[]>,
  branches: Probe<BranchEvidenceSet>,
  now: Date,
): PreflightVerdict {
  const bad = slugProblem(slug);
  if (bad !== undefined) return { decision: "refuse-unknown", why: bad };
  if (openPrHeads.state === "unknown") {
    return {
      decision: "refuse-unknown",
      why: `the open pull requests could not be listed: ${openPrHeads.reason}`,
    };
  }
  if (branches.state === "unknown") {
    return { decision: "refuse-unknown", why: `the remote branches could not be read: ${branches.reason}` };
  }
  const l = previewLiveness(slug, openPrHeads.value, branches.value, now);
  if (l.undetermined !== undefined) {
    return { decision: "refuse-unknown", why: `a liveness signal could not be evaluated — ${l.undetermined}` };
  }
  if (l.live.length > 0) {
    return { decision: "refuse-live", why: `${l.live.join(" + ")} — ${l.evidence}` };
  }
  return { decision: "remove" };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex((a) => a === "--slug" || a.startsWith("--slug="));
  const slug = idx === -1 ? "" : argv[idx].startsWith("--slug=") ? argv[idx].slice("--slug=".length) : (argv[idx + 1] ?? "");
  if (slug === "") {
    console.error("usage: bun run cat-harness/scripts/staging-cleanup-preflight.ts --slug <staging-slug>");
    process.exit(2);
  }
  const root = new URL("..", import.meta.url).pathname;
  const repo = originSlug(root);
  const openPrHeads = await probeOpenPrHeads(repo);
  const branches = probeBranches({ repoRoot: root, remote: "origin", previewSlugs: [slug] });
  const verdict = preflight(slug, openPrHeads, branches, new Date());

  if (verdict.decision === "remove") {
    console.log(`STAGING/${slug}: no liveness signal fired — no open pull request, no branch carrying unmerged work, no recent commit.`);
    console.log("Removal may proceed. It still needs the person who dispatched it to have said so, which is the confirmation input.");
    process.exit(0);
  }
  if (verdict.decision === "refuse-live") {
    console.error(`REFUSING to remove STAGING/${slug}: it is still in use.`);
    console.error(`  ${verdict.why}`);
    console.error(
      "This is bean `w2g5`: a preview whose pull request is closed is not an abandoned one, and a session that " +
        "reuses a branch across successive pull requests spends much of its life in that gap.",
    );
    process.exit(1);
  }
  console.error(`REFUSING to remove STAGING/${slug}: liveness could not be established.`);
  console.error(`  ${verdict.why}`);
  console.error("Could-not-determine refuses here, the same way it declines to accuse in the health sweep.");
  process.exit(2);
}

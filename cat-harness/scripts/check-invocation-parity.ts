#!/usr/bin/env bun
/**
 * check-invocation-parity.ts — a preview must run the generators the deploy
 * runs, with the same instance arguments.
 *
 * ## The defect, and why the two obvious checks could not find it
 *
 * `3jhq`: `docs-site.yml` ran `kg-export.ts --instance ./bootstrap` and
 * `feature-staging.yml` did not, so a cat-harness graph staged at `$BASE`
 * carried `$BASE/bootstrap.jsonld#skill/…` pointing at a document that
 * build never wrote. Two dangling links on every preview. `blv9`, found by
 * hand for the third time.
 *
 * Two designs were tried and withdrawn (bean `qgpo`):
 *
 * - **Parsing destinations was VACUOUS.** `--out-dir ./_site` read as "writes
 *   everything beneath" yields the empty prefix, so every target matched. It
 *   stayed GREEN when the staging export was removed — the exact defect.
 * - **Executing the workflow lines was UNSAFE.** `lean_ci.yml`'s
 *   `cp -r "$dir"/* _lean_docs/` with `$dir` unset is `cp -r /*`, and it
 *   copied 7.8 GB of the root filesystem into the checkout.
 *
 * This asks a smaller question that needs neither: **does the preview invoke
 * what the deploy invokes?** It verifies SYMMETRY rather than resolution, and
 * says so — see §"What this does not check".
 *
 * ## Deploy and preview are DERIVED, never named here
 *
 * The deploy is the workflow whose graph export passes no `--base-url`: it
 * publishes at the declared `canonicalUrl`. A preview passes one, because a
 * staged copy must name itself rather than claim to be the live document.
 * That is the same fact `check:published-instance-exports` already reports as
 * a stood-in base, and it means neither workflow is written down here — a
 * third site workflow is classified the moment it exists.
 *
 * ## What this does NOT check, stated because a proxy invites the mistake
 *
 * That the documents resolve. Both workflows dropping a generator together
 * passes. The invariant `qgpo` states — every link target is published —
 * needs the generators to declare their outputs, which is bean `dyd3`'s
 * neighbour and a separate build. This is the cheap guard, not the answer.
 *
 * @module scripts/check-invocation-parity
 * @covers none — .github/workflows/ is not a declared graph kind
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOW_DIR = join(REPO_ROOT, ".github", "workflows");

/** A `bun run cat-harness/scripts/<name>.ts` call and the rest of its line. */
const INVOCATION = /cat-harness\/scripts\/([a-z0-9-]+)\.ts([^\n]*)/g;

/**
 * Generators the deploy runs that a preview is not expected to.
 *
 * A LIST, and a short one — two entries, each with the reason it is not a
 * finding. It is the hand-maintained part of this check and therefore the part
 * most likely to rot, so a stale entry is itself reported: an exemption for a
 * generator the deploy no longer runs is a finding, not a silent no-op. That
 * is the `ALLOWED` discipline `tdu3` already established one gate over.
 */
export interface Exemption {
  script: string;
  reason: string;
}
export const EXEMPT: readonly Exemption[] = [
  {
    script: "fsh-guts-export",
    reason:
      "the trashcan, reachable BY NAME and by nothing else — the export strips " +
      "`fsh-guts` from every graph it publishes, so no link target depends on it",
  },
  {
    script: "restore-staging",
    reason: "restores the previews a deploy would otherwise overwrite; a preview has none to restore",
  },
] as const;

export interface Invocation {
  /** The generator's basename, without `.ts`. */
  script: string;
  /** Its `--instance` argument, when it takes one — the flag `3jhq` turned on. */
  instance?: string;
}

export interface PeerVerdict {
  workflow: string;
  /** Deploy invocations this workflow does not make, exemptions removed. */
  missing: Invocation[];
}

export interface ParityReport {
  deploy?: string;
  peers: PeerVerdict[];
  /** Exemptions naming a generator the deploy no longer runs. */
  staleExemptions: string[];
  unreadable?: string;
}

/** A workflow's text with comment lines removed — prose is not an invocation. */
export function withoutComments(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
}

/** Every generator a workflow invokes, with its `--instance` argument. */
export function invocations(workflowText: string): Invocation[] {
  const out = new Map<string, Invocation>();
  const code = withoutComments(workflowText);
  INVOCATION.lastIndex = 0;
  for (const m of code.matchAll(INVOCATION)) {
    const script = m[1]!;
    const rest = m[2] ?? "";
    const inst = /--instance\s+(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(rest);
    const instance = inst ? (inst[1] ?? inst[2] ?? inst[3]) : undefined;
    // Keyed on the PAIR: `kg-export` and `kg-export --instance ./bootstrap`
    // are different obligations, and collapsing them is exactly how `3jhq`
    // hid — staging ran the exporter, just not for the foreign instance.
    const key = `${script}\u0000${instance ?? ""}`;
    if (!out.has(key)) out.set(key, instance === undefined ? { script } : { script, instance });
  }
  return [...out.values()].sort((a, b) =>
    `${a.script}${a.instance ?? ""}`.localeCompare(`${b.script}${b.instance ?? ""}`),
  );
}

/** Does this workflow publish at the canonical base — i.e. is it the deploy? */
export function isDeploy(workflowText: string): boolean {
  const code = withoutComments(workflowText);
  const m = /cat-harness\/scripts\/kg-export\.ts([^\n]*)/.exec(code);
  return m !== null && !/--base-url/.test(m[1] ?? "");
}

export function checkInvocationParity(): ParityReport {
  let files: string[];
  try {
    files = readdirSync(WORKFLOW_DIR)
      .map(String)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort();
  } catch (e) {
    return { peers: [], staleExemptions: [], unreadable: `${WORKFLOW_DIR} could not be listed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const graphWorkflows: Array<{ name: string; text: string }> = [];
  for (const f of files) {
    let text: string;
    try {
      text = readFileSync(join(WORKFLOW_DIR, f), "utf-8");
    } catch {
      continue;
    }
    // Only a workflow that BUILDS A SITE AND EXPORTS THE GRAPH is in this
    // comparison. `discoverability-docs.yml` and `publish.yml` touch `_site`
    // and invoke no generator, so they publish something else and owe nothing
    // here; reporting them would be noise about a question nobody asked.
    if (!/\.\/_site/.test(text)) continue;
    if (!/cat-harness\/scripts\/kg-export\.ts/.test(withoutComments(text))) continue;
    graphWorkflows.push({ name: f, text });
  }

  const deploy = graphWorkflows.find((w) => isDeploy(w.text));
  if (deploy === undefined) {
    return {
      peers: [],
      staleExemptions: [],
      unreadable:
        `none of ${String(graphWorkflows.length)} site workflow(s) exports the graph without ` +
        "`--base-url`, so none publishes at the canonical base and the deploy cannot be identified",
    };
  }

  const wanted = invocations(deploy.text);
  const exemptScripts = new Set(EXEMPT.map((e) => e.script));
  const deployScripts = new Set(wanted.map((i) => i.script));
  // An exemption for something the deploy no longer runs excuses nothing, and
  // an allow-list nobody prunes becomes a blind spot. Reported as a finding in
  // its own right.
  const staleExemptions = [...exemptScripts].filter((s) => !deployScripts.has(s)).sort();

  const peers: PeerVerdict[] = [];
  for (const w of graphWorkflows) {
    if (w.name === deploy.name) continue;
    const have = new Set(invocations(w.text).map((i) => `${i.script}\u0000${i.instance ?? ""}`));
    const missing = wanted.filter(
      (i) => !exemptScripts.has(i.script) && !have.has(`${i.script}\u0000${i.instance ?? ""}`),
    );
    peers.push({ workflow: w.name, missing });
  }
  return { deploy: deploy.name, peers, staleExemptions };
}

export function formatReport(r: ParityReport): string {
  const out: string[] = ["Invocation parity"];
  if (r.unreadable !== undefined) {
    out.push(`  ? COULD NOT DETERMINE — ${r.unreadable}.`);
    out.push("    A comparison with no reference is not a pass.");
    return out.join("\n");
  }
  if (r.peers.length === 0) {
    out.push(`  ? EXAMINED NOTHING — the deploy is \`${r.deploy ?? "?"}\` and no other workflow`);
    out.push("    builds a site and exports the graph. Either the previews are gone, or this");
    out.push("    check stopped recognising them. Both are findings; neither is a pass.");
    return out.join("\n");
  }

  out[0] = `Invocation parity (deploy: ${r.deploy ?? "?"}, ${r.peers.length} preview(s))`;
  let bad = false;
  for (const s of r.staleExemptions) {
    bad = true;
    out.push(`  ✗ EXEMPTION IS STALE: \`${s}\` — the deploy no longer runs it, so the`);
    out.push("      exemption excuses nothing and hides the next one. Remove it.");
  }
  for (const p of r.peers) {
    if (p.missing.length === 0) {
      out.push(`  ✓ ${p.workflow} — runs everything the deploy runs`);
      continue;
    }
    bad = true;
    out.push(`  ✗ ${p.workflow} does not run ${String(p.missing.length)} of the deploy's invocation(s):`);
    for (const m of p.missing) {
      out.push(`      ${m.script}${m.instance === undefined ? "" : ` --instance ${m.instance}`}`);
    }
  }
  if (!bad) {
    out.push(`    ${String(EXEMPT.length)} deploy-only generator(s) exempt, each with its reason:`);
    for (const e of EXEMPT) out.push(`      ${e.script} — ${e.reason}`);
    return out.join("\n");
  }
  out.push("");
  out.push("  A preview that skips one of the deploy's invocations serves a site missing");
  out.push("  whatever it wrote. `3jhq` was exactly this: the exporter ran, but not for the");
  out.push("  foreign instance, so two links 404ed on every preview.");
  out.push("");
  out.push("  If the difference is DELIBERATE, add it to `EXEMPT` with the reason — that is");
  out.push("  the list's purpose, and a stale entry there is reported rather than tolerated.");
  return out.join("\n");
}

if (import.meta.main) {
  const report = checkInvocationParity();
  const clean =
    report.unreadable === undefined &&
    report.peers.length > 0 &&
    report.staleExemptions.length === 0 &&
    report.peers.every((p) => p.missing.length === 0);
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}

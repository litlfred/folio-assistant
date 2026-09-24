/**
 * Check that every declared workflow relaxation is legal.
 *
 * The base processes are strict: `editing-hci-validation`, `draft-to-publication`
 * and `content-lifecycle` refuse a step that is not enabled. A content package
 * may relax a step by naming it in `skills/<package>/workflow-policy.json` with
 * a reason — but not a step the BPMN marks `relaxable="false"`, and not one
 * that does not exist.
 *
 * This runs those checks over the whole repo, so a relaxation that has quietly
 * stopped applying — because the activity was renamed, or because a step became
 * non-relaxable — is a build failure rather than something discovered on the
 * day it was needed.
 *
 * Usage:  bun run check:workflow-policy
 *
 * @covers none — .github/workflows/ is not a declared graph kind
 */
import { resolve } from "node:path";
import { workflowFiles } from "./known-skills.js";
import { loadProcessModel } from "../src/workflow/process-model.js";
import { loadRelaxations, validateRelaxations, PolicyError } from "../src/workflow/gate.js";

const root = resolve(import.meta.dir, "..");
// Every declared knowledge-graph directory. A relaxation is validated
// against the processes it can name, so a process this script cannot see is
// one whose relaxations go unchecked — the policy gate passing because it
// never looked.
const models = await Promise.all(
  workflowFiles(root)
    .filter((f) => f.endsWith(".bpmn"))
    .map((f) => loadProcessModel(f)),
);

console.log("Processes");
for (const m of models) {
  const locked = [...m.nodes.values()].filter((n) => !n.relaxable);
  console.log(
    `  ${m.enforcement === "strict" ? "🔒" : "  "} ${m.id.padEnd(24)} ${m.enforcement}` +
      (locked.length ? `   non-relaxable: ${locked.map((n) => n.id).join(", ")}` : ""),
  );
}

let relaxations;
try {
  relaxations = loadRelaxations(root);
  validateRelaxations(relaxations, models);
} catch (e) {
  console.error(`\n✗ ${e instanceof PolicyError ? e.message : String(e)}\n`);
  process.exit(1);
}

console.log("\nDeclared relaxations");
if (relaxations.length === 0) {
  console.log("  (none — every package takes the base processes as they stand)");
}
for (const r of relaxations) {
  console.log(`  ${r.package} → ${r.process}/${r.activity}\n      ${r.reason}`);
  if (r.scope) console.log(`      scope: ${r.scope}`);
}
console.log(`\n✓ ${relaxations.length} relaxation(s), all legal.\n`);

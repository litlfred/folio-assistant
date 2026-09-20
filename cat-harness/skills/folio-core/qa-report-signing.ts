import type { SkillDefinition } from "../framework/types.js";

export const qaReportSigning: SkillDefinition = {
  id: "qa-report-signing",
  name: "QA report signing",
  description:
    "Attest a QA report's run hashes by one of two routes — an API signer, or a human release authority when the performing actor cannot reach out.",
  requiredCapabilities: [
    // `fallback` with NO `fallbackCapabilityId`, and that is the whole case:
    // there is no second tool on an air-gapped host. The role that takes
    // over is not declared here — `qa-report-signing.bpmn` already carries
    // it, in the only form that routes anything: `Task_HumanSign` is a
    // `userTask` in `Lane_Human`, which binds `publication-manager`.
    // `check:fallback-roles` derives it and fails if it disappears.
    { capabilityId: "signing-api", degradation: "fallback" },
  ],
  dependsOn: [
    { ref: "content-test", kind: "skill", conformance: "SHALL" },
  ],
  routingPatterns: ["sign", "signing", "attest", "attestation", "air-gapped"],
  tags: ["qa", "attestation", "deployment", "topology"],
};

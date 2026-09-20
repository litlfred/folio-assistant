import type { SkillDefinition } from "../framework/types.js";

export const qaReportSigning: SkillDefinition = {
  id: "qa-report-signing",
  name: "QA report signing",
  description:
    "Attest a QA report's run hashes by one of two routes — an API signer, or a human release authority when the performing actor cannot reach out.",
  roles: ["validation-pipeline", "attestation-service", "publication-manager"],
  requiredCapabilities: [
    // The first use of `fallbackRole` (bean `folio-assistant-85e8`): when no
    // capability can sign, a ROLE takes over rather than another tool. A
    // `fallbackCapabilityId` cannot express this — there is no second tool on
    // an air-gapped host, which is the whole case.
    { capabilityId: "signing-api", degradation: "fallback", fallbackRole: "publication-manager" },
  ],
  dependsOn: [
    { ref: "content-test", kind: "skill", conformance: "SHALL" },
  ],
  routingPatterns: ["sign", "signing", "attest", "attestation", "air-gapped"],
  tags: ["qa", "attestation", "deployment", "topology"],
};

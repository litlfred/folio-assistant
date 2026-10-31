---
# folio-assistant-wyez
$schema: bean/1.0.0
title: 'fhir-harness bun.lock: 17 dependency advisories (7 high), node-forge and zod'
status: todo
type: bug
priority: high
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:20:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** major (advisory) · **rule:** scz-review-dependency-changes

**Where:** litlfred/fhir-harness `bun.lock`, from `bun audit` on 2026-10-31.

**Evidence:**
- `node-forge@1.4.0` (via `@aehrc/sdc-populate > fhirclient > isomorphic-webcrypto > expo-random > expo > @expo/cli`): 6 high, incl. RSA PKCS#1 v1.5 signature verification accepting extra DigestAlgorithm elements (GHSA-86w9-cpqp-85rv), X.509 basicConstraints bypass (GHSA-5x38-2vff-x55p), PKCS#12 MAC forgery (GHSA-jc66-7q78-782g), PEM ReDoS (GHSA-7wch-p9px-956x), plus 2 TLS DoS.
- `zod@3.25.76` (same expo chain) < 4.6.6: memory exhaustion on oversized constrained collections (GHSA-mrhx-c7xc-m3w5).
- moderate/low: csv-parse, deepmerge, glob, minimatch and the rest of the 17.

The `expo` chain is a build-time transitive of the SDC populate library and is probably not on any runtime path, which is why this is major rather than critical. That is a guess from the dependency path, not something traced.

## Done when
- [ ] `bun audit` in fhir-harness reports no high or critical, or each remaining one carries a recorded waiver saying why it is not reachable

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

# witness-schema

> *Part of the [QOU library stack](../https://github.com/litlfred/qou/blob/main/docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

Cross-language schema for the QOU witness JSON format. Three artefacts in one package:

| Target | Where | Install |
|---|---|---|
| **JSON Schema** (canonical) | `schema/witness.schema.json` | any language with a JSON Schema validator |
| **Pydantic models** (Python) | `python/witness_schema/` | `pip install witness-schema` |
| **Zod schemas** (TypeScript) | `js/index.ts` | `npm install @litlfred/witness-schema` |

All three describe the same `*.witness.json` shape emitted by [`qou-substrate`](../qou-substrate)'s `WitnessBuilder`. The JSON Schema is the authoritative spec; the Pydantic and Zod schemas are hand-maintained mirrors kept in sync with it.

## Why a standalone package?

The QOU compute pipeline emits 858 `*.witness.json` files. Downstream consumers in **Node.js, R, Kotlin, C, …** can read those files without porting any Python — they just need the schema. This package is what they install. See [workplan v2 §3.6](https://github.com/litlfred/qou/blob/main/docs/workplans/2026-05-24-library-reuse-production-readiness.md#36-where-do-nodejs--kotlin--r--c-come-in) (path B — Layer-4 witness reader).

## Python (Pydantic)

```python
from witness_schema import ComputationWitness

with open("hyperbolic-volumes.witness.json") as f:
    w = ComputationWitness.model_validate_json(f.read())

assert w.allPassed
for a in w.assertions:
    print(a.name, "→", a.computed, "vs", a.expected, "→", a.passed)
```

## TypeScript / Node.js (Zod)

```ts
import { ComputationWitness } from "@litlfred/witness-schema";
import { readFileSync } from "fs";

const raw = JSON.parse(readFileSync("hyperbolic-volumes.witness.json", "utf-8"));
const witness = ComputationWitness.parse(raw);

console.log(witness.engineVersion, witness.commitSha);
for (const a of witness.assertions) {
  console.log(a.name, "→", a.computed, "vs", a.expected, "→", a.passed);
}
```

## R / Kotlin / Swift / C

Use the JSON Schema directly:

- **R**: `jsonvalidate::json_validate(json_str, schema_str)`
- **Kotlin**: `com.networknt.schema.JsonSchemaFactory`
- **Swift**: `JSONSchema` (Ajv-compatible libraries)
- **C**: `json-c-rfc-7159` + a JSON Schema validator

The schema is at [`schema/witness.schema.json`](schema/witness.schema.json) and is also served from the npm package root (`@litlfred/witness-schema/schema`).

## Field reference

| Field | Type | Required | Meaning |
|---|---|---|---|
| `engine` | enum | yes | `snappea` / `sympy` / `mpmath` / `numpy` / `scipy` / `python` / `closed-form` / `python+mpmath` / `python+numpy+cvxpy` |
| `engineVersion` | string | yes | e.g. `"mpmath 1.3.0"` |
| `computedAt` | ISO 8601 | yes | wall-clock UTC at compute time |
| `assertions` | `ComputationAssertion[]` | yes | named numeric/symbolic claims |
| `commitSha` | string | no | git HEAD at compute time (or `"unknown"`) |
| `scriptCommitSha` | string | no | last commit touching the producing script |
| `scriptHash` | string | no | SHA-256 prefix of the script (drift detection) |
| `scriptFile` | string | no | producing-script path |
| `name` | string | no | basename of `<name>.witness.json` |
| `contentBlock` | string | no | self-claim of the block this witness backs |
| `auditOnly` | string | no | path to audit doc when not a content-block witness |
| `durationMs` | number | no | wall-clock script runtime |
| `allPassed` | boolean | no | convenience: every assertion passed |
| `parameters` | object | no | inputs echoed for reproducibility |
| `data` | object | no | free-form outputs |
| `caveats` | string[] | no | known limitations |
| `upstream_witness_hashes` | `UpstreamWitnessHash[]` | no | per-upstream drift records |

The schema sets `additionalProperties: true` — the format is intentionally extensible.

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE) in the parent repository.

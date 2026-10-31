---
name: dsa-odrl-source
description: >
  Bind a computable Data Sharing Agreement's W3C ODRL 2.2 `Agreement` to its
  signed legal text distribution using DCMI Metadata Terms `dcterms:source`,
  naming the exact `dcat:Distribution` whose `spdx:checksum` is checked (DSA
  building block B3, process step P2.3 `Task_OdrlCitesText`).
---

# `dsa-odrl-source` — Make the ODRL Agreement cite the legal text distribution (P2.3)

> Skill id: `dsa-odrl-source` · Package: `folio-document-adapter` · Process:
> `folio-assistant-core/processes/content/dsa-document-lifecycle.bpmn`
> (`Task_OdrlCitesText`, P2.3) · Checker:
> `folio-assistant-core/scripts/check-dsa-hash.ts` (`bun run cat check:dsa-hash`)
> · Bean: `folio-assistant-2z1t`.

When a Data Sharing Agreement carries a computable W3C ODRL 2.2 `Agreement`
beside its signed legal text, the policy must cite the exact versioned legal
text distribution from which its permissions, prohibitions, constraints and
duties were derived.

## Existing specifications only

No custom link property is invented. The citation uses **DCMI Metadata Terms
`dcterms:source`** (`http://purl.org/dc/terms/source`) on the ODRL 2.2
`Agreement` node:

- `@context` includes `"http://www.w3.org/ns/odrl.jsonld"` and binds
  `"dcterms": "http://purl.org/dc/terms/"`.
- `dcterms:source` names the `@id` / `dcat:downloadURL` of the signed legal
  text's `dcat:Distribution` in the version's DCAT 3 record.

## Invariant enforced by `check:dsa-hash`

The ODRL `Agreement`'s `dcterms:source` **must name the same
`dcat:Distribution` whose `spdx:checksum` is checked** against the legal text
bytes:

1. If `dcterms:source` is absent on the `Agreement`, verification fails.
2. If `dcterms:source` names a URL or IRI that does not match the
   `dcat:Distribution` (`@id` or `dcat:downloadURL`) carrying the legal text's
   `spdx:checksum`, verification fails.
3. The `Agreement`'s `uid` is the version's fixed-version URL: the
   `dcat:Resource` `@id` of that version (for example
   `https://example.org/dsa/042/v1`), never a 'latest' URL. It is the URL a
   Consent cites in `Consent.policy.uri` (consent rule 2 in
   `dsa-document-lifecycle.bpmn`), and the DCAT record's `odrl:hasPolicy`
   names it. `check:dsa-hash` fails when either differs.
4. When the agreement is amended (`v2`), the new ODRL `Agreement` must update
   `uid` to the new fixed-version URL and `dcterms:source` to name the new
   version's legal text distribution.

## Example (`agreement.jsonld`)

```json
{
  "@context": [
    "http://www.w3.org/ns/odrl.jsonld",
    {
      "odrl": "http://www.w3.org/ns/odrl/2/",
      "dcterms": "http://purl.org/dc/terms/"
    }
  ],
  "@type": "Agreement",
  "uid": "https://example.org/dsa/042/v1",
  "assigner": "https://example.org/org/fnphi",
  "assignee": "https://example.org/org/frec",
  "dcterms:source": "https://example.org/dsa/042/v1/agreement.md",
  "permission": [
    {
      "assignee": "https://example.org/org/frec",
      "action": "odrl:use",
      "target": "https://example.org/datasets/respiratory-surveillance-2026",
      "constraint": [
        {
          "leftOperand": "odrl:purpose",
          "operator": "odrl:isA",
          "rightOperand": "PUBHLTH"
        }
      ],
      "duty": [
        {
          "action": "odrl:delete",
          "target": "https://example.org/datasets/respiratory-surveillance-2026"
        }
      ]
    }
  ]
}
```

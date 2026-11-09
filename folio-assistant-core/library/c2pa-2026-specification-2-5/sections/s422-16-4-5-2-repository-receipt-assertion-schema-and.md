---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s422-16-4-5-2-repository-receipt-assertion-schema-and
section_title: "16.4.5.2. Repository Receipt Assertion Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7976-8085
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.5.2. Repository Receipt Assertion Schema and Example

The JSON schema for the repository receipt assertion payload is defined in the following:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://c2pa.org/schemas/repository-receipt.json",
  "title": "C2PA Repository Receipt",
  "description": "Receipt showing that a C2PA Manifest Store was ingested by a repository and associated with an external proof of ingestion.",
  "type": "object",
  "additionalProperties": false,

  "properties": {
    "@context": {
      "type": ["object", "string"],
      "description": "JSON-LD context for the repository receipt assertion."
    },
    "@type": {
      "type": "string",
      "const": "org.c2pa.repository-receipt"
    },
    "repository": {
      "$ref": "#/$defs/repository"
    },
    "anchor": {
      "$ref": "#/$defs/anchor"
    }
  },

  "required": [
    "@context",
    "@type",
    "repository",
    "anchor"
  ],

  "$defs": {
    "repository": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "uri": {
          "type": "string",
          "format": "uri",
          "description": "Base URI of the Manifest Repository issuing the repository receipt."
        },
        "manifestId": {
          "type": "string",
          "description": "Identifier of the active manifest of the C2PA Manifest Store that was ingested canonical to this repository (for example, a manifest URN)."
        }
      },
      "required": ["uri", "manifestId"]
    },

    "anchor": {
      "type": "object",
      "description": "Information describing a repository-specific proof that the Manifest Store was ingested and where that proof may be verified or retrieved.",
      "additionalProperties": true,
      "properties": {
        "uri": {
          "type": "string",
          "format": "uri",
          "description": "URI where the C2PA Manifest Store ingestion may be verified or retrieved."
        },
        "parameters": {
          "type": "object",
          "description": "Optional repository-specific key/value parameters used when accessing the anchor URI.",
          "additionalProperties": true
        },
        "proof": {
          "type": "object",
          "additionalProperties": true,
          "description": "Repository-specific JSON object used to demonstrate proof that the Manifest Store was ingested."
        }
      },
      "required": ["uri", "proof"]
    }
  }
}
```

An example of a repository receipt JSON object is provided in the following:

```json
{
  "@context": {
    "c2pa": "https://c2pa.org/ns/",
    "receipt": "https://c2pa.org/ns/repository-receipt#",
    "@vocab": "https://c2pa.org/ns/repository-receipt#"
  },
  "@type": "org.c2pa.repository-receipt",
  "repository": {
    "uri": "https://example.fabrikam.com",
    "manifestId": "urn:c2pa:manifest:sha256:96f9c4b2d8d95dfc2ac7d93ab9d8c72f4f3c8b12e1a6c7ad2e0cc9123456789a"
  },
  "anchor": {
    "uri": "https://example.fabrikam.com/anchors/7f3d91",
    "parameters": {
      "view": "verification"
    },
    "proof": {
      "alg": "ES256",
      "value": "BASE64URL_PROOF_VALUE"
    }
  }
}
```

<a id="ingredient_assertion"></a>

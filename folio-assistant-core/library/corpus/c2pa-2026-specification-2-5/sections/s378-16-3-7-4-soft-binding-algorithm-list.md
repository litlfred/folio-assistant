---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s378-16-3-7-4-soft-binding-algorithm-list
section_title: "16.3.7.4. Soft Binding Algorithm List"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6352-6562
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.7.4. Soft Binding Algorithm List

The soft binding algorithm list is a machine readable list of recommended values for the `alg` field. The value of the `alg` field should correspond to the `alg` field of an algorithm present in that list. The format of `alg-params` and `value` fields are algorithm specific and described via a human readable information page referenced by `informationalUrl` within the entry for `alg` in the list.

The list is maintained as a JSON document by the C2PA at the following location: [https://sbal.c2pa.org](https://sbal.c2pa.org)

Entries in the soft binding algorithm list that have a `deprecated` field of `true` shall be considered deprecated and shall not be used to create soft binding assertions in manifests. Soft binding algorithms marked deprecated may be used for resolving soft bindings but this behaviour is discouraged.

The JSON schema for entries within the soft binding algorithm list is shown below:

```none
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html",
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "identifier": {
                "type": "integer",
                "minimum": 0,
                "maximum": 65535,
                "description": "This identifier will be assigned when the soft binding algorithm is added to the list."
            },
            "deprecated": {
                "type": "boolean",
                "default": false,
                "description": "Indicates whether this soft binding algorithm is deprecated. Deprecated algorithms shall not be used for creating soft bindings.  Deprecated algorithms may be used for resolving soft bindings but this behaviour is discouraged."
            },
            "alg": {
                "type": "string",
                "pattern": "^[A-Za-z]{2,63}(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+\\.?$",
                "description": "Entity-specific namespace as specified for C2PA Assertions labels that shall begin with the Internet domain name for the entity similar to how Java packages are defined (e.g., `com.example.algo1`, `net.example.algos.algo2`)"
            },
            "type": {
                "enum": [
                    "watermark",
                    "fingerprint"
                ],
                "description": "Type of soft binding implemented by this algorithm."
            },
            "decodedMediaTypes": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "enum": [
                        "application",
                        "audio",
                        "image",
                        "model",
                        "text",
                        "video"
                    ],
                    "description": "IANA top level media type (rendered) for which this soft binding algorithm applies."
                }
            },
            "encodedMediaTypes": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "string",
                    "description": "IANA media type for which this soft binding algorithm applies, e.g., application/pdf",
                    "pattern": "^([a-zA-Z0-9\\-]+\\/[a-zA-Z0-9\\-\\+]+(?:\\.[a-zA-Z0-9\\-\\+]+)*)$"
                }
            },
            "entryMetadata": {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": "Human readable description of the algorithm."
                    },
                    "categories": {
                        "type": "array",
                        "description": "This allows specifying values that can be used to cluster this algorithm with others of the same or similar values. For example an algorithm that is used in a certain context (e.g., verified news, advertising). The format of these categories follows the entity-specific namespace as specified for C2PA Assertions labels that shall begin with the (reversed) Internet domain name for the entity similar to how Java packages are defined (e.g., `org.iptc.watermarking`, `net.example.cluster.context1`)",
                        "items": {
                            "type": "string",
                            "pattern": "^[A-Za-z]{2,63}(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+\\.?$"
                        }
                    },
                    "dateEntered": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Date of entry for this algorithm."
                    },
                    "contact": {
                        "type": "string",
                        "format": "email"
                    },
                    "informationalUrl": {
                        "type": "string",
                        "format": "uri",
                        "description": "A web page containing more details about the algorithm."
                    }
                },
                "required": [
                    "description",
                    "dateEntered",
                    "contact",
                    "informationalUrl"
                ]
            },
            "softBindingResolutionApis": {
                "type": "array",
                "items": {
                    "type": "string",
                    "format": "uri"
                },
                "description": "A list of Soft Binding Resolution APIs supporting this algorithm."
            }
        },
        "required": [
            "identifier",
            "alg",
            "type",
            "entryMetadata"
        ],
        "oneOf": [
            {
                "required": [
                    "decodedMediaTypes"
                ],
                "not": {
                    "required": [
                        "encodedMediaTypes"
                    ]
                }
            },
            {
                "required": [
                    "encodedMediaTypes"
                ],
                "not": {
                    "required": [
                        "decodedMediaTypes"
                    ]
                }
            }
        ]
    }
}
```

A JSON example of an entry in the soft binding algorithm list is shown below:

```none
[
    {
        "identifier": 1,
        "deprecated": false,
        "alg": "com.example.product",
        "type": "watermark",
        "decodedMediaTypes": [
            "audio",
            "video",
            "text",
            "image"
        ],
        "entryMetadata": {
            "description": "Foo Inc.'s watermarking algorithm version 1.2",
            "categories": [
                "com.example.category.certified.news",
                "com.example.category.pro.photographers"
            ],
            "dateEntered": "2024-04-23T18:25:43.511Z",
            "contact": "foo.bar@example.com",
            "informationalUrl": "https://example.com/wmdetails"
        },
        "softBindingResolutionApis": [
            "https://resolver.example.com/endpoint",
            "eip155:1:0xd4d871419714b778ebec2e22c7c53572b12341234"
        ]
    },
    {
        "identifier": 2,
        "deprecated": false,
        "alg": "com.example.product2",
        "type": "fingerprint",
        "decodedMediaTypes": [
            "image"
        ],
        "entryMetadata": {
            "description": "Bar Inc.'s fingerprinting algorithm version 1.3",
            "categories": [
                "com.example.category.certified.gov.news",
                "com.example.category.art.algorithms"
            ],
            "dateEntered": "2025-04-23T18:25:43.511Z",
            "contact": "bar.food@example.com",
            "informationalUrl": "https://example.com/fpdetails"
        },
        "softBindingResolutionApis": [
            "https://resolver2.example.com/endpoint"
        ]
    }
]
```

The unique name of the algorithm is given in the `alg` field, and corresponds to the string that shall be used in the `alg` field a soft binding assertion that uses that algorithm. The name shall follow the [namespacing](#_namespacing) requirements and represent the owner of the algorithm. A unique numeric identifier is also assigned for each algorithm. If different versions of an algorithm are provided, then each shall have a separate entry in the Soft Binding Algorithm List.

The type of the algorithm shall be either 'watermark' or 'fingerprint' to represent that the algorithm is an invisible watermark, or a fingerprint.

The deprecation status of the algorithm is given in the `deprecated` field. A validator should not resolve any soft bindings that use deprecated algorithms. C2PA Manifests shall not be written using deprecated soft bindings.

The soft binding algorithm list entry shall contain a list of supported media types either as `encodedMediaTypes` or as `decodedMediaTypes`. The supported media types for `decodedMediaTypes` shall correspond to one or more of the top-level IANA media types: "application", "audio", "image", "model", "text", "video". The supported media types for `encodedMediaTypes` shall correspond to one or more of the registered IANA subtypes of a `decodedMediaType` listed in the preceding sentence. These IANA top-level types and subtypes are listed at [https://www.iana.org/assignments/media-types/media-types.xhtml](https://www.iana.org/assignments/media-types/media-types.xhtml)

Additional information shall accompany each entry in the soft binding algorithm list, within the `entryMetadata` field. These are a human readable description of the algorithm (`description`), and the date it was proposed for entry into the soft binding algorithm list (`dateEntered`).

The contact details of the owner of the entry shall be provided as an email address (`contact`, required). An informational URL (`informationalUrl`, required) shall be provided that references a human readable page describing characteristics of the soft binding algorithm. The information at that page is unconstrained but might include details such as how to interpret the `value` field in the soft binding registry, which is encoded in an algorithm specific form.

<a id="_soft_binding_resolution_api"></a>

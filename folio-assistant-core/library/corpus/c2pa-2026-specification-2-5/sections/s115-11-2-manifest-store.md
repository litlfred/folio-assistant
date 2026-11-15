---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s115-11-2-manifest-store
section_title: "11.2. Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1551-1563
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.2. Manifest Store

A C2PA Manifest Store contains one or more C2PA Manifests, the last of which is designated the [active manifest](#_active_manifest).

The C2PA Manifest Store is a JUMBF (ISO 19566-5:2023) superbox. See [Section 11.5, “Serialization”](#_serialization) for more details.

[Figure 8, “C2PA Manifest Store”](#example_manifest_store) is an example C2PA Manifest Store with a single C2PA Manifest:

![C2PA Manifest Store](https://kroki.io/plantuml/svg/eNqdlE9v1DAQxc_Jpxh6YOmhK1E4VVWldtsiVS1bNYILQuysM5uY9Z_IdhZWqN8d20maAEkF5JBVPPN-8_w2cQr-mgEKob9ZkPw7VwXs0HBdW9Drr8ScBa4AwfqKIMg5FgZlGnRR9aURpWlDciW34GqjvHyz8Y8EWDst0XEGhdF1FSas9zCbzxqwQklRbMnFB1sho4wqNOi0AaUVdfSS5xSZttJuuIZqDyQrtw8GVGHn83maDPsdGdJuX1E_LxYZN0wMnhuIJLkmY9MkrvXizod1exE2HW1vuQpeJeS0wVq4a63cez8EMl0b5n_Qh3FvdJr0rUzLyu9LucyTCIzPGUO-kSho48BpMLwonU88VLlW6S8ANPnpKTuu8OwMfkRZstYmJ7PQwqd2X5vK45JkjWwbcld5U7jFHSnfliaPo0A5AXxniNQYL5hsi-PEHZsgapGPAUlqtSj5ZqMnkFPASzTbj1wLcs_s-0LUtpyyinac7EU0tfemNsb7H9pij5NBMjHOe6B8CnfP1XYSN2FvafyrSOPQO80Y-qOgYc7gsjkOXkRKAEN4JQEtHNyh4huyDjL_FRMcwc2Hu4treLUKHavDAxi8vknSauVv2tAtcQUnsPJnyslQKjtpp2U2ahcCuYSMFwr9OUQRwWxEBPncdpUO1ObgQcnTdwiLDD7FpeT05Zb2Z7BYZld-uwV3KHp6bPkc7iGP3ooYWIkGRG-AhdX57nh1CBNX60uM-eptMZ2T93WxfJhwgU0g59aSCQdI-08EPzgIBLu67RLBPpGIOoh9khzm6DDaG7QM3J2_7uw9-bvJlu-Pbi-b1eixNTlEu7KWa4VcNOEMc5gYdDwYxCUWftKVP7PznHK45oKen4fxQLUwfT0z-s0fe3z6DyYHlmjLeQzv3-e9_Yt57e0xfoeP6U-frUV1?id=example_manifest_store)

Figure 8. C2PA Manifest Store

<a id="_types_of_manifests"></a>

---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s120-11-4-ingredient-storage
section_title: "11.4. Ingredient Storage"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1607-1618
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.4. Ingredient Storage

When a C2PA Manifest includes [ingredient assertions](#ingredient_assertion), and an ingredient contains a C2PA Manifest Store, the C2PA Manifests it contains are normally included in the C2PA Manifest Store of the new asset to ensure that the provenance data is kept intact, as described in [Section 10.3.2.2, “Adding Ingredients”](#_adding_ingredients).

![C2PA Manifest Store With an Ingredient](https://kroki.io/plantuml/svg/eNqdlclu2zAQhs_SU0xzqJNDDDTtKQgCeGmKBtkQozuKekyNZNYUKZC0W6Pwu5ekLEtOJaMtDzbE4Xzz8-cWg2s9QCHUDwM5_8llBivUXC0NqNl3YtYAl4BgXEQQJBwzjXns80LWtzIpjkuSnXMDdqmlS09T90mAS6tytJxBptWy8BVma-j1eyVYYk4h2ZANH6ZARhMqUKNVGqSSVNHnPKHANIWyzT6Ua6C8sGsvQGam3-_HUXO8JU3Krguq64Ug45qJxncJySmfkTZxFPrq5EqHsWvhJx1kL7j0WnNIKMWlsFdK2jtXBCZqqZn7Q2fGg1ZxVA9lKi_cvKSdOBKBdj6j9zcQBaUWrALNs7l1jvsoVzLeA6BOLi7YWYGXl_ArpEUzpRPSIyWcaw9LXThcFM2QLbzvMikDN7gi6YbF0aYVmHcA32gi2cbzIrfBduKKdRCVSNqAlCs5mvM0VR3ILuAY9eI9V4LsgXkPxdLMu6SiaSe7JOqaexlr4_0PbbTGTiOZaOc9UtKFe-By0YnrkHev3VakduitYgzdVVAyezAur4NngeLB4LckoIGjW5Q8JWNh4k4xwSlcv7sdXsHx1I-YnhzBk-27I3C_CQMCdu2tzDQl3B0Y2HGPp-6aOfeM88FwNJ6eVINLdL6PbuKZCfiRQJ7DhGcS3Y1FZVrDlapt2iFiT2MJ21PQWK_DKCz1DIwh7U96aVkJwUN6NvG-dTvnBu7GWFGrVx8-fvpc2b_1KIqibXq7M2HRmJnCOYTV65sqUoG2rjlQtLvLYDSBL6Eruni-oPUljO4nr92WybhFUdPDkK_-1--pWopoSAkCRC2A-d7-6qxe9Kdtbwme6KplMZWQ0zW8f-xQ0b40QQ82DMEqbipHsHYkoI7CuJwsJmgxyGsMaagbvKjk7fRdT-7vTm_GZW_QuBXZRPP6iDQs6Khx9keNnQdR9Eipe_Cke7rcI4QSGuR8u6EOS8HwXhnobgekvTwgravgHM28H3z993qv_qJe-Nk_fpv4NwkjnEs=)

Figure 9. C2PA Manifest Store With an Ingredient

> **NOTE:**
> C2PA previously supported a Data Box Store (`c2pa.databoxes`). See [Section H.4, “Data Box Store”](#_data_box_store) in [Appendix H, _Deprecated Constructs_](#deprecated_constructs_annex) for historical information.

<a id="_serialization"></a>

---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s066-7-entity-diagram
section_title: "7\\. Entity Diagram"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 786-798
source_sha256: ff401df19d1fde8c
granularity: heading
---
## 7\. Entity Diagram

[Figure 4, “C2PA Entity Diagram”](#entity-diagram) provides a look at how all of the pieces of the C2PA system integrate and relate to each other.

![C2PA Entity Diagram](https://kroki.io/plantuml/svg/eNqlVEtvEzEQPmd_xSg9REJKV3DgsKBKtAXEAZBobghFznqSjOq1V7bTElD_O2Pvw7tJaJCItIo9j2--eXiyGXz5unhfAGpPfg_kQGgQioSDtbFQKuFc9tb5vcKrLN5uSWysqOB3Bo06nsJvBsJ7S6udxwAjoUK_NdJ16g9G-xujGHaldthJr0V5v7Fmp2Wj26NS5jHrMZsYWlSdxxaFRNtHBQi4d_QL4eXrXjYI9kBGoR9bh3xgZZRsxU9Z-J6yt3mbajZRuEEts8nkBbxTCiwq4clot6Was7MIjvRmp4SFnVbIFI3fon0kx5oaS1oTNt4fLaIGRZqrYrG26LjYgNUKpUSZl8xHkHbR9poLc2TK93uULFijRV1iY7rAnx5IQ56T54aVLs-54EIzkToQFQpQYcUAbM-ZtPlkkxlsSSIwWyZqfC8Qes-sap4Cv-XU3OXlZTaJmpJsqbC9NCZV4G9dhBMPhiTU1qw4noNH8lsG2yjmXFrzyJOEGMK4e9K1CLMTMvT7GsFYnpAs8Ivj98459PD9-8VShNOPH9zlyeSGK8QGfJpB4MR_n9ELKbzgS5R8FprW6LixxjLRpxGiDeXoUeOtRb4dQOR5B5rnQ4Rr0pLLEf3Lhsly1cgalGT6SW8sSgo94_czHVx7GtOAQ73iiNEnzc-uipOWiN22pLr7YrurVlqQGgq7EjTse043SlDVkA-nNkzPxyWAbyhFGWUJNnrf0UYLvxsXdqyJ-TahellMNQadu042l7gmTYOEF3bnPE_KTeCzplJ4HCTaKhdU4Z0XVX2Q3KjtkUMngSiaNom_qsWyahVLFxRdGTjfB-x8UtzUuU7nxkPRhznCPyxwO5GDcp6v7XH4v8UZ1KJvX7S13W1p1mnI3JFXiM_LlF1cPB01KNjGZ1kU42rP53N5BQcPL0uJF0UY22B2NXwYF2H3v_G8vIpwggIqsU-7jaN1Dy56tqHbFXDCe7gVZ3DKt3vWzztn4x1SFOPZgADYXy42Yac3UPHIWGmPHwCdGKaINuVW7qenmv0sfMJnjqMpG6KmvfdvXE9iddX8D4ijJE-ChRFoAYd4zUKJvWxfzoEu7Z9klF5UNklh0_TCeCBT0c8OZoQfZOmaqMcVf2bOoIdJ63ZYqPSKz_HpcM4X4tzgtzvgRAX_AARdUe8=?id=entity-diagram)

Figure 4. C2PA Entity Diagram

An [asset](#_asset) embeds a [C2PA Manifest Store](#_c2pa_manifest_store) which holds one or more [C2PA Manifests](#_c2pa_manifest); the last of these is the [active manifest](#_active_manifest), whose [content bindings](#_content_binding) are validated against the asset’s digital content. Within each manifest, the [assertion store](#assertion-store-arch) collects the [assertions](#_assertion) (including any [ingredient assertions](#ingredient_assertion) and the [content binding](#_content_binding)); the [claim](#_claim) references those assertions by URI and is cryptographically signed by the [claim signature](#claim-signature-definition). Green lines denote containment (one component is structurally embedded within another); blue lines denote logical references between components.

For the full structural description of each component see [Manifests](#_manifests), [Assertions](#_assertions), [Claims](#_claims), and [Binding to Content](#_binding_to_content).

<a id="_assertions"></a>

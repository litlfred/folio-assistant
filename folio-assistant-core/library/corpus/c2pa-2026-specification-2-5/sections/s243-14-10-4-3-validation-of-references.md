---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s243-14-10-4-3-validation-of-references
section_title: "14.10.4.3. Validation of References"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3390-3400
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.4.3. Validation of References

Some C2PA standard assertions support referencing other boxes in the C2PA Manifest via the use of a `hashed_uri` and `hashed_ext_uri`. For example, there can be various references in [actions](#_actions), [ingredient](#ingredient_assertion), [linked resource integrity](#linked_resource_integrity_assertion), and [thumbnail](#thumbnail_assertion) assertions.

For all `hashed_uri` and `hashed_ext_uri` fields in standard assertions, except for the `activeManifest` field in `c2pa.ingredient.v3` (for which special validation behaviour is specified in [Section 14.11.3, “Ingredient Assertion Validation”](#_ingredient_assertion_validation)) and the entries of the `externalResources` array in `c2pa.linked-resource-integrity` (for which special validation behaviour is specified in [Section 14.10.4.2.3, “`c2pa.linked-resource-integrity` validation”](#_c2pa_linked_resource_integrity_validation)), the validator shall perform the following validation: . For a `hashed_ext_uri` whose resource the validator chooses to retrieve, the validator shall perform the steps described in [Section 14.10.5.2, “Validation of External References”](#_validation_of_external_references). . For a `hashed_uri`, the validator shall perform the steps described below.

The destination of a `hashed_uri` is found in its `url` field. If the field is not present or the destination cannot be located (i.e., that data isn’t present where it is supposed to be) then it shall be treated as a validation failure with code `hashedURI.missing`.

If the destination can be located, then proceed as follows: . Follow the procedure in [Section 14.4, “Determining the hashing algorithm”](#_determining_the_hashing_algorithm) to determine the hash algorithm and any possible failure codes. . Ensure that the `hash` field is present in the `hashed_uri` structure. If it is not, the claim shall be rejected with a failure code of `hashedURI.mismatch`. . Compute the hash of the assertion using the determined hash algorithm and the procedure described in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes). . Compare the computed hash value with the value in the `hash` field. If they do not match, the claim shall be rejected with a failure code of `hashedURI.mismatch`.

<a id="_external_data_validation"></a>

---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s637-a-8-5-2-claim-generator-procedure
section_title: "A.8.5.2. Claim Generator Procedure"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12193-12220
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.5.2. Claim Generator Procedure

A claim generator embedding a `C2PATextManifestWrapper` should use the following procedure to produce a deterministic exclusion length:

1.  Build the C2PA Manifest Store with `exclusion_length` set to 0 (placeholder).
    
2.  Compute `E = 3 + (HEADER_SIZE + M) * 4 + 6`, where _M_ is the manifest byte count and `HEADER_SIZE` is 13.
    
3.  Rebuild the Manifest Store with `exclusion_length = E` in the `c2pa.hash.data` assertion.
    
4.  If the manifest byte count changed (due to CBOR integer width change), recompute `E` and repeat step 3. This converges in at most 2 iterations.
    
    > **NOTE:**
    > The CBOR encoding of `exclusion_length` can only change width once (e.g., from a 1-byte to a 2-byte CBOR integer), so the second pass always produces a stable manifest byte count.
    
5.  Encode the wrapper using the standard byte-to-Variation-Selector conversion.
    
6.  Compute the actual wrapper byte length `E_actual`.
    
7.  Compute the padding gap `G = E - E_actual`. Append `(G - 4 * (G mod 3)) / 3` bytes of value `0x00` followed by `(G mod 3)` bytes of value `0x10` after the JUMBF container. Encode all padding bytes using the standard byte-to-Variation-Selector conversion.
    
    > **NOTE:**
    > The decomposition `3a + 4b = G` where `b = G mod 3` and `a = (G - 4b) / 3` yields non-negative integers because the +6 margin ensures `G >= 6` for all valid manifests. Fixing the padding byte values and their order ensures that compliant generators produce byte-identical wrappers for the same manifest.
    

Refer to [Section 14.12.1.3.1, “Validating a text data hash”](#validating_a_text_data_hash) for normative validator requirements regarding padding.

<a id="_validation_requirements"></a>

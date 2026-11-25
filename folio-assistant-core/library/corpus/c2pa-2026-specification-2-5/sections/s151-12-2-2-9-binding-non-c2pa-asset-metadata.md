---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s151-12-2-2-9-binding-non-c2pa-asset-metadata
section_title: "12.2.2.9. Binding Non-C2PA Asset Metadata"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1937-1946
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.9. Binding Non-C2PA Asset Metadata

One of the capabilities of a hard binding is that it can exclude parts of an asset, for various reasons. However, a Claim Generator should, where possible, include asset metadata (i.e., metadata outside a C2PA Manifest such as EXIF or XMP) in the hard binding, in order to protect its integrity throughout the asset’s lifecycle.

> **NOTE:**
> Only signed C2PA created\_assertions are attributed to the signer. Any asset metadata outside of this specific mechanism, whether included in hard bindings or not, is not attributed to the signer by this specification. For example, the signer is not responsible for the accuracy of a GPS location appearing in EXIF metadata, even if that metadata is covered by the hard binding. However, if the GPS EXIF metadata are serialized in a `c2pa.metadata` assertion that is included in `created_assertions`, that is an explicit signal from the signer that it is asserting the GPS location associated with the asset.

Any asset metadata values that are supported by the [common metadata assertion](#_metadata), as described in [Appendix C, _Implementation Details for `c2pa.metadata`_](#metadata_annex), and can be asserted by the signer, should be copied into such an assertion and included in the C2PA Manifest.

<a id="_soft_bindings"></a>

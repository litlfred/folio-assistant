---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s611-a-6-2-2-hashing-the-zip-central-directory
section_title: "A.6.2.2. Hashing the ZIP Central Directory"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11828-11878
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.6.2.2. Hashing the ZIP Central Directory

As described in 4.3.12 of the ZIP AppNote, the Central Directory is an array of central directory headers - one per entry in the ZIP archive. It is stored at the end of the ZIP archive and used to locate the entries in the ZIP archive and necessary information/metadata about them. It is immediately followed by the End of Central Directory record (ZIP AppNote, 4.3.16), which contains information about the ZIP archive itself.

In order to prevent tampering with the ZIP Central Directory, such as adding new entries or modifying information about the existing entries, each "central directory header" in the ZIP Central Directory as well as the "end of central directory record" shall be hashed. The hash is computed using the hash algorithm specified in the `alg` field of the [collection data hash](#_collection_data_hash) structure. The hash shall be computed by sequentially processing each "central directory header" in its entirety, except for the one that contains the C2PA Manifest Store file, where its `crc-32` field shall be skipped. Following the processing of the "central directory headers", the hash shall also include the entire "end of central directory record".

> **NOTE:**
> We cannot compute and set a valid CRC32 for the manifest without hashing it, but that can’t happen until it is complete, which can’t happen until the collection data hash has been computed.

The resultant hash value shall be stored in the `zip_central_directory_hash` field of the [collection data hash](#_collection_data_hash) structure.

> **NOTE:**
> Using a specially named file in the list of files was considered, but was not accepted because of the two-pass scenario described below.

The schema for the `collection-data-hash-map` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.5, “Collection Data Hash”](#cddl_annex_collection_data_hash) for the complete normative schema):

```cddl
; An array of URIs and their associated hashes
$collection-data-hash-map /= {
  "uris": [1* $uri-hashed-data-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash on each entry of the `uris` array, taken from the C2PA hash algorithm
  ; identifier list.
  "alg": tstr .size (1..max-tstr-length),
  ? "zip_central_directory_hash" : bstr,
}

; URN-based record identifiers for container formats whose members are named by
; URN rather than by path (e.g., WARC-Record-ID in WARC files), per RFC 8141.
relative-url-type  /= tstr .regexp "urn:[a-zA-Z0-9][a-zA-Z0-9-]{0,30}[a-zA-Z0-9]:[a-zA-Z0-9()+,\\-./:=@;$_!*'&~%#]+"
```

Because the ZIP file needs to be completed prior to the completion of the C2PA Manifest, a two pass approach (as described for JPEG 1, BMFF and PDF) shall be used. The first pass creates a ZIP file with a zero-filled `content_credential.c2pa` file, and computes the hash of the ZIP Central Directory. The second pass completes the C2PA Manifest including filling the value of the `zip_central_directory_hash` field.

One possible implementation of this two-pass approach would be:

*   create a ZIP with an zero-filled C2PA Manifest Store file (large enough to be replaced);
    
*   compute the hash of the ZIP Central Directory;
    
*   add the hash to the `zip_central_directory_hash` field of the `collection-data-hash-map`;
    
*   complete the manifest ;
    
*   overwrite the zero-filled `content_credential.c2pa` file with the completed manifest data.
    

When creating the `content_credential.c2pa` file in the ZIP archive, it shall be stored (compression method 0) and not encrypted. Its `general purpose bit flag` shall be set to 0. The date and time fields may be set to the time of creation of the ZIP archive, or set to 0. It may have a file comment.

<a id="_placement_of_the_manifest_store"></a>

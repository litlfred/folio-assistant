---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s418-16-4-4-1-description
section_title: "16.4.4.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7891-7902
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.4.1. Description

This assertion is used to indicate one or more locations where a copy of the asset may be obtained. Such locations shall each be described using an asset reference assertion. The location shall be expressed via a URI. The URI may be to either a single asset or it may reference a directory. In the latter case, it serves to provide the location for a collection of assets, that would be hashed via a [collection data hash](#_collection_data_hash).

> **NOTE:**
> Expressing a `uri` provides flexibility to source the asset from web locations or distributed filesystems such as IPFS (see [https://docs.ipfs.tech/how-to/address-ipfs-on-web/#subdomain-gateway](https://docs.ipfs.tech/how-to/address-ipfs-on-web/#subdomain-gateway) for the latter).

An asset reference assertion shall have a label of `c2pa.asset-ref`.

The time stamp within the assertion metadata provides a basis for determining the freshness of the link described as the reference.

<a id="_schema_and_example_12"></a>

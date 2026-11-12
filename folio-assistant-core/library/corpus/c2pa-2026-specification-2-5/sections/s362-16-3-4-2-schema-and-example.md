---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s362-16-3-4-2-schema-and-example
section_title: "16.3.4.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5806-5901
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.4.2. Schema and Example

The schema for this type is defined by the `collection-data-hash-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.5, “Collection Data Hash”](#cddl_annex_collection_data_hash) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
// example of a list of remote URLs //
{
	"alg" : "sha256",
	"uris": [
		{
			"uri": "photos/id/870.jpg"
			"hash": b64'+ddHMTUUEpuSF6dNaHFa9uFc1sSnY+O3l3MMPFvX5Ws=',
			"dc:format": "image/jpeg"
		},
		{
			"url": "deepmind/bigbigan-resnet50/1",
			"hash" : b64'...',
			"dc:format": "application/octet-stream",
			"data_types": [
				{
					"type": "c2pa.types.generator",
				},
				{
					"type": "c2pa.types.model.tensorflow",
					"version":  "1.0.0",
				},
				{
					"type": "c2pa.types.tensorflow.hubmodule",
					"version":  "1.0.0",
				}
			]
		}
	]
}

// example of a list of (relative) file URIs //
{
	"alg" : "sha256",
	"uris": [
		{
			"uri": "image1.png",
			"hash": b64'U9Gyz05tmpftkoEYP6XYNsMnUbnS/KcktAg2vv7n1n8='
		},
		{
			"uri": "document.pdf",
			"hash": b64'G5hfJwYeWTlflxOhmfCO9xDAK52aKQ+YbKNhRZeq92c='
		},
	]
}

// example of a list of relative paths inside an EPUB (which is a ZIP) //
{
	"alg" : "sha256",
	"uris": [
		{
			"uri": "mimetype"
			"hash": b64'+ZXhhbXBsZSBvZiBhIGxpc3Qgb2YgcmVsYXRpdmUgc8=',
			"dc:format": "text/text"
		},
		{
			"uri": "META-INF/container.xml"
			"hash": b64'+ddHMTUUEpuSF6dNaHFa9uFc1sSnY+O3l3MMPFvX5Ws=',
			"dc:format": "text/xml"
		},
		{
			"uri": "cover_page.svg",
			"hash": b64'U9Gyz05tmpftkoEYP6XYNsMnUbnS/KcktAg2vv7n1n8='
		},
		{
			"uri": "chapter1.html",
			"hash": b64'G5hfJwYeWTlflxOhmfCO9xDAK52aKQ+YbKNhRZeq92c='
		},
	]
}
```

<a id="_fields_2"></a>

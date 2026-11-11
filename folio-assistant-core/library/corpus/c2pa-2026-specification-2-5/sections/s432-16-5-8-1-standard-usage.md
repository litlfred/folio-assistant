---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s432-16-5-8-1-standard-usage
section_title: "16.5.8.1. Standard Usage"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8379-8460
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.5.8.1. Standard Usage

In certain use cases, such as Generative AI, it may be important to have ingredients where the data of the ingredient is provided - either embedded into the C2PA Manifest or via a URL that references the data. This is accomplished through the `data` field in the ingredient, which uses a `hashed-uri` to point to an [embedded data assertion](#_embedded_data) or a `hashed-ext-uri-map` to point to an external reference.

> **NOTE:**
> Previous versions of this specification allowed the `hashed_uri` to point to a [data box](#_data_boxes).

Using an [embedded data assertion](#_embedded_data) implies that its content will be embedded in this C2PA Manifest and in any future C2PA Manifest (unless redacted) that contains this asset as an ingredient. Claim generators should take the size of this field into consideration when choosing whether to embed data.

Example 9. Example of ingredients with data

An example of some ingredients with data, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// ingredient (prompt) //
{
  "dc:format": "text/plain",
  "relationship": "inputTo",
  "dataTypes": [{
    "type": "c2pa.types.generator.prompt",
  }],
  "data": {
    "url": "self#jumbf=c2pa.assertions/c2pa.embedded-data",
    "alg" : "sha256",
    "hash" : b64'...',
  }
}


// ingredient (model) //
{
  "dc:format": "application/octet-stream",
  "dataTypes": [
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
  ],
  "relationship": "inputTo",
  "data": {
    "url": "https://tfhub.dev/deepmind/bigbigan-resnet50/1?tf-hub-format=compressed",
    "alg" : "sha256",
    "hash" : b64'...',
  },
  "description": "Unsupervised BigBiGAN image generation & representation learning model trained on ImageNet with a smaller (ResNet-50) encoder architecture.",
  "informationalURI": "https://tfhub.dev/deepmind/bigbigan-resnet50/1",
}
```

There are also use cases where it is important to identify information about the ingredient’s data but it is neither possible to embed it nor provide a valid URL - for example, when describing the use of a private/internal AI model. For those cases, an [asset type](#_asset_type), as the value of the `data_types` field, can be provided for more clarity on the format and description of that data.

Example 10. Example of ingredients with data\_types

An example of an ingredient without a hashed uri, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// ingredient (private model) //
{
	"dc:format": "application/octet-stream",
	"relationship": "inputTo",
	"dataTypes": [
		{
			"type": "c2pa.types.generator",
		},
		{
			"type": "c2pa.types.model.tensorflow",
			"version":  "1.5.0",
		}
	],
	"description": "Joe's private generative AI model",
	"informationalURI": "https://www.example.com/joes-model-info.html"
}
```

<a id="_multi_file_ingredients"></a>

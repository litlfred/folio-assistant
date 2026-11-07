---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s391-16-4-1-4-5-digital-source-type
section_title: "16.4.1.4.5. Digital Source Type"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6763-6780
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.4.5. Digital Source Type

An action may include a `digitalSourceType` key, whose value shall be one of the terms [defined by the IPTC](http://cv.iptc.org/newscodes/digitalsourcetype/) or a C2PA specific value from the list below:

`[http://c2pa.org/digitalsourcetype/empty](http://c2pa.org/digitalsourcetype/empty)`

Media whose [digital content](#_digital_content) is effectively empty, such as a blank canvas or zero-length video.

`[http://c2pa.org/digitalsourcetype/trainedAlgorithmicData](http://c2pa.org/digitalsourcetype/trainedAlgorithmicData)`

Data that is the result of algorithmically using a model derived from sampled content and data. Differs from `[http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia](http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia)` in that the result isn’t a media type (e.g., image or video) but is a data format (e.g., CSV, pickle)

> **NOTE:**
> One common use case for the `digitalSourceType` key is in conjunction with the `c2pa.created` action to provide a way to specify how the media item was created - such as "digital capture", "digitised from negative" or "trained algorithmic media".

For "trained algorithmic" assets and data, such as those created by Generative AI, one or more [ingredients](#ingredient_assertion) may be added to the C2PA Manifest to provide info about the inputs that led to the production of the asset. They can be referenced from a `c2pa.placed` or `c2pa.created` action as shown in [Example 5, “Example of an action for Generative AI”](#generative_example).

<a id="unique-identifiers-for-actions"></a>

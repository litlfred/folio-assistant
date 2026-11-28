---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s055-single-bitstream
section_title: "Single Bitstream"
file: "bitstreams.md"
lines: 10-35
source_sha256: 105bbe2f88adcbdf
granularity: heading
---
## Single Bitstream
**/api/core/bitstreams/<:uuid>**

Provide detailed information about a specific bitstream. The JSON response document is as follow
```json
{
  "uuid": "8d33bdfb-e7ba-43e6-a93a-f445b7e8a1e2",
  "name": null,
  "handle": null,
  "metadata": {},
  "sizeBytes": 8528,
  "checkSum": {
    "checkSumAlgorithm": "MD5",
    "value": "9d8f0f9e369cf12159d47c146c499cf4"
  },
  "sequenceId": null,
  "type": "bitstream"
}
```

Exposed links:
* format: link to the bitstream format resource associated with the bitstream (Adobe PDF, MS Word, etc.)
* content: link to access the actual content of the bitstream
* bundle: link to the bundle, not embedded
* thumbnail: the thumbnail of the bitstream

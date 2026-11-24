---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s601-single-cc-license
section_title: "Single CC License"
file: "submissioncclicenses.md"
lines: 42-116
source_sha256: e669ef3bc887c7ff
granularity: heading
---
## Single CC License 
**/api/config/submissioncclicenses/<:license-name>**

Provide detailed information about a specific license. Some licenses are basic, e.g. zero retrieved from https://api.creativecommons.org/rest/1.5/license/zero
```json
{
  "id": "publicdomain",
  "name": "CC0",
  "type": "submissioncclicenses",
  "fields": [],
  "_links" : {
    "self" : {
      "href" : "/api/config/submissioncclicenses/publicdomain"
    }
  }
}
```

Some licenses contain questions, e.g. standard retrieved from https://api.creativecommons.org/rest/1.5/license/standard
```json
{
  "id": "standard",
  "name": "CC0",
  "type": "submissioncclicenses",
  "fields": [
    {
      "id": "commercial",
      "label": "Allow commercial uses of your work?",
      "description": "The licensor permits others to copy, distribute and transmit the work. In return, licensees may not use the work for commercial purposes — unless they get the licensor's permission.",
      "values": [
        {
          "id": "y",
          "label": "Yes",
          "description": "The licensor permits others to copy, distribute, display, and perform the work, including for commercial purposes."
        },
        {
          "id": "n",
          "label": "No",
          "description": "The licensor permits others to copy, distribute, display, and perform the work for non-commercial purposes only."
        }
      ]
    },
    {
      "id": "derivatives",
      "label": "Allow modifications of your work?",
      "description": "The licensor permits others to copy, distribute and transmit only unaltered copies of the work — not derivative works based on it.",
      "values": [
        {
          "id": "y",
          "label": "Yes",
          "description": "The licensor permits others to copy, distribute, display and perform the work, as well as make derivative works based on it."
        },
        {
          "id": "sa",
          "label": "ShareAlike",
          "description": "The licensor permits others to distribute derivative works only under the same license or one compatible with the one that governs the licensor's work."
        },
        {
          "id": "n",
          "label": "No",
          "description": "The licensor permits others to copy, distribute and transmit only unaltered copies of the work — not derivative works based on it."
        }
      ]
    }
  ],
  "_links" : {
    "self" : {
      "href" : "/api/config/submissioncclicenses/standard"
    }
  }
}
```

The fields are questions to be answered when assigning the license

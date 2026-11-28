---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s111-single-collection
section_title: "Single Collection"
file: "collections.md"
lines: 11-103
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
## Single Collection
**/api/core/collections/<:uuid>**

Provide detailed information about a specific collection. The JSON response document is as follow
```json
{
  "uuid": "1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb",
  "name": "Collection of Sample Items",
  "handle": "10673/2",
  "archivedItemsCount": 6,
  "metadata": {
    "dc.description": [
      {
        "value": "<p>This is a <em>DSpace Collection</em> which contains sample DSpace Items.</p>\r\n<p><strong>Collections in DSpace may only contain Items.</strong></p>\r\n<p>This particular Collection has its own logo (the <a href=\"http://www.opensource.org/\">Open Source Initiative</a> logo).</p>\r\n<p>This introductory text is editable by System Administrators, Community Administrators (of a parent Community) or Collection Administrators (of this Collection).</p>",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description.abstract": [
      {
        "value": "This collection contains sample items.",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.description.tableofcontents": [
      {
        "value": "<p>This is the <strong>news</strong> section for this Collection. System Administrators, Community Administrators (of a parent Community) or Collection Administrators (of this Collection) can edit this News field.</p>",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.provenance": [
      {
        "value": "This field is for private provenance information. It is only visible to Administrative users and is not displayed in the user interface by default.",
        "language": null,
        "authority": null,
        "confidence": -1
      },
      {
        "value": "Second provenance value",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.rights": [
      {
        "value": "<p><em>If this collection had a specific copyright statement, it would be placed here.</em></p>",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.rights.license": [
      {
        "value": "",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ],
    "dc.title": [
      {
        "value": "Collection of Sample Items",
        "language": null,
        "authority": null,
        "confidence": -1
      }
    ]
  },
  "type": "collection"
}
```

Exposed links:
* logo: link to the bitstream that represent the collection's logo
* license: link to the license template used by the collection
* defaultAccessConditions: link to the resource policies applied by default to new submissions in the collection
* parentCommunity: the community containing this collection
* adminGroup: the Collection Administrator group
* submittersGroup: the Collection Submitters group
* itemReadGroup: the Collection Default item READ rights group
* bitstreamReadGroup: the Collection Default bitstream READ rights group
* workflowGroups/<:workflow-role>: the Collection Workflow groups

Other properties:
* archivedItemsCount - The count of the items in the given container. It returns -1 when counting items feature 
is disabled at backend.

---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s319-differences-for-a-single-entry
section_title: "Differences for a single entry"
file: "metadata-suggestions.md"
lines: 360-458
source_sha256: 29d83451107b7c52
granularity: heading
---
### Differences for a single entry
**/api/integration/metadata-suggestions/<:suggestion-name>/entryValueDifferences/<:entry-id>**  

Parameters (workspaceitem or workflowitem is mandatory):
* workspaceitem: the current workspace item ID (mutually exclusive with workflowitem)
* workflowitem: the current workflow item ID (mutually exclusive with workspaceitem)

It returns the suggested metadata changes from one entry to be applied to the given item

sample for a live import source /api/integration/metadata-suggestions/orcid/entryValueDifferences/0000-0002-4271-0436?workspaceitem=123
```json
{
  "differences" : {
    "dc.identifier.orcid" : {
      "currentvalues" : [],
      "suggestions" : [
        {
          "operations": [ "add/metadata/dc.identifier.orcid/-" ],
          "newvalue": "0000-0002-4271-0436"
        }
      ]
    },
    "dc.identifier.uri" : {
      "currentvalues" : [ "https://profiles.utsouthwestern.edu/profile/16780/dean-smith.html" ],
      "suggestions" : [
        {
          "operations": [ "add/metadata/dc.identifier.uri/-", "replace/metadata/dc.identifier.uri/0" ],
          "newvalue": "https://orcid.org/0000-0002-4271-0436"
        }
      ]
    }
  },
  "_links": {
    "self": {
      "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValueDifferences/0000-0002-4271-0436?workspaceitem=123"
    }
  }
}
```

sample for a live import source /api/integration/metadata-suggestions/pubmed/entryValueDifferences/31383667?workspaceitem=456
```json
{
  "differences" : {
    "dc.contributor.author" : {
      "currentvalues" : [ "D. Pollard", "C. E. Wylie[virtual::1373]" ],
      "suggestions" : [
        {
          "operations": [ "replace/metadata/dc.contributor.author/0", "add/metadata/dc.contributor.author/-" ],
          "newvalue": "Pollard, D"
        },
        {
          "operations": [ "namevariant/metadata/dc.contributor.author/1", "add/metadata/dc.contributor.author/-" ],
          "newvalue": "Wylie, C E"
        },
        {
          "operations": [ "add-relationship/metadata/dc.contributor.author/-" ],
          "newvalue": "Newton, J R",
          "item": "1f8b3dd7-f5ae-4153-bf17-808d3a5379ac",
          "relationship-type" : 1
        }
    ]
    },
    "dc.date.issued" : {
      "currentvalues": [ "2019" ],
      "suggestions": [
        {
          "operations": [ "replace/metadata/dc.date.issued/0" ],
          "newvalue": "2019-09-23"
        }
      ]
    },
    "dc.subject" : {
      "currentvalues" : [],
      "suggestions": [
        {
          "operations": [ "add/metadata/dc.subject/-" ],
          "newvalue": "DNA replication inhibitors"
        },
        {
          "operations": [ "add/metadata/dc.subject/-" ],
          "newvalue": "Mycobacterium"
        }
      ]
    }
  },
  "_links": {
    "self": {
      "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/pubmed/entryValueDifferences/31383667?workspaceitem=456"
    }
  }
}
```

The suggested changes are based on the current item:
* It takes the current metadata of the item into account (don't suggest to add a title which is already present)
* It takes the submission forms into account (don't suggest to change metadata fields which are not editable based on input forms, only one value for a non-repeatable field)
* It suggests operations to apply to the item. The first operation is considered the most relevant by REST (but the user can choose another operation)

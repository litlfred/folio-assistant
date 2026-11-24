---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s306-introduction
section_title: "Introduction"
file: "metadata-patch.md"
lines: 12-50
source_sha256: 521e02056733123b
granularity: heading
---
## Introduction

A user with write permission on a DSpace object may change any of its metadata
using an HTTP PATCH request. All DSpace object types (Bitstreams, Items, Collections, etc.)
support metadata changes in roughly the same way.

This guide is focused on metadata-only changes and omits non-metadata parts of the object's
json representation for brevity. However, you should be aware that PATCH requests operate
against the whole object, and may therefore modify other mutable attributes in the same
request.

For additional information about PATCH support in DSpace, including request format and response
status code details, see [General rules for the Patch operation](patch.md)

The examples in each section below build on each other, assuming an initial metadata state of:

```json
{
  "metadata": {
    "dc.title": [
      { "value": "Initial Title", "language": null, "authority": null, "confidence": -1 }
    ]
  }
}
```

PATCH operations targeting metadata must specify a JSON `path` relative to the DSpace object, valid for the following levels:
- All metadata: `/metadata` → `value` must be an object (if applicable)
- All values of one metadata field: `/metadata/dc.title` → `value` must be an array (if applicable)
- One values of one metadata field: `/metadata/dc.title/0` → `value` must be an object (if applicable)

Any metadata field explicitly included in the `path` must be part the metadata registry. PATCH requests targeting unknown metadata fields will fail with HTTP 422 (unprocessable entity).

Note: The metadata of items _in submission_ is modeled in the same way described here -- as a map
of metadata keys to an ordered array of values. The primary difference is where the metadata
is located within the JSON representation. The documentation and examples below apply to archived
items and other DSpace object types, whereas the [WorkspaceItem Metadata](workspaceitem-data-metadata.md)
document describes how item metadata can be modified during submission.

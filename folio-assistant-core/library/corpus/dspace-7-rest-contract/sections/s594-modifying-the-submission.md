---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s594-modifying-the-submission
section_title: "Modifying the Submission"
file: "submission.md"
lines: 27-55
source_sha256: d5948e40a87939fd
granularity: heading
---
## Modifying the Submission

Once a submission is created (see above), the response will provide a new [/api/submission/workspaceitems](workspaceitems.md) resource.
This is the WorkspaceItem object you created.

It is **important** to keep the `id` of the WorkspaceItem, as this is necessary to update it or access it again.
For example, using the `id`, you can load up the current state of your WorkspaceItem
```
GET /api/sumission/workspaceitems/<:id>
```

In the response, you'll see a list of `sections` which are available to complete for this WorkspaceItem.
These `sections` correspond to [/api/config/submissionsections](submissionsections.md).
Each section name is also its `id`, so you can use the section name to get more information via the
that endpoint, e.g.
```
# Get info about the "traditionalpageone" section
GET /api/config/submissionsections/traditionalpageone
```
The `sectionType` returned in the response will tell you the type of section. This is important
in understanding how to interact with this section.

Each `sectionType` is separately described below, including notes on how to edit the section
* ["submission-form" section type](workspaceitem-data-metadata.md) - Used to enter metadata
* ["upload" section type](workspaceitem-data-upload.md) - Used to upload files
* ["access" section type](workspaceitem-data-access.md) - Used to edit access rights / embargo
* ["license" section type](workspaceitem-data-license.md) - Used to sign off on the required license agreement
* ["cclicense" section type](workspaceitem-data-cclicense.md) - Use to optionally apply a Creative Commons license

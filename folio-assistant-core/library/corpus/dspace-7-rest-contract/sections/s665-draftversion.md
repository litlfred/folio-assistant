---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s665-draftversion
section_title: "draftVersion"
file: "versionhistory.md"
lines: 102-109
source_sha256: f48fbb000afbfea4
granularity: heading
---
### draftVersion

**GET /api/versioning/versionhistories/<:versionHistoryId>/draftVersion**

If the latest version is not yet archived, provide access to the workspaceitem or workflowitem associated with it.
The link will respect the security defined in the workspaceitem or workflowitem endpoint so it could be not visible to user otherwise allowed to create a new version in the history.
For this scenario the `draftVersion` flag allows the UI to turn off the "create new version" button. 
Due to the restriction applied to this flag anonymous users will be unable to discover that a new version is currently under review.

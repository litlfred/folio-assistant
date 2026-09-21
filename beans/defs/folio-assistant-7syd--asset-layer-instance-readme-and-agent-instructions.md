---
# folio-assistant-7syd
title: 'ASSET LAYER: instance-readme and agent-instructions declare layer context, and the read-as-a-file trigger is tested'
status: todo
type: task
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T05:50:07Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
Two of `ie9l`'s `Done when` boxes, both **partly** landed.

**What landed** (PR #593): both roles are declared assets on all eleven
instances, they appear in the published `.jsonld`, and
`ASSET_ROLE_PURPOSE` states each role's purpose once, per role.
`agent-memory` carries the delivery rule — a file is READ and nothing
truncates it; memory is INJECTED and pays a 200-line budget.

**What did not**: the assets do not declare `layer: context`, and the rule
that an agent reaches them as a FILE is documented rather than **tested**.
`ie9l` asked for the trigger to be "named and tested"; it is named.

Owner, on why the layer matters:

> its static content at process runtime and treated as an asset like memories

That is `context` word for word — READ at session start, never written by a
running process. Declaring it makes a step that writes one a defect rather
than an update, which is the whole point of the layer.

## Done when

[ ] `instance-readme` and `agent-instructions` declare `layer: context`
[ ] A test asserts the delivery path — read as a file, no injection budget
[ ] The declaration is checkable, so a process writing one fails

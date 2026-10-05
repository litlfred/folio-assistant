Three things to note:

1. **A red draft is fixed in the editing process, not in the artifact.** The
   `no` branch off `Draft QA green?` goes back through the editing call
   activity — which means back through the HCI validation gate. Nobody patches
   a built PDF or a generated IG.
2. **Review is parallel, and both halves must land.** The review team (content
   reviewer, QC reviewer, technical officer) reviews the draft as a publication;
   the clinical or scientific SMEs sign off on the domain content. The join
   waits for both.
3. **Change requests become beans.** A `changes requested` outcome does not
   evaporate into a review thread — each request is opened as a bean, so
   whoever picks the work up next (human or agent) sees exactly what review
   asked for.

| Activity | Lane | Skill |
|----------|------|-------|
| Open or claim the release bean | Work plan | [`todo-manager`]({{ '/reference/skill-instructions/todo-manager.html' | relative_url }}) |
| Build the draft publication | Corpus + build pipeline | [`content-publish`]({{ '/reference/skills/content-publish.html' | relative_url }}) |
| Run publication QA gates | Corpus + build pipeline | [`content-test`]({{ '/reference/skills/content-test.html' | relative_url }}) · [`quality-control`]({{ '/reference/skills/quality-control.html' | relative_url }}) |
| Editing and HCI validation | Editors + authoring agents | call activity → [diagram 3](#editing-and-the-hci-validation-gate) |
| Circulate the draft | Publication manager | [`content-review`]({{ '/reference/skills/content-review.html' | relative_url }}) |
| Review the draft publication | Review team | [`content-review`]({{ '/reference/skills/content-review.html' | relative_url }}) |
| Clinical / scientific sign-off | SMEs | [`content-review`]({{ '/reference/skills/content-review.html' | relative_url }}) |
| Open beans for the change requests | Work plan | [`todo-manager`]({{ '/reference/skill-instructions/todo-manager.html' | relative_url }}) · [`content-feedback`]({{ '/reference/skills/content-feedback.html' | relative_url }}) |
| Authorise the release | Programme manager | [`content-publish`]({{ '/reference/skills/content-publish.html' | relative_url }}) |
| Version, tag and publish | Publication manager | [`content-publish`]({{ '/reference/skills/content-publish.html' | relative_url }}) · [`ig-publication`]({{ '/reference/skills/ig-publication.html' | relative_url }}) |
| Close the release beans | Work plan | [`todo-manager`]({{ '/reference/skill-instructions/todo-manager.html' | relative_url }}) |

This diagram implements the `req:content-lifecycle` phase gates —
`validate-before-review`, `review-before-test`, `test-before-publish`,
`publish-authorized` — see
[`skills/requirements/content-lifecycle.json`](https://github.com/litlfred/folio-assistant/blob/main/skills/requirements/content-lifecycle.json).

---

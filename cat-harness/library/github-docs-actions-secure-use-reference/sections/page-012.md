---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Auditing GitHub Actions events
You can use the security log to monitor activity for your user account and the audit log to
monitor activity in your organization. The security and audit log records the type of action, when
it was run, and which personal account performed the action.
For example, you can use the audit log to track the org.update_actions_secret event, which
tracks changes to organization secrets.
For the full list of events that you can find in the audit log for each account type, see the
following articles:
Security log events
Audit log events for your organization
Understanding dependencies in your workflows
You can use the dependency graph to explore the actions that the workflows in your repository
use. The dependency graph is a summary of the manifest and lock files stored in a repository. It
also recognizes files in ./github/workflows/ as manifests, which means that any actions or
workflows referenced using the syntax jobs[*].steps[*].uses or jobs.<job_id>.uses will
be parsed as dependencies.
The dependency graph shows the following information about actions used in workflows:
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
12/17

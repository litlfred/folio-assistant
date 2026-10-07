---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-013
section_title: "Page 13"
pages: 13-13
pdf_page: 13
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
The account or organization that owns the action.
The workflow file that references the action.
The version or SHA the action is pinned to.
In the dependency graph, dependencies are automatically sorted by vulnerability severity. If any
of the actions you use have security advisories, they will display at the top of the list. You can
navigate to the advisory from the dependency graph and access instructions for resolving the
vulnerability.
The dependency graph is enabled for public repositories, and you can choose to enable it on
private repositories. For more information about using the dependency graph, see Exploring the
dependencies of a repository.
Being aware of security vulnerabilities in actions you use
For actions available on the marketplace, GitHub reviews related security advisories and then
adds those advisories to the GitHub Advisory Database. You can search the database for
actions that you use to find information about existing vulnerabilities and instructions for how to
fix them. To streamline your search, use the GitHub Actions filter in the GitHub Advisory
Database.
You can set up your repositories so that you:
Receive alerts when actions used in your workflows receive a vulnerability report. For more
information, see Monitoring the actions in your workflows.
Are warned about existing advisories when you add or update an action in a workflow. For
more information, see Screening actions for vulnerabilities in new or updated workflows.
Monitoring the actions in your workflows
You can use Dependabot to monitor the actions in your workflows and enable Dependabot
alerts to notify you when an action you use has a reported vulnerability. Dependabot performs a
scan of the default branch of the repositories where it is enabled to detect insecure
dependencies. Dependabot generates Dependabot alerts when a new advisory is added to the
GitHub Advisory Database or when an action you use is updated.
Note
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
13/17

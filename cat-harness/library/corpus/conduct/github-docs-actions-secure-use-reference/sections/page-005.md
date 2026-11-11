---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
they share the same cache of the main branch with other privileged workflow triggers, and may
have repository write access and access to referenced secrets. These vulnerabilities can be
exploited to take over a repository.
For more information on these triggers, how to use them, and the associated risks, see Events
that trigger workflows and Events that trigger workflows.
For additional examples and guidance on the risks of untrusted code checkout, see Preventing
pwn requests from GitHub Security Lab and the Dangerous-Workflow documentation from
OpenSSF Scorecard.
For detailed guidance on deciding whether to use pull_request_target , hardening these
workflows, and opting out of the actions/checkout protection, see Securely using
pull_request_target.
Good practices
Avoid using the pull_request_target workflow trigger if it's not necessary. For privilege
separation between workflows, workflow_run is a better trigger. Only use these workflow
triggers when the workflow actually needs the privileged context.
Avoid using the pull_request_target and workflow_run workflow triggers with
untrusted pull requests or code content. Workflows that use these triggers must not
explicitly check out untrusted code, including from pull request forks or from repositories
that are not under your control. Workflows triggered on workflow_run should treat
artifacts uploaded from other workflows with caution.
CodeQL can scan and detect potentially vulnerable GitHub Actions workflows. You can
configure default setup for the repository, and ensure that GitHub Actions scanning is
enabled. For more information, see Configuring default setup for code scanning.
OpenSSF Scorecards can help you identify potentially vulnerable workflows, along with
other security risks when using GitHub Actions. See Using OpenSSF Scorecards to secure
workflow dependencies later in this article.
Using third-party actions
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
5/17

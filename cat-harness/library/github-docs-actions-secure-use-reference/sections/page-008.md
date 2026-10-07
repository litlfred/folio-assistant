---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-008
section_title: "Page 8"
pages: 8-8
pdf_page: 8
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Note
Support for custom claims for OIDC is unavailable in AWS.
Using Dependabot version updates to keep actions up to date
You can use Dependabot to ensure that references to actions and reusable workflows used in
your repository are kept up to date. Actions are often updated with bug fixes and new features to
make automated processes faster, safer, and more reliable. Dependabot takes the effort out of
maintaining your dependencies as it does this automatically for you. For more information, see
Keeping your actions up to date with Dependabot and Dependabot security updates.
Preventing GitHub Actions from creating or approving pull requests
You can choose to allow or prevent GitHub Actions workflows from creating or approving pull
requests. Allowing workflows, or any other automation, to create or approve pull requests could
be a security risk if the pull request is merged without proper oversight.
For more information on how to configure this setting, see Disabling or limiting GitHub Actions
for your organization, and Managing GitHub Actions settings for a repository.
Using code scanning to secure workflows
Code scanning can automatically detect and suggest improvements for common vulnerable
patterns used in GitHub Actions workflows. For more information on how to enable code
scanning, see Configuring default setup for code scanning.
Using OpenSSF Scorecards to secure workflow dependencies
Scorecards is an automated security tool that flags risky supply chain practices. You can use
the Scorecards action and workflow template to follow best security practices. Once configured,
the Scorecards action runs automatically on repository changes, and alerts developers about
risky supply chain practices using the built-in code scanning experience. The Scorecards
project runs a number of checks, including script injection attacks, token permissions, and
pinned actions.
Hardening for GitHub-hosted runners
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
8/17

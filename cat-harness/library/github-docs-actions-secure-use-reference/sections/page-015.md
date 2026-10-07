---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-015
section_title: "Page 15"
pages: 15-15
pdf_page: 15
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
You can use Dependabot to ensure that references to actions and reusable workflows used in
your repository are kept up to date. Actions are often updated with bug fixes and new features to
make automated processes faster, safer, and more reliable. Dependabot takes the effort out of
maintaining your dependencies as it does this automatically for you. For more information, see
Keeping your actions up to date with Dependabot and Dependabot security updates.
The following features can automatically update the actions in your workflows.
Dependabot version updates open pull requests to update actions to the latest version
when a new version is released.
Dependabot security updates open pull requests to update actions with reported
vulnerabilities to the minimum patched version.
Note
Dependabot only supports updates to GitHub Actions using the GitHub repository
syntax, such as actions/checkout@v6 or actions/checkout@<commit> .
Dependabot will ignore actions or reusable workflows referenced locally (for example,
./.github/actions/foo.yml ).
Dependabot updates the version documentation of GitHub Actions when the
comment is on the same line, such as actions/checkout@<commit> #<tag or link>
or actions/checkout@<tag> #<tag or link> .
If the commit you use is not associated with any tag, Dependabot will update the
GitHub Actions to the latest commit (which might differ from the latest release).
Docker Hub and GitHub Packages Container registry URLs are currently not
supported. For example, references to Docker container actions using docker://
syntax aren't supported.
Dependabot supports both public and private repositories for GitHub Actions. For
private registry configuration options, see " git " in Configuring access to private
registries for Dependabot.
For information on how to configure Dependabot version updates, see Configuring Dependabot
version updates.
For information on how to configure Dependabot security updates, see Configuring
Dependabot security updates.
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
15/17

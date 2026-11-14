---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-016
section_title: "Page 16"
pages: 16-16
pdf_page: 16
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Protecting actions you've created
GitHub enables collaboration between people who publish and maintain actions and
vulnerability reporters in order to promote secure coding. Repository security advisories allow
maintainers of public repositories to privately discuss and fix a security vulnerability in a project.
After collaborating on a fix, repository maintainers can publish the security advisory to publicly
disclose the security vulnerability to the project's community. By publishing security advisories,
repository maintainers make it easier for their community to update package dependencies and
research the impact of the security vulnerabilities.
If you are someone who maintains an action that is used in other projects, you can use the
following GitHub features to enhance the security of the actions you've published.
Use the dependants view in the Dependency graph to see which projects depend on your
code. If you receive a vulnerability report, this will give you an idea of who you need to
communicate with about the vulnerability and how to fix it. For more information, see
Exploring the dependencies of a repository.
Use repository security advisories to create a security advisory, privately collaborate to fix
the vulnerability in a temporary private fork, and publish a security advisory to alert your
community of the vulnerability once a patch is released. For more information, see
Configuring private vulnerability reporting for a repository and Creating a repository
security advisory.
Back to top
Was this Doc helpful?
Help us make GitHub Docs great!
All Docs are open source. See something that's wrong or unclear? Submit a pull request.
Yes
No
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
16/17

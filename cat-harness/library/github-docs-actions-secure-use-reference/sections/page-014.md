---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Dependabot only creates alerts for vulnerable actions that use semantic versioning and will
not create alerts for actions pinned to SHA values.
You can enable Dependabot alerts for your personal account, for a repository, or for an
organization. For more information, see Configuring Dependabot alerts.
You can view all open and closed Dependabot alerts and corresponding Dependabot security
updates in your repository's Dependabot tab. For more information, see Viewing and updating
Dependabot alerts.
Screening actions for vulnerabilities in new or updated workflows
When you open pull requests to update your workflows, it is good practice to use dependency
review to understand the security impact of changes you've made to the actions you use.
Dependency review helps you understand dependency changes and the security impact of
these changes at every pull request. It provides an easily understandable visualization of
dependency changes with a rich diff on the "Files Changed" tab of a pull request. Dependency
review informs you of:
Which dependencies were added, removed, or updated, along with the release dates
How many projects use these components
Vulnerability data for these dependencies
If any of the changes you made to your workflows are flagged as vulnerable, you can avoid
adding them to your project or update them to a secure version.
For more information about dependency review, see Dependency review.
The "dependency review action" refers to the specific action that can report on differences in a
pull request within the GitHub Actions context. See dependency-review-action . You can use
the dependency review action in your repository to enforce dependency reviews on your pull
requests. The action scans for vulnerable versions of dependencies introduced by package
version changes in pull requests, and warns you about the associated security vulnerabilities.
This gives you better visibility of what's changing in a pull request, and helps prevent
vulnerabilities being added to your repository. For more information, see Dependency review.
Keeping the actions in your workflows secure and up to date
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
14/17

---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
action's creators. The ‘Verified creator’ badge on GitHub Marketplace is a useful signal, as
it indicates that the action was written by a team whose identity has been verified by
GitHub. Note that there is risk to this approach even if you trust the author, because a tag
can be moved or deleted if a bad actor gains access to the repository storing the action.
Reusing third-party workflows
The same principles described above for using third-party actions also apply to using third-
party workflows. You can help mitigate the risks associated with reusing workflows by following
the same good practices outlined above. For more information, see Reuse workflows.
GitHub provides many features to make your code more secure. You can use GitHub's built-in
features to understand the actions your workflows depend on, ensure you are notified about
vulnerabilities in the actions you consume, or automate the process of keeping the actions in
your workflows up to date. If you publish and maintain actions, you can use GitHub to
communicate with your community about vulnerabilities and how to fix them. For more
information about security features that GitHub offers, see GitHub security features.
Using CODEOWNERS to monitor changes
You can use the CODEOWNERS feature to control how changes are made to your workflow files.
For example, if all your workflow files are stored .github/workflows , you can add this directory
to the code owners list, so that any proposed changes to these files will first require approval
from a designated reviewer.
For more information, see About code owners.
Using OpenID Connect to access cloud resources
If your GitHub Actions workflows need to access resources from a cloud provider that supports
OpenID Connect (OIDC), you can configure your workflows to authenticate directly to the cloud
provider. This will let you stop storing these credentials as long-lived secrets and provide other
security benefits. For more information, see OpenID Connect.
GitHub's security features
Secure use
Home
GitHub Actions
Reference
Security
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
7/17

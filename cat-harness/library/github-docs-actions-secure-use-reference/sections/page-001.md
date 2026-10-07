---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Secure use reference
Security practices for writing workflows and using GitHub Actions features.
Copy markdown
Find information about security best practices when you are writing workflows and using GitHub
Actions security features.
Use secrets for sensitive information
Because there are multiple ways a secret value can be transformed, automatic redaction is not
guaranteed. Adhere to the following best practices to limit risks associated with secrets.
Principle of least privilege
Any user with write access to your repository has read access to all secrets configured in
your repository. Therefore, you should ensure that the credentials being used within
workflows have the least privileges required.
Actions can use the GITHUB_TOKEN by accessing it from the github.token context. For
more information, see Contexts reference. You should therefore make sure that the
GITHUB_TOKEN is granted the minimum required permissions. It's good security practice
to set the default permission for the GITHUB_TOKEN to read access only for repository
contents. The permissions can then be increased, as required, for individual jobs within
the workflow file. For more information, see Use GITHUB_TOKEN for authentication in
workflows.
Mask sensitive data
Sensitive data should never be stored as plaintext in workflow files. Mask all sensitive
information that is not a GitHub secret by using ::add-mask::VALUE . This causes the
Writing workflows
Writing workflows
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
1/17

---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
exit 1
fi
In this example, the attempted script injection is unsuccessful, which is reflected by the
following lines in the log:
env:
TITLE: a"; ls $GITHUB_WORKSPACE"
PR title did not start with 'octocat'
With this approach, the value of the ${{ github.event.pull_request.title }} expression is
stored in memory and used as a variable, and doesn't interact with the script generation
process. In addition, consider using double quote shell variables to avoid word splitting, but this
is one of many general recommendations for writing shell scripts, and is not specific to GitHub
Actions.
Using workflow templates for code scanning
Code scanning allows you to find security vulnerabilities before they reach production. GitHub
provides workflow templates for code scanning. You can use these suggested workflows to
construct your code scanning workflows, instead of starting from scratch. GitHub's workflow,
the CodeQL analysis workflow, is powered by CodeQL. There are also third-party workflow
templates available.
For more information, see Code scanning and Configuring advanced setup for code scanning.
Restricting permissions for tokens
To help mitigate the risk of an exposed token, consider restricting the assigned permissions. For
more information, see Use GITHUB_TOKEN for authentication in workflows.
Similar to script injection attacks, untrusted pull request content that automatically triggers
actions processing can also pose a security risk. The pull_request_target and
workflow_run workflow triggers, when used with the checkout of an untrusted pull request,
expose the repository to security compromises. These workflows are privileged, which means
Mitigating the risks of untrusted code checkout
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
4/17

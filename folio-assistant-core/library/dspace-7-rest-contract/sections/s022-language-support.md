---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s022-language-support
section_title: "Language Support"
file: "README.md"
lines: 241-258
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Language Support
While most i18n (internationalization) settings exist in the UI layer, there are some backend features which also require i18n, such as Submission forms, Controlled Vocabularies, and Authorities.

For such features the `Accept-Language` header may be used by the REST client to force the use of a specific locale, if supported by the DSpace instance and endpoint in the response. (Please note that not all the DSpace instances support multiple locales. This can be discovered by querying the configuration endpoint for the `webui.supported.locales` key.)

If the support for multiple locales is enabled in the DSpace instance, a request with an `Accept-Language` header is expected to be processed as follows:
* If none of the requested locales is supported, the server will ignore the header. This provides more user-friendly behavior when browsing the REST API via a browser (see https://tools.ietf.org/html/rfc7231#section-5.3.5)
* If at least one acceptable locale is requested, the server will use the one with the higher priority in the `Accept-Language` header to process the request
* If the requested endpoint is configured to respond differently based on the selected locale, then the `Content-Language` response header will detail which locale was used to generate the response.
* If the requested endpoint responds the same no matter which locale is requested, then the `Content-Language` response will return the list of all supported locales.
    * This also implies that the ROOT endpoint will return the list of supported locales via the `Content-Language` response header

The REST client is expected to use the `Content-Language` Response Header as part of their caching strategy.

Please note that a REST client MUST always send the `Accept-Language` header for all the subsequent requests _after_ a user has chosen a preferred language/locale.

If no explicit locale is requested by the client, or the requested locale is not supported, then DSpace will check if the current user is authenticated and has a preferred language stored (if any).  If so, DSpace will respond in the preferred locale. If not (or if the user is not authenticated), DSpace will respond with the configured default locale (configuration key `default.locale`) as a fallback.

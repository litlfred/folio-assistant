---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-126-appendix-e-health-goals-to-dpi-mapping
section_title: "Appendix E: Health Goals to DPI Mapping"
section_number: null
pages: 247-252
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
223 
 
224 
1 Build Trusted Data Foundations 
225 
 
226 
Goal: core health data is captured once and reused reliably across programmes, services, and 
227 
levels of care. 
228 
 
229 
What the health system needs to be able to do: the health system needs authoritative, 
230 
uniquely identified reference data — who people are, who provides care, where, with what 
231 
products, and under what terms — held once and made available to every application 
232 
component that needs it, rather than re-collected and reconciled in each. It needs that data to 
233 
be well governed, current, and trustworthy, so that the systems built upon it can rely on it 
234 
without duplicating or re-verifying it. 
235 
 
236 
Unlike the goals that follow, this one has no mapping of its own. It is the foundation the other six 
237 
draw on. Each of those mappings traces back to the same shared components — the client, 
238 
health facility, and health workforce registries, the terminology service, the product registry, and 
239 
the lifelong health record — and the recurrence of those components across goal after goal is 
240 
the "capture once, use many times" principle made visible. The composition of that foundation, 
241 
the minimum a country puts in place first, and how it matures over time are set out in the 
242 
REDDHI framework in Section 2.2; the spreadsheets in this appendix show that foundation 
243 
being reused, goal by goal. 
244 
 
245 
 
246 
2 Support a Capable, Well-Distributed Health Workforce 
247 
 
248 
Goal: a health workforce whose members are individually identifiable and verifiable, deployed 
249 
where they are needed, paid reliably, and supported to maintain and extend their competencies 
250 
across the course of their careers. 
251 
 
252 
What the health system needs to be able to do: the system needs to know who its health 
253 
workers are and what each is qualified and authorised to do, holding an authoritative record of 
254 
identity, occupational classification, professional registration, and licensing status that clinical, 
255 
administrative, financing, and regulatory systems can consistently rely on. It needs to see where 
256 
workers are deployed and where shortages persist, so that staffing can be planned against 
257 
population need rather than inferred from incomplete or paper-based records. And it needs to 
258 
pay workers reliably, and to track the education, credentialing, and supervision through which 
259 
competence is established and renewed over time. 
260 
 
261 
How to read the mapping: the spreadsheet that follows traces each capability from the goal 
262 
through stakeholder value, business capability, and application service to the DPI-H 
263 
components and foundational-DPI dependencies that support it, and notes where each 
264 
component is reused by other goals. Its most significant shared components are the Health 
265 
 
 
237 
Workforce Registry it centres on — itself a core foundational registry that other health goals also 
266 
rely on — supported by the terminology service for occupational and qualification coding and 
267 
the facility registry for linking workers to their sites of practice and mapping deployment, all 
268 
resting on foundational-DPI identity, trust, payments, and single sign-on services. The workforce 
269 
goal introduces no new DPI-H component; the operational systems that act on the registry — 
270 
digital payroll, human-resource information systems, and learning-management and training-
271 
tracking applications — sit outside DPI-H and consume it rather than being defined by it. 
272 
 
273 
[HG2_Health_Workforce_Mapping] 
274 
 
275 
3 Ensure Quality and Continuity of Care 
276 
 
277 
Goal: care that is informed by a person's full health history, guided by current evidence at the 
278 
point of care, and coordinated across every provider, setting, and episode a person moves 
279 
through. 
280 
 
281 
What the health system needs to be able to do: the system needs to assemble a person's 
282 
longitudinal record from the many places care is given and present it as a single coherent view, 
283 
so that each encounter builds on what came before rather than starting afresh. It needs to make 
284 
current, evidence-based protocols and decision support available to health workers as they 
285 
make decisions, and to support the safe delegation of clinical tasks across cadres according to 
286 
scope of practice. And it needs to coordinate care over time — referrals, transitions between 
287 
settings, shared care plans, and follow-up — while tracking adherence and quality so that gaps 
288 
and duplication can be seen and corrected. 
289 
 
290 
How to read the mapping: the spreadsheet that follows traces each capability from the goal 
291 
through stakeholder value, business capability, and application service to the DPI-H 
292 
components and foundational-DPI dependencies that support it, and notes where each 
293 
component is reused by other goals. Despite its breadth, the goal rests very largely on shared 
294 
infrastructure other goals already require — the client registry to resolve a single patient identity 
295 
across sources, the health workforce and facility registries to attribute care to verified providers 
296 
and sites, the terminology service to keep clinical meaning consistent, and the lifelong health 
297 
record as the shared longitudinal store every provider reads from and writes to. The genuinely 
298 
new DPI-H component the goal introduces is the Clinical Decision Support Engine, which 
299 
delivers context-aware, guideline-based recommendations at the point of care and has no direct 
300 
equivalent in earlier reference architectures. The operational systems that carry out the work — 
301 
point-of-care clinical applications, care-coordination and referral tools, electronic prescribing, 
302 
laboratory and imaging systems — consume these shared components rather than being 
303 
defined by DPI-H. 
304 
 
305 
 
306 
[HG3_Quality_Continuity_Care_Mapping] 
307 
 
308 
4 Establish Trusted Personal Health Records 
309 
 
 
238 
 
310 
Goal: every person has a verifiable digital health record that they can access and control, and 
311 
that authorised providers can rely on across the places they seek care. 
312 
 
313 
What the health system needs to be able to do: the system needs to resolve each person to 
314 
a single, verifiable identity and to assemble their longitudinal record so that it can be reached 
315 
wherever care is given. It needs to let people see and govern who accesses their information, 
316 
through consent that can be granted, recorded, and withdrawn. And it needs to assure the 
317 
authenticity and integrity of records and of the people and institutions that contribute to them, so 
318 
that a record can be trusted by a provider who did not create it. 
319 
 
320 
How to read the mapping: the spreadsheet that follows traces each capability from the goal 
321 
through stakeholder value, business capability, and application service to the DPI-H 
322 
components and foundational-DPI dependencies that support it, and notes where each 
323 
component is reused by other goals. This goal is distinctive in introducing no new DPI-H 
324 
component of its own: it is the goal the foundational shared-data layer exists to serve, realised 
325 
through the client registry and the lifelong health record, supported by the workforce and facility 
326 
registries for accountable, verified contribution and by the terminology service for consistent 
327 
meaning, and resting on foundational-DPI trust services together with the cross-cutting consent 
328 
and security properties addressed elsewhere in this guidance. The patient-facing applications 
329 
through which people view and manage their records consume this foundation rather than being 
330 
defined by DPI-H. 
331 
 
332 
 
333 
[HG4_Trusted_Personal_Health_Records_Mapping] 
334 
 
335 
5 Optimize Supply Chain Management 
336 
 
337 
Goal: safe health products reach the people who need them, when and where they are needed, 
338 
through a supply chain that is visible end to end and able to adapt when demand shifts. 
339 
 
340 
What the health system needs to be able to do: the system needs to forecast demand and 
341 
plan supply against budgets and programme priorities, and to see stock levels and product 
342 
movement from source to point of use. It needs to identify products, locations, suppliers, and 
343 
individual batches consistently, so that an item can be traced through ordering, storage, 
344 
transport, and dispensing, and recalled or removed when needs arise. And it needs to connect 
345 
these flows to the rest of the health system — to facilities, to financing, and to the people who 
346 
ultimately receive the products. 
347 
 
348 
How to read the mapping: the spreadsheet that follows traces each capability from the goal 
349 
through stakeholder value, business capability, and application service to the DPI-H 
350 
components and foundational-DPI dependencies that support it, and notes where each 
351 
component is reused by other goals. The goal leans on shared infrastructure other goals 
352 
already require — the health facility registry to locate every point in the network, the terminology 
353 
 
 
239 
service to standardise product and service codes, and the client registry where dispensing is 
354 
traced to the individual — while the components specific to this domain are two reference 
355 
registries: a Product Registry that lets products be identified and traced consistently across the 
356 
network, and a Supplier Registry that records provenance and supplier accountability. The 
357 
operational systems that run the supply chain — forecasting, order, warehouse, procurement, 
358 
transport, and dispensing applications, including the tracking of individual batches and serial 
359 
numbers — consume these shared registries rather than being defined by DPI-H. 
360 
 
361 
[HG5_Supply_Chain_Mapping] 
362 
 
363 
6 Advance Efficient and Equitable Health Financing 
364 
 
365 
The method is illustrated in full for this goal in the worked example in Section 2.4.2. The 
366 
spreadsheet below provides the complete mapping — goal to stakeholder value to capability to 
367 
application service to component — including the public financial management, revenue, 
368 
pooling, purchasing, benefits design, and safeguarding sub-functions in detail. 
369 
 
370 
[HG6_Health_Financing_Mapping] 
371 
 
372 
7 Strengthen Climate and Epidemic Resilience 
373 
 
374 
Goal: anticipate epidemic and climate-related health threats early enough to act, and mount a 
375 
coordinated response when they arrive. 
376 
 
377 
What the health system needs to be able to do: the system needs to detect health events 
378 
early — through case reporting, syndromic and event-based surveillance, and adverse-event 
379 
and safety reporting — and to link those signals to verified people, providers, and places so that 
380 
cases can be confirmed, de-duplicated, and located. It needs to turn signals into assessed risk 
381 
and timely warning, increasingly by drawing weather, climate, and environmental data alongside 
382 
health data so that climate-sensitive threats can be anticipated rather than only observed. And it 
383 
needs to coordinate the response and share information across providers and, where required, 
384 
across borders. 
385 
 
386 
How to read the mapping: the spreadsheet that follows traces each capability from the goal 
387 
through stakeholder value, business capability, and application service to the DPI-H 
388 
components and foundational-DPI dependencies that support it, and notes where each 
389 
component is reused by other goals. The goal rests heavily on shared infrastructure other goals 
390 
already require — the client registry to link and de-duplicate cases, the health workforce registry 
391 
to authenticate reporters, the health facility registry to geolocate events and map outbreaks, the 
392 
terminology service for standardised disease and event coding, the product registry as the 
393 
authoritative product reference for adverse-event and safety reporting, and the health 
394 
management information system for aggregation and secondary use. Its distinctive DPI-H 
395 
component is the public health surveillance platform; and, distinctively among the seven goals, 
396 
its climate dimension draws on a foundational-DPI weather, climate, and environment data 
397 
 
 
240 
capability that sits outside the health sector and is reached through the same interoperability 
398 
that connects the rest of the architecture. The operational systems that do the work — case-
399 
reporting, adverse-event, outbreak-management, and analytics applications, together with the 
400 
alerting services that deliver warnings to health workers — consume these components rather 
401 
than being defined by DPI-H. 
402 
 
403 
 
404 
[HG7_Climate_Epidemic_Resilience_Mapping] 
405 
 
406 
 
 
241

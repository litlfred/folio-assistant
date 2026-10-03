---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-026-33-the-reference-architecture-in-practice
section_title: "The reference architecture in practice"
section_number: 3.3
pages: 59-64
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
133 
 
134 
 
135 
 
136 
Figure 3.2: The DPI-H reference architecture — a layered view showing the health goals and the 
137 
cross-cutting governance that frames them; the capabilities that serve the goals; the point-of-care 
138 
and other functional applications through which services are delivered; the digital public 
139 
infrastructure for health, comprising the core registries, the shared clinical foundation, the 
140 
semantic and structural components, and the shared reusable services; the cross-cutting 
141 
enablers; the foundational digital public infrastructure on which health builds; and the underlying 
142 
technology. 
143 
 
 
49 
A single layered view brings the whole picture together. Reading from the top, the health goals 
144 
and the governance that frames them sit above the capabilities they depend on; below these are 
145 
the functional applications through which care is delivered, and beneath them the digital public 
146 
infrastructure for health — the shared components on which many goals draw. Cross-cutting 
147 
enablers apply across the whole, and the foundational digital public infrastructure and technology 
148 
layers provide what health builds upon. This comprehensive view is necessarily dense; the 
149 
simplified per-goal views, and the worked example that follows, are the easier way in for most 
150 
readers. 
151 
The clearest way to understand the reference architecture is to follow a single health goal through 
152 
it. This section provides examples for some health goals; the same pattern applies to the others, 
153 
each of which can be navigated in the same way in the model. 
154 
For a given health goal, the architecture begins with the goal itself and the sub-goals that compose 
155 
it. Each sub-goal is associated with the outcomes that indicate progress towards it and with the 
156 
capabilities the health system needs in order to achieve it. Those capabilities are then connected 
157 
to the elements that realise them — the services exposed by application components, and the 
158 
shared data those components hold and exchange. Read from top to bottom, a single view 
159 
connects a health objective to the specific infrastructure that supports it; read from bottom to top, 
160 
it shows what each component contributes to the architecture. 
161 
The goal of establishing a trusted personal health record serves as an illustration. It resolves into 
162 
sub-goals such as establishing a secure, universally accessible, verifiable health record for every 
163 
individual and enabling patient control and consent-based sharing of health information. These 
164 
depend on capabilities — for example, identity and authentication, longitudinal health record 
165 
management, and consent management — and those capabilities are realised by foundational 
166 
components such as the Client Registry and the lifelong health record, supported by shared 
167 
terminology and exchange services and surfaced to the person through a digital health wallet. A 
168 
simplified view of the goal shows these relationships at a glance and suits readers who need the 
169 
overall picture; a layered view of a single sub-goal shows the same relationships in full detail and 
170 
suits those designing the supporting systems. 
171 
 
 
50 
 
172 
Figure 3.3: Simplified view of a single health goal (Establish Trusted Personal Health Records) — its sub-
173 
goals, the capabilities that enable them, the DPI-H components that support them, and the cross-cutting 
174 
enablers 
175 
 
176 
 
 
51 
 
177 
Figure 3.4: Layered view for one sub-goal relating to Establish Trusted Personal Health Records — from 
178 
sub-goal and outcome, through capabilities and services, to metadata components 
179 
The goal of ensuring quality and continuity of care serves as another illustration. It resolves into 
180 
sub-goals such as comprehensive needs assessment — the systematic evaluation of a person's 
181 
health status, risks, and care requirements — and shared care planning. These depend on 
182 
capabilities — for example, patient history integration, care protocol management, and decision 
183 
support — and those capabilities are realised by foundational components such as the Client 
184 
Registry and the lifelong health record, supported by shared terminology and exchange services 
185 
and by computable decision support, and surfaced to health workers through the point-of-care 
186 
clinical applications they already use. A simplified view of the goal shows these relationships at a 
187 
glance and suits readers who need the overall picture; a layered view of a single sub-goal — here, 
188 
comprehensive needs assessment — shows the same relationships in full detail and suits those 
189 
designing the supporting systems. 
190 
 
 
52 
 
191 
Figure 3.5: Layered view for one sub-goal relating to ensuring Quality and Continuity of Care — from sub-
192 
goal and outcome, through capabilities and services, to components and data 
193 
 
194 
The following features should be highlighted as they carry practical weight for countries. First, a 
195 
small number of foundational components appear again and again across goals — among them 
196 
the registries for clients, facilities, health workforce, and products. Because these components 
197 
are shared across many goals, investment in them tends to yield benefit broadly rather than for a 
198 
single programme, which is a reason to prioritise establishing them early. Second, the architecture 
199 
distinguishes the foundational digital public infrastructure that is not specific to health from the 
200 
 
 
53 
infrastructure that is health-specific, and keeps both separate from the functional applications that 
201 
sit on top of them. 
202 
The reference architecture deliberately concentrates on the digital public infrastructure for health 
203 
— the shared, reusable components on which many programmes depend. It does not present 
204 
every application component a country needs for the health sector. Achieving a health goal 
205 
generally also calls for functional applications and point-of-care clinical applications — for 
206 
example, the systems clinicians use to record and act on care — which draw on the shared 
207 
infrastructure but are not themselves part of it. The architecture also relies on a set of cross-
208 
cutting enablers that apply across all goals rather than belonging to any single component: 
209 
interoperability, treated as a capability that spans the architecture, together with the governance, 
210 
legal, and policy arrangements that allow data to be shared and trusted. These enablers are 
211 
shown alongside the components in each view, so that their role is visible without being mistaken 
212 
for infrastructure in its own right. 
213 
In terms of consistency, the worked examples and the views in the model are kept aligned with 
214 
the underlying mapping of goals, capabilities, and components, and with one another. Where a 
215 
country’s own architecture diverges from the reference — as it may, in adapting to context — 
216 
the value of the shared structure is that the divergence is visible and can be reasoned about. 
217 
 
218

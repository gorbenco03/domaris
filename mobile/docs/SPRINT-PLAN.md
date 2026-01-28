 # SPRINT-PLAN (3 x 1 saptamana)
 
 Context: Proiect existent, focus pe mentenanta pe termen lung si reducerea riscurilor
 arhitecturale. Planul prioritizeaza contracte de date stabile, separare clara UI
 vs. logic, si discipline tehnice (lint/test/observability).
 
 ## Sprint 1 — Stabilizare & Contracte de date (1 saptamana)
 
 ### Obiective
 - Stabilizarea boundary-urilor intre feature-uri (fara cross-imports).
 - Definirea contractelor de date si mapping consistent DTO -> model intern.
 - Reducerea riscului de regresii in fluxurile critice.
 
 ### Task-uri (5–8)
 - Auditeaza toate locurile unde apare `any`, `ts-ignore`, `owner || user` si propune
   mapping-uri dedicate in `src/core/api` sau `src/shared/services`.
 - Introdu layer de mapping DTO -> model intern pentru entitati cheie (User, Property,
   Conversation) in `src/core/api` sau `src/shared/services`.
 - Standardizeaza erorile API: un helper unic pentru mapping `error.response`
   in mesaje si coduri coerente.
 - Stabileste contracte publice pentru servicii de feature (`src/features/*/services`)
   si actualizeaza importurile pentru screen-uri existente (daca mai sunt ramanase).
 - Defineste o lista scurta de reguli de cod (format + boundary + no direct api in screens).
 - Adauga smoke tests simple pentru auth/search/messaging (minim 1 test per flow).
 
 ### Exit criteria
 - 0 cross-feature imports in `src/features/**` (enforced by ESLint).
 - DTO mapping existent pentru User + Property + Conversation.
 - Minimum 3 smoke tests rulate local (auth/search/messaging).
 
 ### Riscuri / Dependente
 - Contractele backend pot fi instabile; necesita aliniere cu API contracts.
 - Mapping-urile pot expune neconcordante care cer fixuri backend.
 
 
 ## Sprint 2 — Igiena feature-urilor & separare UI/logic (1 saptamana)
 
 ### Obiective
 - Screens devin UI-only; logica merge in services + hooks.
 - Reducerea complexitatii in ecranele mari (ex: PropertyDetail, Chat).
 - Uniformizare error-handling si loading states.
 
 ### Task-uri (5–8)
 - Pentru top 3 ecrane grele (PropertyDetail, Chat, SearchResults) separa UI de
   logic in hooks/services. UI nu apeleaza API direct.
 - Standardizeaza pattern de data loading: `useQuery`/`useMutation` + state local.
 - Simplifica props si extrage sub-componente reutilizabile in `shared/components`.
 - Unifica navigarea cross-feature prin `src/app/navigation/screens.ts`.
 - Adauga un mic “service contract checklist” in fiecare feature (README scurt).
 
 ### Exit criteria
 - Top 3 ecrane refactorizate: UI-only + hooks in services.
 - Nicio componenta UI nu apeleaza API direct.
 - Documentare minima pentru fiecare feature: ce expune `services/`.
 
 ### Riscuri / Dependente
 - Unele ecrane au logica ad-hoc; timpul de refactor poate creste.
 - Necesita validare rapida pe device pentru UX identic.
 
 
 ## Sprint 3 — Quality gates & observability (1 saptamana)
 
 ### Obiective
 - Quality gates solide: linting, tests minime, CI clean.
 - Observability pentru regressions (erori runtime + log-uri structurate).
 - Stabilirea disciplinei pentru long-term maintenance.
 
 ### Task-uri (5–8)
 - Introdu reguli lint suplimentare treptat (no-explicit-any doar in module noi).
 - Adauga un set minim de teste de integrare (Detox sau RN Testing Library).
 - Adauga logging central (ex: helper `logger.ts`) + hook pentru error boundary.
 - Configureaza crash/reporting (Sentry sau similar) pentru productie.
 - Stabileste release checklist (build + smoke test + lint).
 
 ### Exit criteria
 - CI local: lint + tests de baza trec consistent.
 - Observability activa in build-urile de staging.
 - Reguli de mentenanta documentate.
 
 ### Riscuri / Dependente
 - Observability necesita cont/chei externe.
 - Testele pot necesita timp extra pentru stabilizare pe CI.
 
 
 ## Dependente generale
 - Aliniere cu backend pentru DTO + API error schemas.
 - Disponibilitate device testing (iOS/Android).
 
 ## KPIs interne (tehnice)
 - Timp mediu de integrare feature nou scade cu 30–40%.
 - Numar de buguri “regresie” scade vizibil dupa Sprint 2.
 - Lint rule violations scad sprint-over-sprint.

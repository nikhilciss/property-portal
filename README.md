# Property Management Portal

A frontend-only, working Phase 1 demonstration for a Scottish letting agency. The portal connects marketing, viewings, applications, staff and landlord decisions, field visits and inspections. All people and records are fictional. **No backend, database, SAM connection, external verification, or real email delivery exists.**

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:5173 and choose a demo account. To build and serve the production bundle:

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host with SPA fallback: all non-file paths must serve `index.html`. No environment variables or API keys are required. The app assumes the root URL `/`.

## Deploy on Vercel from GitHub

The repository is prepared for `https://github.com/nikhilciss/property-portal`.
After pushing `main`, import that repository in Vercel with the project root set to `./`.

- Framework preset: **Vite**
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: **22.x**
- Environment variables: **none required**

`vercel.json` configures these build settings and the SPA fallback so direct links and refreshes on routes such as `/applications/APP-3041` work. It also prevents stale service-worker script caching. The build generates the production service worker. See [Vercel's Vite documentation](https://vercel.com/docs/frameworks/frontend/vite).

Only source files and the dependency lockfile belong in Git. Build output, dependencies, local tool directories and environment files are ignored. Browser demo data remains local to each visitor; this deployment does not add a backend.

## Demo roles

- **Administrator — Alex Morgan:** all workflows, users, demo reset, integration controls and role switching.
- **Applications Officer — Sarah Henderson:** properties, viewings, applications, documents, checks and decisions.
- **Property Manager — David Wallace:** portfolio, application reviews, visits and inspections.
- **Field Officer — Emma Wilson:** assigned visits, viewings, inspections and notifications.
- **Applicant — Isla Campbell:** own application, guided uploads, verification and status.

Login is a role simulation, not secure authentication. Session selection persists on the device. Staff may preview an application from its record or invitation. Applicant accounts cannot navigate into staff screens; mutation permissions are checked by feature services as well as route guards.

## Demonstration 1: viewing to approved application

1. Sign in as Administrator. Open **Properties → 18 Queen Street → Listing**. Edit the listing and set it to Live; publication is explicitly simulated.
2. Open **Viewings**, schedule an appointment or open the seeded viewing at 18 Queen Street.
3. Confirm and then **Complete & invite**. This creates a single linked application, simulated invitation email, staff notification and audit event. Repeating completion does not duplicate the invitation.
4. Use **Open applicant experience**. Complete the six wizard steps, including address history, employment, income, household, references and declaration. Details save locally while editing.
5. Upload a PDF, JPG or PNG under each of the four guided document types, then submit. No file binary persists. Submission validates required details and documents, updates the status, and starts pending simulated checks.
6. Open the application from **Applications**. Accept each document. To demonstrate a correction, request a replacement with an explanation; the applicant can upload again and resubmit.
7. Set **Verification → Verified**, **Credit Check → Passed**, and **FCDO Check → Clear**. These are demo controls, with provider labels and references identifying simulation.
8. Move to staff review, approve internally, preview the landlord approval pack and mark it sent. Record a landlord approval, rejection or request for more information.
9. Approval updates the property to Let Agreed. Follow changes in dashboard counts, the application timeline, Notifications, Email Activity and Audit Trail.

All approval stages require accepted documents and clear checks. Sending to the landlord requires internal approval; recording landlord approval requires the landlord review stage. Final decisions cannot be changed in this demo.

## Demonstration 2: mobile inspection

1. Sign in as Field Officer, open **My day**. The repeatable demo day is **7 October 2026**.
2. Visits are grouped deterministically by city/postcode area; appointment times remain visible. **Simulate schedule change** moves a scheduled visit 45 minutes and updates its linked viewing, notification and audit.
3. Open the routine inspection at **44 George Street**. Review access instructions, approved pets and maintenance, then start the visit.
4. Open the inspection, rate every section, and explain any Attention Required rating. Add photo metadata and captions; selected images have temporary previews.
5. Review and submit. The visit completes, an immutable text report is produced, property audit history updates, and a property-manager notification and email are simulated. Download the text report from the submitted inspection.

## Alternative intake: JotForm

Administrator → **Integration demo** demonstrates staged parsing, applicant/property matching, document identification, identity/credit/FCDO requests, a simulated SAM update and review routing. Each submission creates one linked application. Missing documents remain explicit; the demo does not falsely mark incomplete submissions as ready to approve.

## Architecture

React 19, TypeScript, Vite, React Router, Lucide React, React Context and maintainable plain CSS. Native forms provide input constraints; feature services enforce cross-field and workflow validation. No Redux, backend or database is needed.

```text
React pages and reusable components
                |
          PortalService
    (permissions + workflow rules)
                |
       Repositories / UnitOfWork
                |
        StorageAdapter interface
          /               \
StaticJsonStorageAdapter  BrowserStorageAdapter
      seed JSON             localStorage
                |
        Mock integration gateways
```

Components never import seed JSON or read localStorage directly. The storage layer owns initialization and persistence. A UnitOfWork reads a cloned snapshot, applies all related changes and writes once, so failed validation does not leave partial workflow mutations. Context refreshes after successful commands to propagate changes throughout the UI.

Named User, Property, Application, Visit, Inspection, Document, Notification and Audit repositories expose record reads. The workflow service uses the shared UnitOfWork for multi-record commands.

```text
src/
  app/                 Context, routes, permissions gate and application shell
  components/          Reusable cards, tables, filters, dialogs and feedback
  features/            Auth, dashboard, portfolio, applications, field and operations
  services/
    portal.ts          Business commands and permissions
    repositories/      Typed repositories and transactional UnitOfWork
    storage/           Storage interfaces, seed and browser adapters, session storage
    integrations/      Identity, credit, compliance, email and SAM mock gateways
  data/                Related JSON seed collections
  types/               Domain contracts
  styles.css           Responsive visual system
public/                App icon and manifest
scripts/               Reproducible seed generator and production service worker builder
tests/                 Domain and browser workflow tests
```

## Persistence and reset

The first launch copies seed JSON into `property-portal-v1` in localStorage. Further commands use persisted data. `property-session` stores the selected demo account. Data is device/browser-local; no server or cloud copy exists.

Administrator → **Demo settings → Reset demo data** restores all seed collections after a confirmation. If saved data is corrupt or browser storage fails, an error screen offers retry and a confirmed reset. `node scripts/seed.mjs` regenerates checked-in seeds for development; normal demonstrations do not require editing source.

Dataset: 18 properties, 18 applicants, 12 applications, 24 viewings, 18 visits, 9 inspections, 33 documents, 32 notifications and 54 audit entries, plus landlords, tenants, users and integration submissions.

## Integration contracts and future replacements

- `PropertySystemGateway` / `MockPropertySystemGateway`: replace with a SAM-facing API client.
- `EmailGateway` / `MockEmailGateway`: replace with backend Microsoft Graph delivery.
- `IdentityVerificationGateway` / mock: replace with the chosen identity provider through the backend.
- `CreditCheckGateway` / mock: replace with authorized Experian integration through the backend.
- `ComplianceCheckGateway` / mock: replace with the approved compliance service.

Production direction:

```text
React frontend
      |
Authenticated Node/Express or .NET API
      |
SAM integration service
      |
Approved stored procedures
      |
Microsoft SQL Server (SAM system of record)
```

The immediate next step is to agree the SAM record mappings, stored-procedure contracts, state transitions and production identity/authorization requirements. Implement asynchronous API repositories and gateways behind the same domain boundaries. The current local adapter is synchronous; converting repository/service calls to asynchronous requests will require loading and error handling at those boundaries, but presentation components do not need to learn SAM schemas.

Production must enforce authorization, validation, transactional consistency, audit integrity, document scanning/storage/retention and secrets on the server. Do not deploy this demo as a secure tenant portal.

## Checks

```sh
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Domain tests cover the two full workflows, permissions, upload validation, approval prerequisites, duplicate invitations, schedule synchronization, external-form simulation, reset and seed relationships. Browser tests exercise routing, persistence, responsive layouts and operational interactions. Validation completed with 7 passing domain tests and 4 passing browser tests. Production QA also verified listing photo metadata, the property list at 1440/1024/768/390 pixels and offline field-route navigation with no runtime errors. To repeat the production smoke check, run `npm run preview -- --port 4173` and then `node scripts/check-production.mjs` in another terminal.

## PWA and limits

- Manifest, app icon, standalone display and a production-only service worker are included. Production builds precache the shell and bundled assets. Install/offline behaviour requires HTTPS or localhost and a first online visit; browser support varies.
- All records and checks are fictional; no real provider is contacted and no actual email is sent.
- Files persist as metadata only. Inspection image previews last for the current mounted page; files cannot be downloaded later. The inspection text report is downloadable.
- The default demo schedule uses 7 October 2026, while new activity records use the current system time. Users can filter other dates and schedule new appointments.
- Postcode grouping is deterministic and does not compute real driving routes or travel times.
- Browser persistence is intended for one active demonstration tab, not concurrent users or cross-tab editing.
- Local role checks demonstrate product behaviour and do not protect the data from browser developer tools.
- The landlord approval pack is staff-facing. There is no Phase 2 landlord portal.
- The optional Google Fonts stylesheet improves presentation online; local sans-serif fallbacks keep the application usable without it.

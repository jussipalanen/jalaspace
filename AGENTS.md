# JalaSpace – AI Development Instructions

> These instructions apply to every AI coding agent working in this repository
> (Claude Code, Codex, Cursor, GitHub Copilot, …) and to human contributors.
> `CLAUDE.md` imports this file, so there is a single source of truth: edit the rules here.

## Project Overview

JalaSpace is a portfolio/demo SaaS application for property and space management.

The application should demonstrate:

* modern React development
* TypeScript
* clean frontend architecture
* reusable components
* good UX
* realistic business-domain modeling
* local demo persistence
* architecture that can later be extended with a Node.js backend
* Docker-based local development
* automated GitHub CI checks
* secure dependency management
* AI-assisted software development with mandatory human review

The project is developed as a monorepo.

Initial development must focus on the frontend first.

Do not implement the backend during the initial frontend phase unless explicitly requested.

---

# Main Goal

Build JalaSpace as a polished property management demo application.

The application should allow users to manage:

* properties
* units and spaces
* tenants
* leases
* maintenance tasks
* basic dashboard statistics

The goal is not to build a complete commercial property management platform.

The goal is to create a realistic, professional and technically well-structured portfolio project.

Prioritize quality over feature quantity.

---

# Development Philosophy

JalaSpace uses an AI-assisted development workflow.

AI agents may:

* inspect issues
* create feature branches
* implement features
* fix bugs
* write tests
* update documentation
* run automated checks
* create commits
* create pull requests

AI agents must not autonomously:

* merge pull requests into `main`
* bypass branch protection
* disable security checks
* approve their own pull requests
* deploy changes to production
* modify production secrets
* remove required CI checks
* force push to protected branches

A human developer is always responsible for final approval.

The required workflow is:

```text
GitHub Issue / Feature
        ↓
AI Agent
        ↓
Feature Branch
        ↓
Implementation
        ↓
Automated CI checks
        ↓
Pull Request
        ↓
Human Review
        ↓
Human Approval
        ↓
Merge to main
        ↓
Production deployment
```

No implementation should move directly from AI-generated code to production.

Human review is mandatory before:

1. merging into `main`
2. deploying to production

---

# GitHub Issue Driven Development

Every meaningful implementation should originate from a GitHub Issue or clearly defined feature task.

Examples:

```text
Feature: Implement property management
Feature: Add demo authentication
Feature: Add maintenance task filtering
Feature: Add reset demo data action

Bug: Property form allows empty city
Bug: Dashboard occupancy percentage is incorrect

Chore: Add Docker development setup
Chore: Add GitHub CI workflow
```

Issues should define:

* purpose
* requirements
* acceptance criteria
* relevant technical constraints

Example:

```text
Title:
Feature: Add property creation

Requirements:
- User can create a property
- Name is required
- Address is required
- City is required
- Property is persisted through repository abstraction
- localStorage implementation is used in demo mode

Acceptance criteria:
- Property appears in property list
- Data survives page refresh
- Invalid form cannot be submitted
- Tests pass
```

The agent should use the issue as the source of truth for the implementation.

---

# Feature Branch Workflow

Never develop features directly on `main`.

Create a dedicated branch for each issue or feature.

Examples:

```text
feature/app-shell

feature/demo-auth

feature/property-management

feature/maintenance-tasks

fix/property-validation

chore/docker-setup

chore/github-ci
```

When GitHub Issue numbers are available, branch names may include them:

```text
feature/12-property-management

fix/27-maintenance-status

chore/31-docker-setup
```

Avoid long-lived feature branches.

Each branch should solve one clearly defined task.

---

# Pull Request Workflow

Every feature, bug fix or meaningful infrastructure change must be delivered through a Pull Request.

The AI agent may create the Pull Request.

The AI agent must not merge the Pull Request.

Every Pull Request must be reviewed by a human.

Pull Requests are squash-merged; the PR title must follow Conventional Commits because it becomes the commit on `main` and the changelog line (see Versioning and Releases).

A Pull Request should include:

```text
Summary

What changed

Why the change was needed

How to test

Tests added or updated

Potential risks

Screenshots when UI changes are involved

Related GitHub Issue
```

Example:

```text
Closes #12
```

Keep Pull Requests focused.

Do not combine unrelated changes into the same Pull Request.

---

# Human-in-the-Loop Requirement

Human review is a mandatory part of the JalaSpace development process.

The human reviewer must verify:

* implementation matches the issue
* architecture remains consistent
* generated code is understandable
* no unnecessary dependencies were introduced
* security issues are not obvious
* tests cover important behavior
* UI works as expected
* CI checks pass
* no secrets are committed
* no unexpected files were modified

Only a human may approve merging to `main`.

---

# Protected Main Branch

Treat `main` as a protected branch.

Agents must never:

```text
git push origin main
```

or force push:

```text
git push --force origin main
```

All changes must arrive through Pull Requests.

Recommended GitHub branch protection rules:

* require Pull Request before merging
* require at least one approval
* require CI status checks
* require branch to be up to date before merging
* block force pushes
* block branch deletion
* require conversation resolution
* prevent direct pushes

If repository permissions allow it, configure these protections in GitHub.

GitHub offers branch protection and rulesets for private repositories only on paid plans.
Until they are enabled, GitHub does not enforce these rules, so every agent and contributor must follow them by process.

---

# Production Deployment Policy

Production deployment must only happen from reviewed code.

Required flow:

```text
Feature Branch
      ↓
Pull Request
      ↓
CI
      ↓
Human Review
      ↓
Merge to main
      ↓
Production Build
      ↓
Production Deployment
```

AI agents must not manually trigger a production deployment unless explicitly instructed by a human.

Preview deployments are allowed for Pull Requests.

Production deployments require code that has already passed human review.

---

# Technology Stack

## Frontend

Use:

* React
* TypeScript
* Vite
* React Router
* modern CSS solution already selected for the project
* localStorage for demo persistence
* Vitest for unit tests where useful
* React Testing Library for component tests where useful
* Playwright for end-to-end tests of critical user flows

Avoid unnecessary dependencies.

Do not introduce large state-management libraries such as Redux unless there is a clear requirement.

Prefer:

* React hooks
* custom hooks
* small reusable services
* React Context only when genuinely useful

---

# Future Backend

The backend will later use:

* Node.js
* TypeScript
* REST API
* Express or another lightweight Node.js framework

The backend is not part of the first development phase.

However, frontend architecture must make it possible to replace localStorage persistence with API calls later without rewriting the UI.

---

# Repository Structure

Use a structure similar to:

```text
jalaspace/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── data/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── app.ts
│   │   ├── config.ts
│   │   ├── errors.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── dependency-check.yml
│   │   └── release.yml
│   └── dependabot.yml
│
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── CHANGELOG.md
├── release-please-config.json
├── .release-please-manifest.json
├── CLAUDE.md
├── AGENTS.md
├── README.md
└── package.json
```

The `backend/` directory holds the Node.js + TypeScript API (Express). It runs the TypeScript sources directly on Node.js 24 (type stripping), so there is no build step. Its conventions are described in `backend/README.md`: routes under `/api`, errors as codes (`{ "error": { "code": "not_found" } }`), never stack traces.

Add backend endpoints only when an issue asks for them. The frontend's `api` data provider (`VITE_DATA_PROVIDER=api`) reads and writes all entities through these endpoints; `localStorage` stays the default for development, tests and preview deployments, and production on Vercel uses `api` (see Environment Separation).

---

# Docker Setup

JalaSpace should support Docker-based local development.

Create:

```text
frontend/Dockerfile
docker-compose.yml
.dockerignore
```

The frontend Docker setup should support:

* installing dependencies
* running the development server
* exposing the Vite development port
* running the application consistently across environments

Example development architecture:

```text
Docker Compose
      ↓
Frontend Container
      ↓
React + Vite
      ↓
localhost
```

The Docker configuration should remain simple.

Do not introduce Kubernetes, Docker Swarm or other orchestration technologies for this demo.

---

# Frontend Docker Requirements

Use an official supported Node.js image.

Prefer a current LTS Node.js release.

Example structure:

```dockerfile
FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

Adjust the implementation according to the actual project.

Use `npm ci` when a lock file exists.

Do not use floating dependency installation in CI when reproducible builds are possible.

---

# Docker Compose

The repository should provide a simple local development command:

```bash
docker compose up
```

The frontend service should:

* mount source code where appropriate
* expose the Vite port
* pass required development environment variables
* avoid storing unnecessary generated files on the host

Future backend services can later be added to the same Compose setup.

Example future architecture:

```text
docker compose
├── frontend
├── backend
└── database
```

During the frontend-only phase:

```text
docker compose
└── frontend
```

---

# Product Concept

JalaSpace is a lightweight property and space management SaaS application.

Primary domain areas:

```text
Dashboard
Properties
Spaces
Tenants
Leases
Maintenance
```

The application should support realistic workflows while remaining compact enough for a portfolio demo.

---

# Data Provider Architecture

The initial application must not require a database.

Use browser localStorage for persistence.

Configure the data provider using:

```env
VITE_DATA_PROVIDER=localStorage
```

The architecture must support alternative providers later.

Example:

```env
VITE_DATA_PROVIDER=api
```

Possible future providers:

```text
localStorage
api
mock
```

Do not access localStorage directly from page components or presentation components.

Use repository abstractions.

---

# Repository Pattern

Create repository interfaces for domain entities.

Example:

```ts
export interface PropertyRepository {
  getAll(): Promise<Property[]>;
  getById(id: string): Promise<Property | null>;
  create(property: Property): Promise<Property>;
  update(property: Property): Promise<Property>;
  delete(id: string): Promise<void>;
}
```

Initial implementation:

```text
LocalStoragePropertyRepository
```

Future implementation:

```text
ApiPropertyRepository
```

Architecture:

```text
React UI
   ↓
Custom Hook
   ↓
Repository Interface
   ↓
LocalStorage Repository
```

Future:

```text
React UI
   ↓
Custom Hook
   ↓
Repository Interface
   ↓
API Repository
   ↓
Node.js API
   ↓
Database
```

---

# LocalStorage Rules

Demo data should exist only inside the user's browser.

The data should:

* survive page refreshes
* survive browser restart
* remain isolated between different browsers
* remain isolated between different devices
* disappear when browser site data is cleared
* not require a server-side database

Use namespaced localStorage keys.

Example:

```text
jalaspace_properties
jalaspace_units
jalaspace_tenants
jalaspace_leases
jalaspace_maintenance
jalaspace_session
jalaspace_profile
jalaspace_profile_image
jalaspace_credentials
jalaspace_seed_version
jalaspace_language
```

`jalaspace_seed_version` records which version of the seed data is stored.
Seed data is written on the first visit and never overwrites existing data of the same version.
Bump the seed version when the seed data or entity shapes change incompatibly.

---

# Demo Reset

Provide:

```text
Reset demo data
```

Resetting demo data should:

1. clear JalaSpace localStorage data
2. recreate seed data
3. restore the default demo profile, remove the profile image and restore the default demo password
4. update the UI
5. show success feedback

Require confirmation before resetting.

The Reset demo data action lives on the Settings page.

Resetting keeps the signed-in session and the language preference (`jalaspace_language`).

---

# Authentication

During the frontend phase authentication may be simulated.

Example:

```text
demo@jalaspace.app
demo
```

Store demo authentication state using:

```text
jalaspace_session
```

The demo password can be changed in Settings (see Settings → Change password).
Sign-in must therefore check the stored credentials, falling back to the default `demo` password when none are stored.

Store the password only as a hash in:

```text
jalaspace_credentials
```

Never store the password in plain text.

The login page must offer a way to restore the demo account in case a changed password is forgotten:

```text
Forgot your password? Restore demo account
```

Restoring the demo account:

* requires confirmation
* restores the default `demo` password
* does not delete other demo data

This is demo authentication only.

It must never be presented as secure production authentication.
Hashing in the browser does not make it secure; it only avoids storing plain-text passwords.

---

# Application Routes

Initial routes:

```text
/login

/

/properties
/properties/:id

/units

/tenants
/tenants/:id

/leases

/maintenance
/maintenance/:id

/settings
```

Unauthenticated users should be redirected to:

```text
/login
```

---

# Frontend Development Order

Implement JalaSpace incrementally:

```text
1. Project foundation
2. Docker development setup
3. GitHub CI workflow
4. Application layout
5. Routing
6. Demo authentication
7. Repository architecture
8. localStorage persistence
9. Seed data
10. Dashboard
11. Internationalization (English and Finnish) and language switcher
12. Properties
13. Spaces
14. Maintenance
15. Tenants
16. Leases
17. Settings (profile, profile image, password change, demo reset, language)
18. UI polish
19. Tests
```

Internationalization comes before the remaining pages so that every new page is translatable from the start.

Each larger item should normally have its own GitHub Issue and Pull Request.

---

# Dashboard

Dashboard should show meaningful calculated data.

Examples:

```text
Properties             4
Spaces                 84
Occupancy              92%
Open maintenance        7
```

Include:

* recent maintenance
* available spaces
* recent activity

Do not hardcode statistics when they can be derived from actual repository data.

Metric definitions (use the same definitions everywhere, e.g. per property on the Properties page):

```text
Occupancy          occupied spaces / all spaces, rounded to a whole percent
                   ("—" when there are no spaces)
Open maintenance   tasks that are not completed (open + in progress)
Available spaces   spaces with status available; flagged as reserved
                   when an upcoming lease exists
```

Recent activity is derived from entity dates (maintenance completed, lease started, lease ended) until a stored activity log exists.

Calculations belong in a pure, tested service (`services/dashboard.ts`), not in components.

---

# Properties

Features:

* property list
* search
* property details
* create
* edit
* delete

Example:

```text
Joensuu Center

48 spaces
92% occupancy
3 open maintenance tasks
```

Rules:

* required fields: name, address, postal code (5 digits) and city; name at most 100 characters
* occupancy and open maintenance use the Dashboard metric definitions (`services/metrics.ts`)
* search matches name, address, postal code and city, and is kept in the URL (`?q=`)
* a property that still has spaces or maintenance tasks cannot be deleted; the confirmation explains what refers to it

## Deleting related data

Never leave references to deleted entities. When other data refers to an entity, block the delete and explain what must be removed or moved first, unless a feature explicitly specifies a cascading delete.

Re-check the rule with current data when deleting, not only when the confirmation opens.

---

# Spaces

Features:

* list
* property filter
* status filter
* search
* create
* edit
* delete

Statuses:

```text
Available
Occupied
Maintenance
```

---

# Maintenance

Maintenance is a key JalaSpace feature.

Implement:

* task list
* task details
* create
* edit
* delete
* change status
* complete task
* property filter
* space filter
* priority filter
* status filter
* search

Priorities:

```text
Low
Medium
High
```

Statuses:

```text
Open
In progress
Completed
```

---

# Tenants

Implement:

* list
* search
* create
* edit
* delete
* detail page
* assign tenant to space
* remove tenant from space

Keep tenant functionality intentionally lightweight.

---

# Leases

Implement:

* list
* create
* edit
* status filter
* tenant connection
* space connection
* lease period
* optional monthly rent

Statuses:

```text
Upcoming
Active
Ended
```

---

# Settings

The Settings page (`/settings`) contains:

```text
Profile
Change password
Language
Demo data
```

The Language section offers the same choice as the language switcher (see Internationalization).

Each section is saved independently and shows its own success or error feedback.

## Profile

Fields:

| Field         | Input                           | Rules                                |
| ------------- | ------------------------------- | ------------------------------------ |
| Profile image | Image upload                    | Optional, see Profile image below    |
| Email         | Read-only text                  | Cannot be changed                    |
| First name    | Text input                      | Required, trimmed, max 50 characters |
| Last name     | Text input                      | Required, trimmed, max 50 characters |
| Birthdate     | Three selects: Day, Month, Year | Optional, see Birthdate below        |

Email is read-only because it is the sign-in identifier of the demo account.

Saving the profile:

* validates the form before saving
* persists through a profile repository (`jalaspace_profile`)
* updates the name and avatar shown in the header immediately
* shows success feedback

The header shows the user's full name (`First name Last name`).

### Birthdate

Entered with three separate `<select>` controls in day-month-year order:

```text
Day      1–31
Month    1–12
Year     current year down to 120 years ago
```

Each select needs its own accessible label.

Rules:

* optional: either all three parts are selected, or none
* must be a real calendar date, e.g. 31.2. is invalid and 29.2. is only valid in leap years
* must not be in the future
* the Day options should match the selected month and year where practical; validation must still reject invalid dates

Storage and display:

* store as a date-only ISO string: `1990-09-22`
* display as `d.m.yyyy`: `22.9.1990`

### Profile image

Users can add, change and remove a profile image.

Accepted formats:

```text
JPEG  (.jpg, .jpeg)
PNG   (.png)
WebP  (.webp)
GIF   (.gif)
```

Do not accept SVG. SVG files can contain scripts.

Rules:

* check both the file's MIME type and that the browser can actually decode it as an image
* reject files larger than 5 MB before processing, with a clear error message
* resize and crop the image in the browser to a square, at most 256 × 256 pixels, using the Canvas API
* store the processed image as a compressed data URL (JPEG or WebP) through a repository (`jalaspace_profile_image`)
* keep the stored image small (target under 100 KB); localStorage has a total limit of roughly 5 MB per site
* handle storage-quota errors with an understandable message instead of crashing
* show a preview before saving
* removing the image requires confirmation and falls back to the user's initials

Where the image is shown:

* header avatar
* Settings → Profile

Always provide alt text, e.g. `Profile image of Demo User`.
Use the initials avatar when no image is set or the image fails to load.

A future API version should upload the image to the backend instead of storing a data URL.

## Change password

Fields:

```text
Current password
New password
Confirm new password
```

Rules:

* all fields are required
* the current password must match the stored password
* the new password must be at least 8 characters
* the new password must differ from the current password
* the confirmation must match the new password

On success:

* store the new password hash in `jalaspace_credentials`
* keep the user signed in
* clear the form
* show success feedback

After a change, sign-in requires the new password.
Reset demo data and Restore demo account both restore the default `demo` password.

Use `type="password"` inputs with suitable `autocomplete` values (`current-password`, `new-password`).

## Demo data

Contains the Reset demo data action described in Demo Reset.

---

# Internationalization (i18n)

JalaSpace supports two languages:

```text
en   English   (default and fallback)
fi   Suomi     (Finnish)
```

Users can switch the language at any time. The whole UI must work in both languages.

## Translation module

Use a small, fully typed translation module in `src/i18n/` instead of an external library.
Two languages do not justify a new dependency, and TypeScript can verify that every key is translated.

```text
src/i18n/
├── locales/en.ts      English dictionary: the source of truth for keys
├── locales/fi.ts      Finnish dictionary, typed against the English one
├── I18nProvider.tsx   Active language, persistence, <html lang>
├── useTranslation.ts  Returns { t, language, setLanguage, locale }
└── format.ts          Locale-aware number, currency and area formatting
```

Rules:

* the Finnish dictionary must have the same keys as the English one; a missing key is a TypeScript error
* keys are nested by feature, e.g. `nav.dashboard`, `dashboard.stats.occupancy`, `maintenance.status.in_progress`
* interpolation uses named placeholders: `t('dashboard.stats.spacesOccupied', { occupied: 58, total: 68 })`
* plurals use `Intl.PluralRules` (`one` / `other`), never `count === 1 ? … : …` with English words
* a missing translation falls back to English, and in development logs a warning
* keep the module's API close to i18next (`t(key, values)`) so it could be replaced by a library later if needed

Adding a language means adding one locale file and registering it; no component changes.

## What must be translated

All UI text, including:

* visible text, headings, buttons and links
* page titles and document titles
* `aria-label`, `title` and alt text
* form labels, hints and validation messages
* success, empty-state and error messages
* labels for statuses, priorities, categories and types

Do not hard-code UI text in components.

Services, validation and other logic must return **codes, not display text**, and the UI translates them. For example:

```ts
validateLoginForm(values)   // → { email: 'required' }, not { email: 'Email is required.' }
activity.type               // → 'lease_ended', translated in the component
```

## What is not translated

User content is stored and shown exactly as entered:

```text
property names, addresses, descriptions
space names
tenant names and notes
maintenance titles and descriptions
```

Seed data stays in English.

## Formatting

Format values with the active language's locale:

```text
Language   Locale   Number      Currency     Area
en         en-GB    1,234.5     €1,234.50    62 m²
fi         fi-FI    1 234,5     1 234,50 €   62 m²
```

* dates use `d.m.yyyy` in both languages (see Date Handling)
* use `Intl.NumberFormat` for numbers and currency; money is stored in cents (see Business Rules)
* sort user-visible text with `localeCompare` and the active locale, so Finnish å, ä and ö sort correctly

## Language switcher

* shown in the header on every app page and on the login page
* lists languages by their own names: `English`, `Suomi`
* is a labelled, keyboard-accessible control (for example a native `<select>`)
* switches immediately, without a page reload
* Settings will also offer the language choice (see Settings)

## Persistence and detection

Store the chosen language in:

```text
jalaspace_language
```

Initial language on the first visit:

1. the stored choice, if any
2. otherwise the browser language: `fi*` → Finnish
3. otherwise English

The language is a user preference, not demo data: **Reset demo data keeps it**.

When the language changes:

* update `<html lang>`
* update the document title
* keep the user on the same page

## Testing

* unit and component tests render in English by default; tests may choose a language explicitly
* test the translation function: interpolation, plurals in both languages, fallback
* test language detection and persistence
* a test verifies that no Finnish translation is empty
* E2E: switch the language, verify the UI changes and `<html lang>` updates, reload and verify the choice persists
* when a feature adds UI text, add both translations in the same Pull Request

## Future backend

The API returns error codes, not English messages; the frontend translates them.
The frontend may send the active language in the `Accept-Language` header.

---

# UI / UX Requirements

JalaSpace should look like a modern B2B SaaS application.

Prioritize:

* clear hierarchy
* readable typography
* consistent spacing
* responsive design
* good forms
* useful tables
* search and filtering
* clear empty states
* validation
* destructive-action confirmation
* clear user feedback

Avoid excessive:

* gradients
* animations
* glass effects
* oversized dashboard cards
* decorative UI
* unnecessary modal dialogs

---

# TypeScript Rules

Enable strict TypeScript.

Avoid:

```ts
any
```

unless genuinely necessary.

Prefer explicit domain types and union types.

Example:

```ts
export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "completed";
```

---

# React Rules

Use:

* functional components
* hooks
* reusable components
* custom hooks where useful

Avoid giant page components.

Separate:

```text
presentation
business logic
repository access
validation
formatting
```

where appropriate.

---

# ID Generation

Locally generated entity IDs are random UUID v4 strings, e.g. `2f46a796-8488-470f-ac25-35fac8ea31da`.

Use:

```ts
import { generateId } from '../utils/id'

generateId()
```

`generateId()` calls `crypto.randomUUID()` and falls back to `crypto.getRandomValues()`.
Browsers only provide `crypto.randomUUID()` in secure contexts (HTTPS or localhost), so calling it directly breaks creating data when the dev server is opened over plain HTTP on a network address, e.g. from a phone.

Do not call `crypto.randomUUID()` directly in application code.

IDs are opaque: never derive them from names or other editable fields, and never show meaning in them. Seed data uses stable readable IDs (e.g. `property-joensuu-center`); the future backend must accept both, or migrate seed IDs to fixed UUIDs if it uses a UUID column type.

---

# Date Handling

Store canonical dates as ISO strings.

Example:

```text
2026-09-22T10:30:00.000Z
```

Store calendar dates without a time of day (for example birthdates) as date-only ISO strings:

```text
1990-09-22
```

Do not convert date-only values to timestamps; a timezone shift could change the day.

Format them only in the presentation layer.

The display format for dates is `d.m.yyyy`, for example `22.9.1990`.

---

# Testing

Use:

* Vitest
* React Testing Library

Prioritize tests for:

* repository behavior
* business rules
* form validation
* demo reset
* critical workflows

Useful examples:

```text
Property repository creates a property

Reset demo data restores seed data

Maintenance status changes to completed

Invalid property cannot be saved

Profile cannot be saved with an invalid birthdate (31.2.)

Profile image rejects unsupported formats such as SVG

Password change requires the correct current password

Reset demo data restores the default demo password
```

---

# End-to-End Testing

Use Playwright for end-to-end (E2E) tests that run the real application in a real browser.

Vitest and React Testing Library remain the main tools for unit and component tests.
E2E tests cover what they cannot:

* complete user flows across several pages
* the production build
* real browser behavior such as reloads, direct links, focus and responsive layout
* persistence across page reloads

Location and naming:

```text
frontend/e2e/*.spec.ts          desktop Chromium
frontend/e2e/*.mobile.spec.ts   mobile Chromium viewport
frontend/e2e/*.api.spec.ts      the `api` data provider against the real API
frontend/e2e/fixtures.ts        shared helpers
frontend/playwright.config.ts       localStorage tests
frontend/playwright.api.config.ts   API tests: starts backend/ and an `api` build
```

API tests share one dataset on the API, so they run serially and reset it (`POST /api/demo/reset`) before each test. Keep them to a few critical flows; validation rules and edge cases belong in the localStorage suite and in unit tests.

Tests run against the production build served by `vite preview`, the closest local match to the Vercel deployment.

Commands (inside `frontend/`):

```bash
npm run test:e2e        # run all E2E tests (localStorage)
npm run test:e2e:ui     # interactive UI mode
npm run test:e2e:api    # API tests; needs `npm ci` in backend/
npx playwright install chromium   # one-time browser install
```

Write E2E tests for critical workflows, for example:

```text
Signed-out user is redirected to sign-in and returns to the requested page

Created property appears in the list and survives a reload

Maintenance task can be completed

Reset demo data restores seed data

Mobile navigation drawer opens and closes
```

Do not duplicate every validation rule or edge case in E2E tests.
Cover those with faster unit and component tests.

Conventions:

* use accessible locators: `getByRole`, `getByLabel`, `getByText`
* avoid CSS selectors and test IDs unless no accessible locator exists
* never use fixed waits such as `waitForTimeout`; rely on Playwright's auto-waiting assertions
* keep tests independent; each test starts with fresh browser storage
* set up state (for example a signed-in session) through browser storage state, not by depending on another test
* use the demo credentials only; never real accounts or secrets

When a feature adds or changes a critical user flow, add or update its E2E test in the same Pull Request.

---

# Code Quality Checks

Every Pull Request must pass automated code quality checks.

At minimum CI should run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:e2e:api
```

and for `backend/`:

```bash
npm ci
npm run lint
npm run typecheck
npm test
```

If scripts use different names, adapt the workflow accordingly.

No Pull Request should be considered ready for human review if mandatory CI checks fail.

---

# GitHub Actions CI

Create:

```text
.github/workflows/ci.yml
```

The CI workflow should run on:

```text
pull_request
push to main
```

The workflow should verify:

```text
Dependency installation
Linting
TypeScript
Tests
Production build
End-to-end tests
Docker image build
```

Typical pipeline:

```text
Checkout
   ↓
Setup Node
   ↓
npm ci
   ↓
Lint
   ↓
TypeScript check
   ↓
Tests
   ↓
Build
   ↓
End-to-end tests (Playwright)
```

Checks run as separate parallel jobs where practical, so each can be a required status check.

Prefer the current supported Node.js LTS version.

Use dependency caching where appropriate.

---

# Security Checks

CI should include basic dependency vulnerability checking.

At minimum run:

```bash
npm audit
```

Do not automatically ignore high or critical vulnerabilities.

Security findings should be reviewed before merging.

A Pull Request containing known high-risk dependency vulnerabilities should not be merged without a documented reason.

---

# Dependency Version Checks

Keep dependencies reasonably current.

Use:

```bash
npm outdated
```

for visibility when appropriate.

Do not automatically upgrade every dependency without testing.

Major-version upgrades should normally be handled separately.

The purpose of dependency checks is to identify:

* outdated packages
* unsupported versions
* security vulnerabilities
* deprecated dependencies

---

# Dependabot

Configure:

```text
.github/dependabot.yml
```

Dependabot should monitor npm dependencies.

Suggested frequency:

```text
weekly
```

Dependency updates should still go through:

```text
Pull Request
CI
Human Review
Merge
```

Dependabot Pull Requests must not bypass normal review.

---

# Lock Files

Commit the package lock file.

Example:

```text
package-lock.json
```

Use:

```bash
npm ci
```

inside CI.

Do not delete or regenerate the lock file without reason.

---

# Secret Management

Never commit:

```text
.env
.env.local
API keys
tokens
passwords
private keys
production credentials
```

Provide example configuration using:

```text
.env.example
```

Example:

```env
VITE_DATA_PROVIDER=localStorage
```

Never put actual secrets into `.env.example`.

Secrets for GitHub Actions must use:

```text
GitHub Actions Secrets
```

Production secrets must be managed through the hosting platform.

---

# Environment Separation

Support clear separation between:

```text
development
preview
production
```

The demo application uses:

```text
development   localStorage (npm run dev) or api (Docker Compose, local API)
preview       localStorage, so a preview never changes the public data
production    api, the shared demo API on Render
```

Do not connect preview environments to production data: not to the production API's data, and not to a future production database.

---

# Vercel Deployment

The frontend should support Vercel.

Expected setup:

```text
React
TypeScript
Vite
Vercel
```

Build:

```bash
npm run build
```

Output:

```text
dist
```

Environment:

```env
# Production
VITE_DATA_PROVIDER=api
VITE_API_URL=https://jalaspace.onrender.com

# Preview
VITE_DATA_PROVIDER=localStorage
VITE_API_URL=https://jalaspace.onrender.com
```

Pull Requests may create preview deployments.

Preview deployments are useful for human review.

Production deployment must happen only from reviewed code merged to `main`.

---

# Preview Deployment Workflow

Recommended workflow:

```text
Feature branch
      ↓
Pull Request
      ↓
GitHub CI
      ↓
Vercel Preview
      ↓
Human tests preview
      ↓
Human approves PR
      ↓
Merge to main
      ↓
Production deploy
```

Preview environments do not replace code review.

---

# Versioning and Releases

JalaSpace uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

Tags use a `v` prefix:

```text
v0.1.0   v0.1.1   v0.2.0   …   v1.0.0
```

The first release is `v0.1.0`.

## Squash merging

Pull requests are merged with **squash merge only** (repository setting).
The squash commit on `main` is titled with the PR title and has no body, so:

* **the PR title becomes the changelog line** and decides the version bump
* each PR produces exactly one changelog entry, never duplicates
* commits inside a feature branch are not listed in the changelog

Merge commits are disabled because GitHub always copies the PR title into them, which release-please counts as a second change.

If a PR contains a feature and an unrelated fix, split it into two PRs so both appear in the changelog.

## Conventional Commits

PR titles and commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <description>
```

The type decides the next version and the changelog section:

| Type                     | Version bump (below 1.0.0) | Version bump (1.0.0 and later) | Changelog section |
| ------------------------ | -------------------------- | ------------------------------ | ----------------- |
| `feat`                   | minor: 0.1.0 → 0.2.0       | minor: 1.2.0 → 1.3.0           | Added             |
| `fix`                    | patch: 0.1.0 → 0.1.1       | patch: 1.2.0 → 1.2.1           | Fixed             |
| `perf`, `refactor`       | patch                      | patch                          | Changed           |
| `revert`                 | patch                      | patch                          | Reverted          |
| breaking change          | minor: 0.1.0 → 0.2.0       | major: 1.2.0 → 2.0.0           | ⚠ BREAKING CHANGES |
| `docs`, `test`, `ci`, `build`, `style`, `chore` | no release | no release        | not listed        |

Mark a breaking change with `!` after the type or a `BREAKING CHANGE:` footer:

```text
feat!: store rents per lease period

BREAKING CHANGE: existing demo data must be reset.
```

Useful scopes: `app`, `auth`, `data`, `dashboard`, `properties`, `spaces`, `maintenance`, `tenants`, `leases`, `settings`, `i18n`, `a11y`, `deploy`, `deps`.

Write the PR title for the reader of the release notes:

```text
Good:  fix(dashboard): detail lines overflowed their panel on narrow screens
Avoid: fix: css
```

Dependabot uses `fix(deps)` for runtime dependencies (a patch release) and `chore(deps-dev)` for development tools (no release).

## Release process

Releases are automated with [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release.yml`):

```text
Feature PR merged to main
      ↓
release-please opens or updates the release PR
("chore: release x.y.z": CHANGELOG.md entry + version bump)
      ↓
Human reviews and merges the release PR
      ↓
Tag vX.Y.Z and GitHub Release are created automatically
```

* several merged PRs can be collected into one release; merge the release PR when a release is wanted
* the release PR updates `CHANGELOG.md`, `.release-please-manifest.json`, `frontend/package.json` and `frontend/package-lock.json`
* the release notes on GitHub match the CHANGELOG entry
* only a human merges the release PR

Do not:

* edit released sections of `CHANGELOG.md` or change the version fields by hand
* create, move or delete version tags or GitHub Releases manually
* push release commits directly to `main`

The wording of a pending release can be improved by editing the release PR before merging it.

## Version 1.0.0

Below 1.0.0, breaking changes bump the minor version, and the API and data model may still change.

Version 1.0.0 is a deliberate human decision, e.g. when the first milestone is complete.
Release it by merging a commit with this footer:

```text
chore: prepare the first stable release

Release-As: 1.0.0
```

## Tokens

The workflow uses the `RELEASE_PLEASE_TOKEN` secret when it exists (a GitHub App token or fine-grained personal access token with contents and pull request write access), otherwise the default `GITHUB_TOKEN`.
Pull requests opened with `GITHUB_TOKEN` do not trigger CI, so a dedicated token is preferred.
Never commit the token.

---

# Security Rules for AI Agents

Agents must never:

* expose secrets in logs
* print environment secrets
* commit credentials
* disable audit checks to make CI pass
* disable tests to make CI pass
* silently downgrade security tooling
* bypass branch protections
* approve their own Pull Requests
* merge without human approval
* deploy unreviewed code
* merge release Pull Requests
* create, move or delete version tags or GitHub Releases manually

When a security check fails, fix the cause or clearly report the issue.

Do not hide it.

---

# Dependency Rules

Before adding a new dependency:

1. inspect whether existing dependencies already provide the capability
2. determine whether native browser or Node APIs are sufficient
3. evaluate package maintenance status
4. avoid unnecessary packages
5. prefer widely used and actively maintained packages

Do not add dependencies for trivial functionality.

---

# Accessibility

Use semantic HTML.

Forms require labels.

Buttons must be actual buttons.

Interactive controls must support keyboard use.

Maintain reasonable contrast.

Use ARIA attributes where necessary.

---

# Error Handling

Errors must not crash the entire application.

Provide understandable user-facing errors.

Example:

```text
Unable to load properties.

Please try again.
```

Technical details may be logged during development.

Do not expose internal stack traces to end users.

---

# Business Rules

Keep business rules simple but realistic.

Examples:

An active lease normally means:

```text
space.status = occupied
```

Completing maintenance means:

```text
status = completed
completedAt = current date
```

A lease's status is derived from its dates, not stored:

```text
startDate > today                  → upcoming
endDate < today                    → ended
otherwise (end date may be null)   → active
```

Both the start date and the end date count as days of the lease.

Store money as integer euro cents (for example `monthlyRentCents`) to avoid floating-point rounding.
Format it as euros only in the presentation layer.

Seed data must follow the same business rules as data entered in the app.
Tests verify, for example, that a space is occupied exactly when it has an active lease.

Business logic should not be buried inside presentation components.

---

# Future Node.js Backend

Future architecture:

```text
React / TypeScript
        ↓
REST API
        ↓
Node.js / TypeScript
        ↓
Database
```

Future routes may include:

```text
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id

GET    /api/units
POST   /api/units

GET    /api/tenants
POST   /api/tenants

GET    /api/maintenance
POST   /api/maintenance

GET    /api/leases
POST   /api/leases
```

Do not implement backend routes during the frontend phase unless explicitly requested.

---

# AI-Assisted Maintenance

The maintenance form offers **Suggest with AI**: the user writes a title, describes the problem in plain words, or both, and the API suggests a title, a description with things to check, a category and a priority.

Example input (a title is enough):

```text
Title:
kitchen sink leak
```

Suggestion:

```text
Title:
Kitchen sink water leak

Description:
Water is leaking at the kitchen sink.

To check:
- the drain trap and connections under the sink
- the supply hoses and shut-off valves

Category:
Plumbing

Priority:
High
```

Architecture:

```text
MaintenanceForm → services/maintenanceSuggestions.ts
        ↓
POST /api/maintenance/suggestions
        ↓
MaintenanceSuggester interface (backend/src/ai/suggestions.ts)
        ↓
GeminiSuggester (Gemini API free tier, plain fetch, JSON schema output)
```

Rules:

* the user always decides: the suggestion is shown as a card with Apply and Dismiss, and nothing is applied or saved automatically
* the form always works without AI; the button is shown only when `VITE_API_URL` is set and `GET /api/features` reports `maintenanceSuggestions: true`
* the UI tells users that the description is sent to Google Gemini and must not contain personal information
* never trust model output: the backend validates the title, description, category and priority against the app's rules before returning them, and the frontend checks the answer again
* the suggested description has two parts: the problem stated with only the facts from the user's title and description (the prompt forbids adding causes, places, times or other details), then a "To check:" list of typical checks for a maintenance worker, phrased as checks, never as findings; the user reviews it before applying
* the title and description are user data, not instructions; do not log them
* errors are codes (`validation_failed`, `rate_limited`, `ai_unavailable`, `invalid_suggestion`), translated in the frontend
* requests are rate-limited per client IP; behind a proxy, `TRUST_PROXY` must be set so the real IP is used
* use the Gemini free tier with billing off, so the feature cannot cost money
* `GEMINI_API_KEY` is a secret: only in `backend/.env` (git-ignored) or the hosting platform, never in code, logs or URLs
* call the provider through the `MaintenanceSuggester` interface, so another provider can be added without changing routes or UI
* tests never call Gemini: backend tests use fakes, and E2E tests mock the API with `page.route`

Add further AI features only when an issue asks for them.

---

# Agent Task Workflow

When an agent receives a GitHub Issue:

## 1. Read the Issue

Understand:

* requirements
* acceptance criteria
* constraints

Do not immediately start coding if the repository already contains relevant architecture that must first be inspected.

## 2. Inspect the Repository

Inspect:

* current architecture
* existing components
* coding conventions
* existing tests
* package scripts
* repository abstractions

## 3. Create a Feature Branch

Example:

```text
feature/12-property-management
```

Never work directly on `main`.

## 4. Implement the Smallest Complete Solution

Avoid unrelated refactoring.

Do not rewrite working code solely because another implementation style is preferred.

## 5. Add or Update Tests

Test meaningful behavior.

## 6. Run Local Checks

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

in `frontend/`, and `npm run lint`, `npm run typecheck` and `npm test` in `backend/` when the backend changed. Run `npm run test:e2e:api` in `frontend/` too when the API or the frontend data layer changed.

Also run appropriate security/dependency checks.

## 7. Commit Changes

Use Conventional Commits (see Versioning and Releases).
Pull requests are squash-merged, so the PR title becomes the changelog line; commit messages still document the steps for reviewers.

Examples:

```text
feat: add property creation

test: add property repository tests

fix: validate property city field
```

## 8. Push Feature Branch

Push only the feature branch.

## 9. Create Pull Request

Link the relevant GitHub Issue.

## 10. Stop Before Merge

The agent's autonomous task ends at the Pull Request.

Human approval is required before merge.

---

# Agent Pull Request Checklist

Before creating a PR verify:

```text
[ ] Issue requirements are implemented
[ ] Acceptance criteria are satisfied
[ ] TypeScript passes
[ ] Lint passes
[ ] Tests pass
[ ] End-to-end tests pass
[ ] Production build succeeds
[ ] Dependency audit has been checked
[ ] No secrets are committed
[ ] No unrelated files were modified
[ ] Documentation is updated where needed
[ ] New UI text is translated in all supported languages
[ ] PR title follows Conventional Commits and reads well as a release note
[ ] Commit messages follow Conventional Commits
[ ] UI changes have been manually sanity checked
```

---

# CI Required Checks

Recommended required GitHub checks:

```text
lint
typecheck
test
build
e2e
e2e-api
security-audit
docker-build
backend-lint
backend-typecheck
backend-test
backend-security-audit
backend-docker-build
```

All required checks should pass before merge.

If one does not pass, the PR should remain unmergeable until the failure is addressed or explicitly reviewed by a human.

---

# Production Quality Gate

Code is ready for production only when all of the following are true:

```text
GitHub Issue completed

Feature branch created

Pull Request created

CI passed

Security checks reviewed

Human code review completed

Human approval received

Pull Request merged to main

Production build succeeds
```

AI-generated code alone is never considered sufficient approval for production.

---

# Definition of Done

A feature is complete when:

* GitHub Issue requirements are met
* implementation works
* TypeScript is valid
* lint passes
* important tests pass
* production build succeeds
* security checks have passed or been reviewed
* UI is usable
* UI text is available in all supported languages
* architecture follows project conventions
* persistence goes through repositories
* no unnecessary dependencies were added
* Pull Request exists
* human review has been completed before merge

---

# Final Product Direction

JalaSpace should ultimately demonstrate:

```text
React
TypeScript
Node.js
REST APIs
clean architecture
business-domain modeling
modern SaaS UI
local demo persistence
Docker
GitHub Actions
CI/CD
dependency security
human-reviewed AI development
future database readiness
AI-assisted software development
```

The first milestone is:

```text
Polished frontend
+
localStorage
+
Docker
+
CI
+
Pull Request workflow
```

The second milestone can introduce:

```text
Node.js backend
REST API
```

The third milestone may introduce:

```text
Database
AI features
Additional integrations
```

Keep JalaSpace small enough to understand quickly but polished enough to demonstrate professional software development practices.

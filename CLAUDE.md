# JalaSpace – AI Development Instructions

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

* merge pull requests into `master`
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
Merge to master
        ↓
Production deployment
```

No implementation should move directly from AI-generated code to production.

Human review is mandatory before:

1. merging into `master`
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

Never develop features directly on `master`.

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

Only a human may approve merging to `master`.

---

# Protected Master Branch

Treat `master` as a protected branch.

Agents must never:

```text
git push origin master
```

or force push:

```text
git push --force origin master
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
Merge to master
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
│   └── README.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── dependency-check.yml
│   └── dependabot.yml
│
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── CLAUDE.md
├── AGENTS.md
├── README.md
└── package.json
```

The `backend/` directory may initially contain only documentation describing the planned backend.

Do not implement backend functionality until requested.

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
```

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
11. Properties
12. Spaces
13. Maintenance
14. Tenants
15. Leases
16. Settings (profile, profile image, password change, demo reset)
17. UI polish
18. Tests
```

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
Demo data
```

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

Use:

```ts
crypto.randomUUID()
```

for locally generated entity IDs.

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

# Code Quality Checks

Every Pull Request must pass automated code quality checks.

At minimum CI should run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
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
push to master
```

The workflow should verify:

```text
Dependency installation
Linting
TypeScript
Tests
Production build
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
```

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

For the demo application production may use:

```env
VITE_DATA_PROVIDER=localStorage
```

Pull Request preview environments may use the same provider.

Do not accidentally connect preview environments to future production databases.

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
VITE_DATA_PROVIDER=localStorage
```

Pull Requests may create preview deployments.

Preview deployments are useful for human review.

Production deployment must happen only from reviewed code merged to `master`.

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
Merge to master
      ↓
Production deploy
```

Preview environments do not replace code review.

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

# Future AI Feature

A future JalaSpace version may include AI-assisted maintenance.

Example input:

```text
Water is leaking under the kitchen sink.
It started this morning.
```

Possible suggestion:

```text
Title:
Kitchen sink water leak

Category:
Plumbing

Priority:
High
```

Do not implement this during the initial frontend phase unless explicitly requested.

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

Never work directly on `master`.

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
```

Also run appropriate security/dependency checks.

## 7. Commit Changes

Use understandable commits.

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
[ ] Production build succeeds
[ ] Dependency audit has been checked
[ ] No secrets are committed
[ ] No unrelated files were modified
[ ] Documentation is updated where needed
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
security-audit
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

Pull Request merged to master

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

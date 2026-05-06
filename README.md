# Rick Travel

Rick Travel is a production tourism web platform for showcasing tours, handling booking requests, and managing basic admin operations for a real tourism business.

[Live demo](https://rick-travel.vercel.app)

![Rick Travel production showcase](docs/assets/rick-travel-hero.png)

## Overview

Rick Travel is a real tourism application used as both a product foundation and a professional portfolio project. It is not a generic clone or isolated study project: the repository contains the public tourism experience, booking flow, authentication, protected admin area, operational documentation, and validation evidence for a production deployment.

The project is intentionally treated as an evolving product. The current goal is to keep the public booking journey stable while expanding administrative capabilities in controlled slices.

## What the project does

- Public tour catalog
- Tour detail pages with localized public routes
- Booking request flow for authenticated users
- Email/password authentication through Better Auth
- Protected admin area
- Admin tour visibility
- Admin bookings management
- Booking confirmation and cancellation actions for admins
- Contact submissions visibility in the protected admin area

## Current Production Status

- Production app is deployed on Vercel.
- Public tour browsing is validated.
- Booking request flow exists and has been validated through the manual-confirmation product path.
- Admin area is protected.
- Admin booking confirm/cancel flow exists.
- Contact submissions can be viewed in the protected admin area.
- Some visual, content, and operational polish may continue as the product evolves.

The project is production-oriented, but it should still be read as a real product under active improvement rather than a finished commercial platform with every workflow fully automated.

## Key Validated Flows

- Public homepage loads
- Tour catalog and public navigation work
- Tour detail pages open
- Booking request flow works
- Login and admin protection work
- Admin dashboard and admin routes are protected
- Admin bookings list is available
- Admin can confirm pending bookings
- Admin can cancel eligible bookings
- Admin can view contact submissions

## Live Demo

- **Web App:** [https://rick-travel.vercel.app](https://rick-travel.vercel.app)

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL / Neon
- Better Auth
- Vercel
- Server Actions

## Architecture

```text
app/
  [locale]/(public)/  Public localized tourism routes
  [locale]/admin/     Protected admin area
  actions/            Server Actions for admin and contact workflows
  api/                Public and authenticated API routes
lib/
  auth.ts             Better Auth server configuration
  auth-client.ts      Client-side auth integration
  authz.ts            Session and admin authorization guards
  services/           Business and data services
prisma/
  schema.prisma       Prisma data model
  migrations/         Database migrations
docs/ops/             Operational evidence and execution tracking
```

The public web routes handle the tourism storefront, tour discovery, booking journey, and localized content. The authentication and authorization layer protects private user and admin areas. Prisma owns the data access layer, PostgreSQL stores product and operational data, and Vercel runs the deployed Next.js application against managed environment configuration.

## Delivery Discipline - Protocolo Rick

This project follows the Protocolo Rick execution model:

- No implementation starts without minimum discovery and planning artifacts
- Backlog is treated as the source of truth
- Documentation evolves together with code
- Features are delivered in controlled slices with explicit validation criteria
- Deploy decisions, scope changes, and deferred items are documented before execution

Source of truth:

- [docs/ops/backlog.md](docs/ops/backlog.md)
- [docs/ops/status.md](docs/ops/status.md)

## Local Development

### Requirements

- Node.js 22
- npm
- PostgreSQL-compatible database for full local runtime behavior

### Install and Run

```powershell
npm install
npm run dev
```

Local development requires environment variables for database access, authentication, email/provider configuration, and deployment-specific URLs. Use `.env.example` as the reference contract and do not commit real `.env` files or production secrets.

### Build and Validate

```powershell
npm run build
npm run lint
npm run typecheck
npm test
```

`npm install` runs Prisma generation through the configured `postinstall` script. Prisma migrations and seed execution should only be run against an explicitly selected local or controlled environment.

## Useful Commands

```powershell
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run check:env -- --target=local
npm run check:db
npm run optimize-images
```

Some commands depend on a correctly configured database and provider environment.

## Limitations

- Production-oriented portfolio project
- Admin workflow is intentionally basic and evolving
- Payment processing is not part of the active validated MVP flow
- External provider behavior depends on environment configuration
- Some content and images may continue to be refined

## Author

Ricardo Souza | [devricardo90](https://github.com/devricardo90)

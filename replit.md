# Overview

Earth Care Network is a **federated, open-source CRM and directory platform** for regenerative enterprises. It offers free self-hosting for customizable instances and paid professional hosting with full CRM features and AI Sales Autopilot. The platform enables federated discovery of enterprises globally via the Murmurations protocol and provides an enterprise directory for various regenerative sectors. The business vision is to empower users to self-host and rebrand the platform while contributing to a global directory, mimicking Ghost.org's sustainable funding model.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Dual-Surface Architecture (Directory + CRM)
The application maintains a clear separation between a public-facing directory and an authenticated CRM management system.

### Public Directory
- **Access**: No authentication required.
- **Purpose**: Public browsing of regenerative enterprises, categories, and search.
- **Features**: Full-page search, category filtering, enterprise details, responsive design.

### CRM Management
- **Access**: Requires authentication with `enterprise_owner` or `admin` role.
- **Purpose**: Full CRUD management of enterprises, contacts, opportunities, and tasks.
- **Layout**: Uses a standalone `CrmLayout` component for navigation, including sidebar, mobile sidebar, and breadcrumbs, with centralized configuration.
- **Pages**: CRM pages are organized in `client/src/pages/crm/` and focus solely on domain content.
- **API**: Separate `/api/crm/*` endpoints with role-based authorization.

## Frontend Architecture
- **Framework**: React, TypeScript, Vite.
- **UI**: Custom component library based on `shadcn/ui` with Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Component Structure**: Organized into shared, directory-specific, and CRM-specific components.

## Backend Architecture
- **Framework**: Express.js with TypeScript (ESM).
- **API**: RESTful API with route handlers in `/server/routes.ts`.
- **Authentication**: Replit Auth integration with OpenID Connect, Express sessions with PostgreSQL storage.
- **AI Integration**: OpenAI GPT-5 for lead scoring and intelligent suggestions.
- **Web Scraping**: Cheerio-based service for bulk enterprise data import.

## Data Storage
- **Database**: PostgreSQL via Neon serverless hosting.
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Includes users, enterprises, people, opportunities, tasks, copilot context, and profile claim invitations.
- **Categories**: Enum-based categorization for enterprises.
- **Profile Claims/Invitations**: Token-based system with expiration and role upgrades.

## Core Features
- **Enterprise Management**: CRUD operations, categorization, verification.
- **People Management**: Contact management, status, relationship mapping.
- **Opportunity Tracking**: Deal pipeline with stages and value.
- **Task Management**: Assignment and tracking.
- **AI Copilot**: Lead scoring, suggestions, automated insights, function calling for adding enterprises.
- **Bulk Import**: Web scraping for enterprise data.
- **Full Page Search**: Unified search across entities with URL state persistence.
- **CSV Export**: Opportunities export with linked entity data.
- **Profile Claim Invitations**: Token-based invitations with automatic role upgrade.
- **Murmurations Protocol**: Integration for federated directory system.
- **Multi-Tenant Ownership**: `enterpriseOwners` table with roles for RLS.
- **Onboarding System**: Tier-specific guided tours with progress tracking.
- **Subscription & Tiers**: 4-tier pricing (Free, CRM Pro, Build Pro Bundle, Admin) integrated with Stripe, feature gating, and upgrade prompts.
- **Mobile Optimization**: CRM pages are fully mobile-responsive with card views for smaller screens.

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Replit**: Development environment and authentication provider.

## AI & ML Services
- **OpenAI API**: GPT-5 model.

## Frontend Libraries
- **React Ecosystem**: React 18, React Query, React Hook Form, Wouter.
- **UI Components**: Radix UI primitives, Lucide React icons, shadcn/ui.
- **Styling**: Tailwind CSS, class-variance-authority.

## Backend Libraries
- **Express.js**: Web framework.
- **Drizzle ORM**: Type-safe database operations.
- **Cheerio**: Web scraping.
- **Passport**: Authentication middleware.

## Development Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Type safety.
- **ESBuild**: Server-side bundling.
- **Drizzle Kit**: Database migration and schema management.
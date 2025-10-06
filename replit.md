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

### CRM Management (Multi-Enterprise Workspace System)
- **Access**: Requires authentication with workspace-scoped role (`viewer`, `editor`, `admin`, or `enterprise_owner`).
- **Architecture**: Complete workspace isolation - each enterprise has its own isolated CRM workspace with strict data separation.
- **Workspace Context**: WorkspaceProvider manages current enterprise, user's enterprises list, and enterprise switching.
- **Authorization**: Three-layer security:
  1. Middleware: `requireEnterpriseRole()` validates user permissions for requested enterprise
  2. Routes: All `/api/crm/:enterpriseId/*` endpoints enforce enterprise-scoped access
  3. Storage: ALL database queries filter by `WHERE workspace_id = enterpriseId` for workspace-scoped tables
- **Frontend Routing**: All CRM pages use `/crm/:enterpriseId/*` pattern with enterprise ID in URL.
- **Enterprise Switcher**: Dropdown UI for switching between user's workspaces with role badges.
- **Access Guard**: EnterpriseAccessGuard component validates workspace access before rendering pages.
- **No Workspace State**: Welcoming UX for users without workspaces, guiding them to create or claim enterprises.
- **Layout**: Uses a standalone `CrmLayout` component with integrated workspace switcher.
- **Pages**: CRM pages are organized in `client/src/pages/crm/` and extract enterpriseId from URL params.
- **Query Keys**: All TanStack Query keys use array segments for proper cache invalidation:
  - Workspace enterprises: `["/api/crm", enterpriseId, "workspace", "enterprises"]`
  - People: `["/api/crm", enterpriseId, "workspace", "people"]`
  - Opportunities: `["/api/crm", enterpriseId, "workspace", "opportunities"]`
  - Tasks: `["/api/crm", enterpriseId, "workspace", "tasks"]`

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
- **Two-Layer Data Model**:
  - **Public Directory Layer**: `enterprises` table (globally visible, admin-editable)
  - **Workspace CRM Layer**: 4 workspace-scoped tables with strict isolation:
    - `crm_workspace_enterprises`: Tracking records linking workspaces to directory enterprises
    - `crm_workspace_people`: Contacts/relationships (scoped to workspace)
    - `crm_workspace_opportunities`: Deals/pipeline (scoped to workspace)
    - `crm_workspace_tasks`: Action items (scoped to workspace)
- **Schema**: Includes users, enterprises, workspace CRM entities, copilot context, and profile claim invitations.
- **Categories**: Enum-based categorization for enterprises.
- **Profile Claims/Invitations**: Token-based system with expiration and role upgrades.
- **External Data Integration**: JSONB fields (`external_source_ref`) store API data from Apollo, Google Maps, Foursquare with sync status tracking.

## Core Features

### Workspace Isolation & Enterprise Management
- **Multi-Enterprise Workspaces**: Each enterprise has isolated CRM workspace with complete data separation
- **Workspace Switching**: Seamless switching between enterprises via EnterpriseSwitcher dropdown
- **Enterprise Creation Flow**: Comprehensive onboarding for users without workspaces:
  - CreateEnterpriseDialog with helpful CRM Pro value propositions
  - Automatic workspace setup and navigation after creation
  - Integration with landing page and quick access from switcher
  - Tier-aware upgrade prompts for free users
  - Pre-filled user email and intuitive form design
- **Role-Based Access Control**: Hierarchical permissions (viewer < editor < admin < enterprise_owner)
- **Authorization Layers**: Middleware, route, and storage-level security enforcement
- **Enterprise Team Management**: Multi-user collaboration with role assignments via `enterpriseTeamMembers`

### CRM Features (Workspace-Scoped)
- **Workspace Enterprise Management**: 
  - Dual-mode creation: (1) Link existing directory enterprise to workspace, (2) Create new unclaimed enterprise
  - Each workspace maintains independent tracking records via `crm_workspace_enterprises`
  - Relationship stages (cold, warm, hot, prospect, active, partner, inactive, customer) tracked per-workspace
  - External data integration with JSONB storage for Apollo, Google Maps, Foursquare APIs
  - Sync status tracking (synced, pending, error, never_synced)
- **People Management**: Contact management, status tracking, relationship mapping (scoped to workspace via `crm_workspace_people`)
- **Opportunity Tracking**: Deal pipeline with stages, value, and AI lead scoring (scoped to workspace via `crm_workspace_opportunities`)
- **Task Management**: Assignment, tracking, and due dates (scoped to workspace via `crm_workspace_tasks`)
- **AI Copilot**: Lead scoring, intelligent suggestions, and automation (per-workspace context)
- **Bulk Import**: Web scraping for enterprise data (imports scoped to current workspace)
- **CSV Export**: Opportunities export with linked entity data
- **Custom Fields**: Extensible schema per workspace

### Directory & Discovery
- **Full Page Search**: Unified search across all public enterprises with URL state persistence
- **Murmurations Protocol**: Federated discovery integration for global directory
- **Profile Claiming System**: 
  - Dual-flow: token-based invitations and direct claiming
  - Email verification prevents unauthorized takeover
  - Plan limit enforcement with upgrade prompts
  - Automatic role upgrade to 'enterprise_owner' upon successful claim
- **Favorites System**: Users can favorite enterprises for quick access

### Platform Features
- **Onboarding System**: Tier-specific guided tours with progress tracking
- **Subscription & Tiers**: 4-tier pricing (Free, CRM Pro, Build Pro Bundle, Admin)
  - Stripe integration for payments
  - Feature gating based on subscription tier
  - Upgrade prompts throughout the application
- **Mobile Optimization**: Fully responsive design with card views for smaller screens

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
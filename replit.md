# Overview

This is a CRM (Customer Relationship Management) application focused on regenerative enterprises and sustainability projects. The system allows users to discover, track, and manage relationships with organizations working on land projects, capital sources, open source tools, and network organizers in the regenerative/sustainability space. It features AI-powered lead scoring, web scraping for bulk data import, and a comprehensive dashboard for managing enterprises, people, opportunities, and tasks.

# Recent Changes

## October 2025
- **Searchable Comboboxes in Opportunities**: Enhanced UX for enterprise and contact selection
  - Replaced basic Select dropdowns with searchable Combobox components (Popover + Command pattern)
  - Real-time search/filter by typing enterprise or contact names
  - Contact search includes enterprise affiliation for better context
  - Proper state management ensures popovers close immediately after selection
  - "No Enterprise" and "No Contact" options display correctly when null is selected
  - Significantly improved usability when dealing with large lists
- **CRM UI Refactoring**: Complete overhaul of CRM navigation for single source of truth
  - Created standalone CrmLayout component (removed PageLayout dependency)
  - Moved all CRM pages to `client/src/pages/crm/` folder for coherent organization
  - Removed duplicate navigation elements from individual pages
  - Each CRM page now renders only domain content (forms, tables, cards)
  - Navigation centralized in CrmLayout with CrmSidebar, CrmMobileSidebar, CrmBreadcrumbs
- **Documentation Routing**: Fixed all documentation routes using explicit route definitions
  - All 28 documentation pages now working correctly
  - Removed nested routing issues with DocsLayout
  - Documentation accessible at /docs with full sidebar navigation

## September 2025
- **Enhanced Navigation**: Added context badges (Directory/CRM indicators) and breadcrumbs for improved wayfinding
- **CSV Export**: Implemented CSV export for opportunities with linked entities (probability=0 handled correctly)
- **Enhanced Opportunity Views**: Opportunity detail views now show related enterprises and contacts with tooltips
- **AI Copilot Function Calling**: AI Copilot can now add enterprises to directory via chat using OpenAI function calling
- **Profile Claim Invitations**: Added invitation system with 30-day tokens and automatic role upgrade to enterprise_owner upon claiming
- **Comprehensive API Documentation**: Full API documentation at /docs covering all 18 enterprise endpoints plus authentication, people, opportunities, tasks, and search APIs with code examples
- **Accessibility Improvements**: Achieved WCAG AA compliant contrast (hero gradient darkened, secondary color adjusted)
- **Routing Fixes**: Fixed CRM routing with exact /crm + wildcard /crm/:rest* pattern for proper nested route handling

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Dual-Surface Architecture (Directory + CRM)
The application features a complete separation between public directory browsing and authenticated CRM management:

### Public Directory
- **Routes**: /, /enterprises, /directory/:category, /enterprises/:id, /search
- **Access**: No authentication required - accessible to all visitors
- **Purpose**: Public browsing of regenerative enterprises with category filtering
- **Features**: Full page search at /search, category filters, enterprise details, responsive cards
- **Components**: `client/src/pages/Enterprises.tsx` (pure public, no admin features), `client/src/pages/Search.tsx` (full page search with URL state persistence)

### CRM Management
- **Routes**: /crm, /crm/enterprises, /crm/people, /crm/opportunities, /crm/tasks, /crm/reports, /crm/copilot, /crm/bulk-import
- **Access**: Requires authentication with enterprise_owner or admin role
- **Purpose**: Full CRUD management of enterprises, contacts, and opportunities
- **Features**: Create/edit/delete operations, advanced filtering, data tables, analytics
- **Layout**: Standalone CrmLayout component with single source of truth navigation
  - `client/src/components/crm/CrmLayout.tsx` - Main CRM layout (no PageLayout dependency)
  - `client/src/components/crm/CrmSidebar.tsx` - Desktop navigation
  - `client/src/components/crm/CrmMobileSidebar.tsx` - Mobile menu drawer
  - `client/src/components/crm/CrmBreadcrumbs.tsx` - Navigation breadcrumbs
  - `client/src/config/crmNavigation.ts` - Central navigation configuration
- **Pages**: All CRM pages in `client/src/pages/crm/` folder render only domain content
- **Routing**: `client/src/pages/crm/CrmShell.tsx` handles route definitions with CrmLayout wrapper
- **API**: Separate `/api/crm/*` endpoints with role-based authorization

### API Architecture
- **Public APIs**: `GET /api/enterprises`, `GET /api/enterprises/:id` (no auth)
- **CRM APIs**: `POST/PUT/DELETE /api/crm/enterprises` (auth required, admin/enterprise_owner only)
- **Authorization**: `requireRole` middleware enforces role-based access control

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The application uses:
- **UI Framework**: Custom component library based on shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing with nested route support
- **Forms**: React Hook Form with Zod validation
- **Component Structure**: 
  - `components/shared/` - Reusable components (EnterpriseSummary, PageLayout, etc.)
  - `components/directory/` - Public directory components
  - `components/crm/` - CRM-specific admin components
  - Separate pages for public Directory and CRM management

## Backend Architecture
The backend uses Express.js with TypeScript in ESM format:
- **API Structure**: RESTful API with route handlers organized in `/server/routes.ts`
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **AI Integration**: OpenAI GPT-5 for lead scoring and intelligent suggestions
- **Web Scraping**: Cheerio-based scraping service for bulk enterprise data import

## Data Storage
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema including users, enterprises, people, opportunities, tasks, copilot context, and profile claim invitations
- **Categories**: Enum-based categorization for enterprises (land_projects, capital_sources, open_source_tools, network_organizers)
- **Profile Claims/Invitations**: Token-based claiming system with 30-day expiration and automatic role upgrades
- **CSV Export**: Full export functionality for opportunities with linked entity data (enterprises, contacts)

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation/update on authentication
- **Route Protection**: Middleware-based authentication checking for protected routes

## Core Features
- **Enterprise Management**: CRUD operations for regenerative organizations with categorization and verification
- **People Management**: Contact management with status tracking and relationship mapping
- **Opportunity Tracking**: Deal pipeline management with stages and value tracking
- **Task Management**: Task assignment and tracking with priority levels
- **AI Copilot**: Lead scoring, suggestions, and automated insights using OpenAI with function calling capabilities
- **Bulk Import**: Web scraping capabilities for importing enterprise data from external sources
- **Full Page Search**: Comprehensive search experience at /search with URL state persistence, category filters, and unified search across enterprises, people, opportunities, tasks, and documentation
- **CSV Export**: Export opportunities with complete linked entity data (enterprises, contacts, probability handling)
- **Profile Claim Invitations**: Token-based invitation workflow with automatic role upgrade to enterprise_owner upon claiming
- **Comprehensive API Documentation**: Full documentation at /docs with 18+ enterprise endpoints, authentication guide, and code examples in multiple languages

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development environment and authentication provider

## AI & ML Services
- **OpenAI API**: GPT-5 model for lead scoring, enterprise data extraction, and intelligent suggestions

## Frontend Libraries
- **React Ecosystem**: React 18, React Query, React Hook Form, React Router (Wouter)
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, class-variance-authority for component variants

## Backend Libraries
- **Express.js**: Web framework with TypeScript support
- **Drizzle ORM**: Type-safe database operations
- **Cheerio**: Server-side HTML parsing for web scraping
- **Passport**: Authentication middleware for OpenID Connect

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Server-side bundling for production
- **Drizzle Kit**: Database migration and schema management
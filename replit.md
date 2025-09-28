# Overview

This is a CRM (Customer Relationship Management) application focused on regenerative enterprises and sustainability projects. The system allows users to discover, track, and manage relationships with organizations working on land projects, capital sources, open source tools, and network organizers in the regenerative/sustainability space. It features AI-powered lead scoring, web scraping for bulk data import, and a comprehensive dashboard for managing enterprises, people, opportunities, and tasks.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The application uses:
- **UI Framework**: Custom component library based on shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Component Structure**: Modular component architecture with separate pages for Dashboard, Enterprises, People, Opportunities, Tasks, Copilot (AI features), and Bulk Import

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
- **Schema**: Comprehensive schema including users, enterprises, people, opportunities, tasks, and copilot context
- **Categories**: Enum-based categorization for enterprises (land_projects, capital_sources, open_source_tools, network_organizers)

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
- **AI Copilot**: Lead scoring, suggestions, and automated insights using OpenAI
- **Bulk Import**: Web scraping capabilities for importing enterprise data from external sources

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
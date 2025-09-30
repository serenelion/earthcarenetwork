# Earth Care Network - Regenerative Enterprise CRM & Directory

Connect, discover, and manage relationships with regenerative enterprises building a sustainable future.

## Overview

Earth Care Network is an open source platform designed for discovering and managing relationships with regenerative enterprises across land restoration, sustainable capital, open source tools, and network organizing. The platform features a dual-surface architecture combining a public enterprise directory with a powerful authenticated CRM system.

**Mission**: Empower the regenerative economy by making it easy to discover, connect with, and manage relationships with organizations working on sustainability and land restoration projects.

**Architecture**: 
- **Public Directory**: Browse regenerative enterprises by category without authentication
- **CRM System**: Complete relationship management suite for authenticated users with role-based access

## Key Features

🌍 **Public Regenerative Enterprise Directory** - Browse and search organizations by category with advanced filtering

🤝 **Complete CRM Suite** - Manage relationships, opportunities, contacts, and tasks with full CRUD operations

🤖 **AI-Powered Intelligence** - Lead scoring, intelligent suggestions, and copilot assistant with OpenAI function calling

📊 **CSV Export** - Export opportunities with complete linked entity data (enterprises, contacts, probability handling)

📨 **Profile Claim Invitations** - Token-based invitation system with 30-day expiration and automatic role upgrades

📚 **Comprehensive API Documentation** - Full API reference at `/docs` with code examples in multiple languages

🔐 **Role-Based Access Control** - Four user roles: visitor, member, enterprise_owner, admin

🎨 **WCAG AA Accessible Design** - Fully accessible interface with compliant color contrast

📱 **Mobile-First Responsive Design** - Optimized experience across all device sizes

🔍 **Advanced Full-Page Search** - Unified search at `/search` with URL state persistence and category filters

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and builds
- Wouter for lightweight routing
- TanStack Query for server state management
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling

**Backend:**
- Express.js with TypeScript (ESM)
- PostgreSQL database
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL hosting

**AI & Authentication:**
- OpenAI GPT-5 integration for AI features
- Replit Auth with OpenID Connect
- Express sessions with PostgreSQL storage

**Additional Tools:**
- Cheerio for web scraping
- Zod for validation
- React Hook Form for form management

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (provided automatically on Replit)
- OpenAI API key for AI features

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## Environment Variables

The following environment variables are required:

- `DATABASE_URL` - PostgreSQL connection string (auto-configured on Replit)
- `OPENAI_API_KEY` - OpenAI API key for AI copilot features
- `ISSUER_URL` - Replit Auth OIDC issuer URL (auto-configured on Replit)
- `SESSION_SECRET` - Secret key for session encryption (auto-generated on Replit)

Optional variables:
- `NODE_ENV` - Set to `production` or `development`
- `PORT` - Server port (defaults to 5000)

## Project Structure

```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   │   ├── crm/     # CRM-specific components
│   │   │   ├── directory/ # Public directory components
│   │   │   ├── docs/    # API documentation components
│   │   │   ├── shared/  # Shared components
│   │   │   └── ui/      # shadcn/ui base components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Page components
│   │       ├── crm/     # CRM pages
│   │       └── docs/    # Documentation pages
├── server/              # Express backend API
│   ├── db.ts           # Database connection
│   ├── routes.ts       # API route handlers
│   ├── storage.ts      # Data access layer
│   ├── openai.ts       # OpenAI integration
│   └── replitAuth.ts   # Authentication setup
├── shared/              # Shared types and schemas
│   └── schema.ts       # Drizzle database schema
└── package.json        # Dependencies and scripts
```

## API Documentation

Full API documentation is available at `/docs` when running the application. The documentation includes:

- **Authentication Guide** - How to authenticate API requests
- **Enterprise Endpoints** - 18+ endpoints for enterprise management
- **People API** - Contact and relationship management
- **Opportunities API** - Deal pipeline and opportunity tracking
- **Tasks API** - Task assignment and management
- **Search API** - Unified search across all entities
- **Code Examples** - Sample code in JavaScript, Python, and cURL

### Quick API Example

```javascript
// Fetch all enterprises
const response = await fetch('http://localhost:5000/api/enterprises');
const enterprises = await response.json();

// Get a specific enterprise
const enterprise = await fetch('http://localhost:5000/api/enterprises/123');
const data = await enterprise.json();
```

## Contributing

We welcome contributions from the community! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the existing code conventions
4. **Test your changes** thoroughly
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Conventions

- Use TypeScript for type safety
- Follow the existing component structure
- Write descriptive commit messages
- Add comments for complex logic
- Ensure accessibility standards are met
- Test across different screen sizes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: Visit `/docs` in the running application for comprehensive API documentation
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our community discussions (link to be added)

## Acknowledgments

Built with modern web technologies and powered by:
- [Replit](https://replit.com) for hosting and authentication
- [OpenAI](https://openai.com) for AI capabilities
- [Neon](https://neon.tech) for serverless PostgreSQL
- [shadcn/ui](https://ui.shadcn.com) for beautiful components

---

Made with 💚 for the regenerative economy

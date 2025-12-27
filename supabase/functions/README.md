# Supabase Edge Function inventory

This folder mirrors the Replit-hosted API surface using Supabase Edge Functions. Each function requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables and expects a `Bearer` token from the client in the `Authorization` header.

| Replit endpoint | Supabase function | Purpose |
| --- | --- | --- |
| `GET /api/auth/user` | `auth-user` | Return the authenticated user's profile record. |
| `GET /api/enterprises` | `enterprises` | List enterprises with optional category/search filters. |
| `GET/POST/DELETE /api/favorites` and `DELETE /api/favorites/:enterpriseId` | `favorites` | Read, add, and remove user favorites. |
| `GET /api/enterprises/:id/favorite-status` | `favorite-status` | Check whether the current user has favorited a specific enterprise. |
| `GET /api/favorites/stats` | `favorites-stats` | Aggregate favorite counts for the current user. |

Additional Replit endpoints should be migrated following the same pattern (JWT verification via `getAuthenticatedClient` and table access through the Supabase client).

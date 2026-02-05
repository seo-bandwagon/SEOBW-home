# CLAUDE.md - Project Guidelines for seobandwagon.dev

## Project Overview

SEO Bandwagon - A full-stack SEO intelligence platform providing unified search for keyword research, domain analysis, business lookup, and phone number searches via the DataForSEO API.

## Tech Stack

- **Framework**: Next.js 14.2.21 (React 18.3.1)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **Database**: PostgreSQL (Supabase) via Drizzle ORM 0.38.3
- **Authentication**: NextAuth 5.0.0-beta.25 (Google & GitHub OAuth)
- **Caching**: Redis 4.7.0 (optional, graceful fallback)
- **SEO Data**: DataForSEO API
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React 0.469.0
- **Deployment**: Netlify with @netlify/plugin-nextjs

## Project Structure

```
/seo-search-box/src/
├── app/                          # Next.js 13+ app directory
│   ├── api/                      # API routes
│   │   ├── search/route.ts       # Main search endpoint (566 lines)
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── history/route.ts      # Search history
│   │   ├── alerts/route.ts       # Alert management
│   │   ├── saved-searches/       # Saved search CRUD
│   │   └── analytics/route.ts    # Usage analytics
│   ├── layout.tsx                # Root layout with SessionProvider
│   ├── page.tsx                  # Home page (hero + search box)
│   ├── auth/signin/page.tsx      # OAuth login page
│   ├── dashboard/page.tsx        # Protected user dashboard
│   ├── results/page.tsx          # Search results page
│   └── history/page.tsx          # Search history page
├── components/
│   ├── charts/                   # Recharts visualizations
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── LighthouseGauge.tsx
│   ├── search/
│   │   ├── SearchBox.tsx         # Main unified search input
│   │   └── RecentSearches.tsx    # Quick access to recent queries
│   ├── results/
│   │   ├── ResultsPanel.tsx      # Server component router
│   │   ├── KeywordResults.tsx    # Keyword research results
│   │   ├── DomainResults.tsx     # Domain/SEO results
│   │   ├── BusinessResults.tsx   # Business info results
│   │   ├── PhoneResults.tsx      # Phone lookup results
│   │   └── ResultsSkeleton.tsx   # Loading skeletons
│   ├── dashboard/
│   │   └── DashboardClient.tsx   # User dashboard
│   └── common/
│       └── Navbar.tsx            # Navigation bar
├── lib/
│   ├── api/dataforseo/           # DataForSEO API client
│   │   ├── client.ts             # Base HTTP client with auth
│   │   ├── keywords.ts           # Keyword research endpoints
│   │   ├── backlinks.ts          # Backlink analysis
│   │   ├── labs.ts               # DataForSEO Labs API
│   │   ├── serp.ts               # SERP & Maps endpoints
│   │   ├── onpage.ts             # On-page analysis (Lighthouse)
│   │   ├── business.ts           # Google My Business, reviews
│   │   ├── content.ts            # Content analysis
│   │   ├── whois.ts              # Domain WHOIS info
│   │   └── index.ts              # Unified API exports
│   ├── db/
│   │   ├── client.ts             # Drizzle ORM database client
│   │   ├── schema.ts             # Complete database schema (~400 lines)
│   │   └── queries.ts            # Database query functions
│   ├── parsers/
│   │   └── inputParser.ts        # Smart input detection (283 lines)
│   ├── cache.ts                  # Redis caching layer (233 lines)
│   ├── auth.ts                   # NextAuth configuration
│   └── utils.ts                  # Helper utilities
└── types/
    └── search.ts                 # TypeScript interfaces for results
```

## Core Functionality

### Input Types (Auto-Detected)
1. **Keyword** → Search volume, CPC (low/high/avg), competition, trends, related keywords
2. **URL/Domain** → Backlinks, domain rank, Lighthouse audit, ranked keywords, WHOIS
3. **Business** → Google My Business, Maps listings, reviews, ratings
4. **Phone** → Business lookup by phone number

### Search Flow
1. User enters query → InputParser detects type with confidence scoring
2. Query cached and sent to `/api/search`
3. DataForSEO API called in parallel (Promise.allSettled)
4. Results stored in PostgreSQL if authenticated
5. Type-specific component renders results

## Database Schema (13 Tables)

**Auth**: users, accounts, sessions, verification_tokens
**Search**: searches, keyword_data, related_keywords, domain_data, ranked_keywords, page_data, business_data
**History**: serp_history, domain_rank_history
**User Features**: saved_searches, alerts

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint checks

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Apply migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
```

## Architecture

### Production (Hostinger VPS)

Two PM2 processes behind Nginx:

| Service | Domain | Port | Path on VPS |
|---------|--------|------|-------------|
| **Frontend** (Next.js) | `seobandwagon.dev` | 3001 | `/var/www/SEOBW-home/seo-search-box/` |
| **MCP Server** (Express) | `api.seobandwagon.dev` | 3000 | `/var/www/seobandwagon-mcp/` |

- Nginx configs: `seobandwagon-mcp/nginx/`
- PM2 config: `seobandwagon-mcp/ecosystem.config.cjs`
- Deploy script: `seobandwagon-mcp/deploy.sh`
- SSL: Let's Encrypt via Certbot

### Database

**Supabase** (project ref: `rraubczrlpaushskzpfc`, region: us-west-2)
- Direct host is **IPv6-only** (`db.rraubczrlpaushskzpfc.supabase.co`) — won't work on most hosts
- Use the **connection pooler** (IPv4): `aws-0-us-west-2.pooler.supabase.com`
- Session mode: port 5432 | Transaction mode: port 6543
- Username format for pooler: `postgres.rraubczrlpaushskzpfc`

### API Endpoints

**Frontend** (`seobandwagon.dev`):
- `/api/auth/*` — NextAuth (Google OAuth login)
- `/api/search` — Main search endpoint
- `/api/history`, `/api/analytics`, `/api/alerts`, `/api/saved-searches`

**MCP Server** (`api.seobandwagon.dev`):
- `/health` — Health check
- `/auth/google?user_id=xxx` — GSC/GA4 OAuth flow
- `/auth/google/callback` — OAuth callback
- `/auth/status?user_id=xxx` — Token status
- MCP SSE endpoints for Claude Code integration

### Google Cloud OAuth

Two separate OAuth flows:
1. **NextAuth** (frontend login): Callback at `https://seobandwagon.dev/api/auth/callback/google`
2. **GSC/GA4 tokens** (MCP server): Callback at `https://api.seobandwagon.dev/auth/google/callback`

Both use the same Google Cloud OAuth client.

## Environment Variables

### Frontend (.env at seo-search-box/)

**Required:**
```
DATABASE_URL              # Supabase PostgreSQL (use pooler URL, not direct)
AUTH_SECRET               # NextAuth secret (openssl rand -base64 32)
AUTH_URL                  # https://seobandwagon.dev
AUTH_GOOGLE_ID            # Google OAuth Client ID
AUTH_GOOGLE_SECRET        # Google OAuth Client Secret
DATAFORSEO_LOGIN          # DataForSEO API login
DATAFORSEO_PASSWORD       # DataForSEO API password
```

**Optional:**
```
AUTH_GITHUB_ID            # GitHub OAuth App ID
AUTH_GITHUB_SECRET        # GitHub OAuth App Secret
REDIS_URL                 # Redis connection for caching
MCP_SERVER_URL            # https://api.seobandwagon.dev
```

### MCP Server (.env at seobandwagon-mcp/)

```
PORT                      # 3000
NODE_ENV                  # production
GOOGLE_CLIENT_ID          # Same Google OAuth Client ID
GOOGLE_CLIENT_SECRET      # Same Google OAuth Client Secret
GOOGLE_REDIRECT_URI       # https://api.seobandwagon.dev/auth/google/callback
SUPABASE_URL              # https://rraubczrlpaushskzpfc.supabase.co
SUPABASE_SERVICE_KEY      # Supabase service role key
```

## Caching Strategy (Redis TTLs)

- Keyword data: 24 hours
- Domain data: 12 hours
- Lighthouse: 7 days
- WHOIS: 30 days
- Graceful fallback if Redis unavailable

## Key Patterns

- **Server Components**: Data fetching in server components, `"use client"` for interactivity
- **Parallel API calls**: `Promise.allSettled()` for resilient multi-source fetching
- **Path alias**: `@/*` → `./src/*`
- **Error handling**: Graceful degradation when external services unavailable
- **Dark theme**: Slate color palette with CSS variables

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/search` | POST | No | Execute search |
| `/api/history` | GET | Yes | Get search history |
| `/api/saved-searches` | GET/POST/DELETE | Yes | Manage bookmarks |
| `/api/alerts` | GET/POST/PUT/DELETE | Yes | Manage alerts |
| `/api/analytics` | GET | Yes | Usage analytics |

## Important Files

- `src/app/api/search/route.ts` - Main search logic (566 lines)
- `src/lib/parsers/inputParser.ts` - Input type detection (283 lines)
- `src/lib/db/schema.ts` - Database schema (~400 lines)
- `src/lib/cache.ts` - Redis caching (233 lines)
- `src/components/search/SearchBox.tsx` - Main search component

## Notes for Claude

- Always use `Promise.allSettled()` for parallel API calls to external services
- Check for existing caching patterns in `src/lib/cache.ts` before adding new cached data
- Follow the existing component structure (server components for data, client for interaction)
- Database changes require running `npm run db:push` after modifying schema
- Input parser uses regex with confidence scoring - maintain this pattern for new input types
- Respect the existing dark theme with slate colors

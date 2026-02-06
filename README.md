# SEO Bandwagon

SEO tools and services without the corporate nonsense. Built in Washington State since 2010.

## Architecture

This repo contains two sites:

| Site | Production | Development | Description |
|------|------------|-------------|-------------|
| **Marketing Site** | `seobandwagon.com` | — | Static HTML landing page (`index.html`) |
| **SEO Platform** | `seobandwagon.com` | `seobandwagon.dev` | Next.js app with search tools, dashboard, and API (`seo-search-box/`) |

A separate repo ([seobandwagon-mcp](https://github.com/keepkalm/seobandwagon-mcp)) provides the MCP server at `api.seobandwagon.com` (prod) / `api.seobandwagon.dev` (dev).

## Tech Stack

**Marketing Site:**
- Pure HTML/CSS/JS
- Fonts: Bebas Neue, Space Grotesk, Space Mono

**SEO Platform (`seo-search-box/`):**
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- DataForSEO API for SEO data
- Recharts for visualizations

## Local Development

**Marketing site:**
```bash
# Just open the file
open index.html
```

**SEO Platform:**
```bash
cd seo-search-box
npm install
cp .env.example .env  # Add your credentials
npm run dev           # http://localhost:3000
```

## Environment Variables (seo-search-box)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# DataForSEO (server-side only)
DATAFORSEO_LOGIN=xxx
DATAFORSEO_PASSWORD=xxx
```

## Deployment (Hostinger VPS)

Both sites run on Hostinger via PM2 behind Nginx:

| Service | Port | PM2 Name |
|---------|------|----------|
| SEO Platform | 3001 | `seobandwagon-frontend` |
| MCP Server | 3000 | `seobandwagon-mcp` |

**Deploy process:**
```bash
# SSH into VPS
cd /var/www/SEOBW-home && git pull

# Rebuild and restart
cd seo-search-box && npm run build
pm2 restart seobandwagon-frontend
```

**Nginx configs:** Located in `seobandwagon-mcp/nginx/`

## Contact Form

The site includes a lead capture form at `/#contact`. Submissions are handled by:
- **API Route:** `/api/contact` (POST)
- **Storage:** JSON file on server (can be upgraded to Supabase)
- **Fields:** Name, Email, Website URL, Phone (optional), Service Type, Message

## Project Structure

```
SEOBW-home/
├── index.html              # Marketing landing page
├── 404.html                # Error page
├── seo-search-box/         # Next.js SEO platform
│   ├── src/
│   │   ├── app/            # Pages and API routes
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities, DB, API clients
│   ├── public/
│   │   └── llms.txt        # AI crawler optimization file
│   └── package.json
└── README.md
```

## Brand

| Element | Value |
|---------|-------|
| Pink | `#F53796` |
| Navy | `#000022` |
| White | `#F5F5F5` |
| Heading Font | Bebas Neue |
| Body Font | Space Grotesk |
| Mono Font | Space Mono |

## Related Repos

- **[seobandwagon-mcp](https://github.com/keepkalm/seobandwagon-mcp)** — MCP server for GSC/GA4 AI agent integration

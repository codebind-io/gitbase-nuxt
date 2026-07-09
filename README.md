# gitbase

**Git-based CMS for Nuxt.** Edit content in a visual console, commit to GitHub, serve from the Cloudflare edge.

[gitbase.cloud](https://gitbase.cloud/) · [Documentation](https://gitbase.cloud/doc/getting-started/introduction)

This repository is the open-source starter: a production-ready Nuxt site with the gitbase admin console, Nuxt Content, and Cloudflare Pages deployment baked in. Clone it, connect your repo and secrets, and ship.

## Features

- **Git-native** — Every CMS save becomes a GitHub commit. Content is versioned alongside your code.
- **Console CMS** — Manage pages, posts, products, media, and site settings from `/admin`.
- **No database** — Content lives in Markdown and YAML under `content/`, read by [Nuxt Content](https://content.nuxt.com/).
- **Edge delivery** — Static output prerendered at build time and cached globally on Cloudflare CDN.
- **R2 media** — Upload and serve images from Cloudflare R2, wired into the CMS.
- **AI agent** — Built-in no-code workflows in the admin console.
- **Auto deploy** — Publish triggers a Cloudflare Pages rebuild via deploy hook.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | [Nuxt 4](https://nuxt.com/) + [Nitro](https://nitro.unjs.io/) |
| UI | [Nuxt UI 4](https://ui.nuxt.com/) + Tailwind CSS 4 |
| Content | [Nuxt Content 3](https://content.nuxt.com/) |
| CMS | [gitbase](https://gitbase.cloud/) (Sveltia CMS–based console) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) |
| Media | Cloudflare R2 (optional) |

## Quick start

```bash
git clone git@github.com:codebind-io/gitbase-nuxt.git
cd gitbase-nuxt
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and [http://localhost:3000/admin](http://localhost:3000/admin) for the CMS.

## Configuration

### 1. Environment variables

Copy [`.env.example`](.env.example) to `.env` and fill in the `GITBASE_*` values:

| Variable | Purpose |
|----------|---------|
| `GITBASE_CODEBASE_URL` | gitbase admin script URL (default provided) |
| `GITBASE_SITE_URL` | Public site URL (e.g. `http://localhost:3000` locally) |
| `GITBASE_GITHUB_REPO` | `owner/repo` for content commits |
| `GITBASE_GITHUB_PAT` | GitHub personal access token (repo scope) |
| `GITBASE_GOOGLE_CLIENT_ID` | Google OAuth client ID for admin login |
| `GITBASE_ALLOWED_EMAILS` | Comma-separated emails allowed to sign in |
| `GITBASE_DEPLOY_HOOK_URL` | Cloudflare Pages deploy hook (triggers rebuild on publish) |
| `GITBASE_R2_*` | Cloudflare R2 credentials for media uploads (optional) |

For Cloudflare Pages, copy `.env.example` to `.env.cloudflare` and upload secrets:

```bash
npx wrangler pages secret bulk .env.cloudflare --project-name YOUR_PROJECT
```

### 2. CMS collections

Edit [`public/admin/gitbase.config.yml`](public/admin/gitbase.config.yml) to match your content model. This file defines collections (pages, posts, products, homepage blocks) and singletons (settings, categories). It is served at `/admin/config.yml` with env values merged at runtime.

In local dev, config edits apply after a CMS refresh — no server restart needed. Production requires a redeploy.

## Content flow

1. **Save** in the CMS → GitHub commit with `[skip ci]` (no deploy).
2. **Site** reads from `content/` via Nuxt Content (prerendered at build).
3. **Publish** in the CMS → calls `GITBASE_DEPLOY_HOOK_URL` → Cloudflare rebuilds and deploys.

## Deploy

The project is preset for **Cloudflare Pages** (`nitro.preset: cloudflare_pages`). Connect your GitHub repo in the Cloudflare dashboard, set all `GITBASE_*` secrets, and deploy.

```bash
pnpm build   # outputs to dist/
```

## Project structure

```
├── app/                    # Nuxt app (pages, components, composables)
├── content/                # Markdown & YAML content (Git-managed)
│   ├── blocks/             # Homepage modules (hero, carousel, etc.)
│   ├── pages/              # Static pages
│   ├── posts/              # Blog posts
│   └── products/           # Product catalog
├── public/admin/           # CMS config & assets
│   └── gitbase.config.yml  # Collection schema
├── server/
│   ├── routes/admin/       # Admin catch-all route
│   └── utils/              # Auth, publish, env helpers
└── nuxt.config.ts          # Prerender routes, Cloudflare preset
```

## Key integration files

| File | Role |
|------|------|
| [`public/admin/gitbase.config.yml`](public/admin/gitbase.config.yml) | CMS collections and fields (no secrets) |
| [`server/utils/env.ts`](server/utils/env.ts) | Reads `GITBASE_*` environment variables |
| [`server/utils/gitbase.ts`](server/utils/gitbase.ts) | Admin routes, Google auth, publish hook |
| [`server/routes/admin/[...slug].ts`](server/routes/admin/[...slug].ts) | Catch-all `/admin/*` handler |
| [`content.config.ts`](content.config.ts) | Nuxt Content schemas (must match CMS fields) |
| [`.env.example`](.env.example) | Environment variable reference |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm dev:c` | Clean cache and start dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |

## License

[MIT](LICENSE)

---

Made by [codebind.io](https://codebind.io)

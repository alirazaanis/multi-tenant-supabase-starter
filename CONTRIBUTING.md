# Contributing

Contributions to **Multi-Tenant Supabase Starter** are welcome — issues and pull requests.

## Local environment

- Node.js 22 (see `.nvmrc`)
- Supabase credentials in `.env.local` (from `.env.example`)
- Schema in `supabase/migrations/001_multitenant_auth.sql` applied via Supabase SQL Editor
- Dependencies via `npm install`; dev server via `npm run dev`

## Before a pull request

```bash
npm test
npm run lint
npm run build
npm run test:e2e -- e2e/smoke.spec.ts
```

Changes should stay focused and match existing naming, file layout, and TypeScript style.

## Pull requests

The PR template includes a test plan. Secrets and local env files must not be committed.

## Bug reports

The [bug report issue template](https://github.com/alirazaanis/multi-tenant-supabase-starter/issues/new?template=bug_report.yml) is the preferred channel.

Security issues are covered in [SECURITY.md](SECURITY.md).

## Maintainer notes (GitHub settings)

Recommended repository settings:

- **Topics:** `supabase`, `multi-tenant`, `nextjs`, `authentication`, `starter`
- **Dependabot alerts** and **secret scanning** enabled (default on public repos)

### Branch protection (`main`)

Rules live on GitHub (not enforced by files in this repo). The intended configuration is versioned in [`.github/branch-protection.json`](.github/branch-protection.json).

After creating the repo or changing CI job names, apply with:

```bash
gh api repos/alirazaanis/multi-tenant-supabase-starter/branches/main/protection \
  -X PUT --input .github/branch-protection.json
```

Or:

```bash
bash .github/scripts/apply-branch-protection.sh
```

Current rules: required checks `unit` and `e2e-smoke`; force push and branch deletion disabled.

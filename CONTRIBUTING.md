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

### Ruleset for `main`

Branch rules live on GitHub under **Settings → Rules → Rulesets** (not in-repo enforcement). The intended configuration is versioned in [`.github/ruleset-main.json`](.github/ruleset-main.json).

After creating the repo or changing CI job names, apply with:

```bash
gh api repos/alirazaanis/multi-tenant-supabase-starter/rulesets -X POST \
  --input .github/ruleset-main.json
```

Or (creates or updates by name):

```bash
bash .github/scripts/apply-ruleset.sh
```

Current rules on `main`:

- Required status checks: `unit`, `e2e-smoke` (strict; not enforced on branch creation)
- Force push blocked (`non_fast_forward`)
- Branch deletion blocked

If legacy **branch protection** still exists under **Settings → Branches**, remove it so only the ruleset applies:

```bash
gh api repos/alirazaanis/multi-tenant-supabase-starter/branches/main/protection -X DELETE
```

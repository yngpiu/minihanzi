# minihanzi — AGENTS.md

## Package manager
- Use **pnpm** (v9+). Never npm or yarn.

## Key commands
```sh
pnpm dev              # dev server on port 3000
pnpm build            # production build → dist/
pnpm test             # vitest run (no test files exist yet)
pnpm lint             # biome lint
pnpm format           # biome format
pnpm check            # biome check (lint + format + organize imports)
pnpm generate-routes  # regenerate src/routeTree.gen.ts
```

## Important constraints
- **`src/routeTree.gen.ts` is auto-generated** by `pnpm generate-routes`. Never edit manually. After adding/modifying files in `src/routes/`, run `pnpm generate-routes`. Excluded from Biome. VSCode marks it readonly + excluded from search/watcher.
- **Biome replaces ESLint + Prettier.** No ESLint or Prettier config exists. Indent with tabs, JS uses double quotes. `src/styles.css` also excluded from Biome. Biome runs organize-imports on `pnpm check`.
- **`verbatimModuleSyntax: true`** in tsconfig — use `import type` for type-only imports.
- **Path aliases**: both `@/*` and `#/*` map to `./src/*`.
- **Tailwind CSS v4** — uses CSS-first config (`@import "tailwindcss"` in `src/styles.css`), **not** `tailwind.config.js`. The `components.json` reference to `tailwind.config.js` is stale scaffold noise.
- **`.npmrc`** restricts postinstall scripts to only `esbuild` and `lightningcss`. Adding new build deps may require updating this file.
- **No SSR.** Despite the TanStack Start scaffold, this is a client-side SPA. No `entry-server.tsx`, no Vinxi config.
- **`.env`** (tracked) contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These are publishable/anon keys, not secrets.
- **shadcn/ui** (Radix Nova style). Add components via `pnpm dlx shadcn@latest add <component>`. Config in `components.json`.

## Key dependencies & conventions

| Package | Role |
|---|---|
| `@tanstack/react-router` + `@tanstack/router-plugin` | File-based routing; use `createFileRoute()` in route files, `createRootRoute()` in `__root.tsx` |
| `@tanstack/react-query` | Server-state fetching/caching (not yet wired but available) |
| `@tanstack/react-form` | Form state management (not yet wired) |
| `@tanstack/react-table` | Table/DataGrid (not yet wired) |
| `radix-ui` | All Radix UI primitives in a single package (v1.6); use `Slot.Root` for `asChild` pattern |
| `class-variance-authority` (cva) | Component variant definitions (see `button.tsx` for pattern) |
| `@supabase/supabase-js` | Supabase client — `src/lib/supabase/client.ts` reads `VITE_SUPABASE_*` env vars |
| `clsx` + `tailwind-merge` | Class merging via `cn()` utility in `src/lib/utils.ts` |
| `lucide-react` | Icons |
| `@fontsource-variable/inter` | Inter font (variable weight), imported in `styles.css` |
| `tw-animate-css` | Tailwind CSS animation utilities |

- **Router type registration**: `src/router.tsx` augments `@tanstack/react-router`'s `Register` interface for type-safe router. If you add route params or custom context, extend the registration accordingly.
- **TanStack Devtools** mounted in `__root.tsx` (bottom-right panel) — visible in dev, stripped in production builds. Includes Router Devtools Panel.

## Skills config
- **`skills-lock.json`** locks 3 installed skills: `shadcn`, `supabase`, `supabase-postgres-best-practices`. Skill SKILL.md files live in `.agents/skills/<name>/` but are gitignored (resolved at runtime by OpenCode).
- **`.agents/git-commit/SKILL.md`** (tracked) — agent skill for conventional commits in Vietnamese. Types: feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert. Beschreibung in Vietnamese. Safety protocol: no force push, no hook skip, no config change.

## Architecture notes
- Entrypoint: `src/main.tsx` — creates TanStack Router with `defaultPreload: 'intent'` + `scrollRestoration: true`, renders `<RouterProvider>` into `#app`.
- Routes: file-based under `src/routes/`. Root layout at `src/routes/__root.tsx` with `<Outlet />`.
- `src/router.tsx` exports `getRouter()` factory (for tests or SSR usage).
- Supabase client at `src/lib/supabase/client.ts`.
- Utility `cn()` at `src/lib/utils.ts`.
- UI components at `src/components/ui/` (currently only `button.tsx`). Add via shadcn CLI.
- No test files exist yet. Vitest + jsdom + testing-library are available as devDeps. Add `vitest.config.ts` if non-default setup is needed.

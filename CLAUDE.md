# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the **RustDesk web console** — a React admin panel that talks to the Go `rustdesk-api` backend. It is a sibling to `rustdesk-api-web/` (the older Vue admin) and is being rewritten here in React. The parent workspace CLAUDE.md (`/home/user/rustdesk/CLAUDE.md`) still labels this directory as a "stub"; that is out of date.

## Commands

```bash
pnpm install              # Install dependencies (pnpm, see pnpm-lock.yaml)
pnpm dev                  # Vite dev server on 0.0.0.0, proxies /api → localhost:21114
pnpm build                # tsc -b (project references) then vite build
pnpm lint                 # ESLint (flat config, TS + react-hooks + prettier)
pnpm preview              # Serve dist/ locally
```

There is **no test runner** configured. Do not add one without asking.

The dev server requires the Go `rustdesk-api` backend running on `:21114` (see `vite.config.ts` proxy). No separate `.env` is required in dev — `VITE_API_BASE_URL` is empty so requests go through the proxy.

## Stack

- **React 19** + **TypeScript ~6.0** + **Vite 8**
- **React Router 7** (`react-router`, not `react-router-dom`) with lazy-loaded pages
- **TanStack Query** for all server state; **TanStack Table** for data grids
- **Zustand** (with `persist` + `devtools`) for client state (`auth`, `theme`)
- **react-hook-form** + **zod** via `@hookform/resolvers/standard-schema` (use `standardSchemaResolver`, not the old `zodResolver`)
- **shadcn/ui** (`style: base-nova`) backed by **`@base-ui/react`** — **not Radix**. See "UI conventions" below.
- **Tailwind CSS 4** via `@tailwindcss/vite` (no `tailwind.config.*` — config lives in `src/index.css`)
- **i18next** with `en` + `zh` in `src/locales/`; all user-visible strings must go through `t()`
- **axios** wrapped in `src/lib/api.ts`
- **sonner** for toasts, **lucide-react** for icons

Path alias: `@/*` → `src/*` (wired in both `tsconfig.app.json` and `vite.config.ts`).

Heavy deps are pre-bundled in `vite.config.ts` `optimizeDeps.include` — add new heavy deps there to keep dev startup fast.

## Architecture

### API layer (`src/lib/api.ts` + `src/services/*.service.ts`)

The backend returns an envelope: `{ code, message, data }`. The axios response interceptor:

1. On `code === 0`, returns `data` directly — so service functions get the unwrapped payload.
2. On `code === 403`, distinguishes **auth failure** (`message` missing or contains `NeedLogin`) from **permission denial** (e.g. `NoAccess`). Only auth failure clears storage and redirects to `/login`; permission errors bubble as regular rejected promises so the UI can show them inline. Preserve this distinction when touching the interceptor.
3. Token is read from `localStorage['auth-storage']` (the zustand `persist` key) and sent as the `api-token` header — **not** `Authorization: Bearer`.

Services are one file per resource under `src/services/`, named `<resource>.service.ts`. They import `apiGet` / `apiPost` from `@/lib/api` and use the typed `PaginatedData<T>` from `@/types/api`. Admin endpoints live under `/api/admin/...`; the "my" pages (self-service) live under different paths — follow existing services as the source of truth.

### Auth & routing (`src/stores/auth.ts`, `src/router.tsx`)

- `useAuthStore` persists `{ user, token, isAdmin }` to `localStorage['auth-storage']`.
- **Admin detection is derived, not stored by the backend**: `isAdmin = res.route_names?.includes('*')`. Do not look for an `is_admin` field on the login response.
- `ProtectedRoute` in `router.tsx` only checks for a token; per-route admin gating happens inside pages (via `isAdmin` from the store) or implicitly by backend permission errors.
- All pages are `React.lazy`-imported with a shared `SuspenseWrapper`.

### Pages & layout

- `src/pages/` — one file per route, plus subdirs for grouped routes (`logs/`, `settings/`, `my/`).
- `src/components/layout/` — `AppLayout` (sidebar + header + `<Outlet/>`), `AppSidebar`, `AppHeader`.
- `src/components/data-table/` — shared TanStack Table wrappers (`DataTable`, `DataTablePagination`, `DataTableToolbar`); every list page should reuse these instead of hand-rolling a table.
- `src/components/ui/` — shadcn primitives generated via the shadcn CLI (`components.json` → `base-nova` style, `neutral` base color, `@/components/ui` alias). Regenerate with the CLI rather than editing by hand when possible.
- `src/components/confirm-dialog.tsx` — shared confirmation dialog; use it for all destructive actions.

### Types (`src/types/`)

There are **both kebab-case and camelCase duplicate type files** for several resources (e.g. `address-book.ts` + `addressBook.ts`, `login-log.ts` + `loginLog.ts`). This is a migration artifact — prefer the kebab-case file and delete the duplicate if you find consumers of the camelCase version have moved over. Ask before creating new types on the camelCase side.

### UI conventions (important — don't reach for Radix muscle memory)

shadcn here is configured for `@base-ui/react`, which has a **different API from Radix**:

- Trigger components take a **`render` prop**, not Radix's `asChild`.
- Menu items use **`onClick`**, not Radix's `onSelect`.
- Event handler and ref prop shapes differ — if you copy Radix snippets from the web, port them.

When in doubt, read the existing `src/components/ui/*.tsx` or Base UI docs before generating new component code.

## Forms

Use `react-hook-form` + `zod` + `standardSchemaResolver` (from `@hookform/resolvers/standard-schema`). `src/pages/users.tsx` is a good reference for the full pattern: zod schema at top, `useForm` with the resolver, shadcn `Form` / `FormField` / `FormMessage` wrappers, mutation via TanStack Query, toast on success/error, `ConfirmDialog` for deletes.

## i18n

Every user-visible string goes through `useTranslation()` `t()`. When adding a key, update **both** `src/locales/en.json` and `src/locales/zh.json` — missing keys in `zh.json` will silently fall back to English.

## Known gaps / in-flight work

- `src/pages/custom-clients.tsx` has **no backend admin API yet** — the page is a stub until the Go side ships endpoints. Don't wire it to fake routes.
- The parent workspace's `graphify-out/` knowledge graph indexes the Rust/Go code, not this frontend — the "run `_rebuild_code` after edits" rule in `/home/user/rustdesk/CLAUDE.md` does not apply to changes made here.

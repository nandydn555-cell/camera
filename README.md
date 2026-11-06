# Lensline Camera Store

Lensline is a responsive camera and accessories storefront for shoppers in Ulaanbaatar. It brings catalog discovery, product specifications, stock, account details, cart, checkout and order tracking into one flow. The problem statement and the project’s user flows, wireframes and ERD are documented in [docs/project-design.md](docs/project-design.md).

## Run locally

```sh
npm install
npm run dev
```

The frontend uses Supabase for authentication and persistent product, cart, profile and order data. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`; never put a `service_role` or secret key in a `VITE_*` variable.

## Supabase setup

For a new Supabase project, run these files in order from the project’s **SQL Editor**:

1. `supabase/migrations/202611060001_store_schema.sql`
2. `supabase/migrations/202611060002_secure_checkout_and_storage.sql`
3. `supabase/migrations/202611060003_repair_profiles.sql`
4. `supabase/migrations/202611060004_demo_payment_simulation.sql`
5. `supabase/seed.sql`

The first two schema migrations are one-time setup scripts and are not idempotent. If the project already has the original store schema, do not rerun them; apply only migrations that are not yet present in that project’s migration history, then run the seed file as needed.

Configure Auth email confirmation and redirect URLs for the local and deployed origins. To make an account an administrator, use the trusted SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'your-account@example.com';
```

Migrations in the repository describe the intended database. They must be run against Supabase before the remote project has those changes; this repository does not apply them automatically.

## Pages and routes

- `/` — home and featured products
- `/shop` — complete catalog with search, category, brand and price sorting
- `/cameras` — camera categories
- `/accessories` — lenses, camera accessories, tripods and bags
- `/products/:productId` — product details
- `/cart`, `/checkout`, `/orders`, `/profile` — customer journey
- `/admin` — product CRUD and order status management for admin accounts

Routes use React Router, so production hosting must send unknown paths back to `index.html` for SPA deep links and browser refreshes.

## Data and payment behavior

The app uses Supabase Auth. A database trigger creates a profile for new Auth users; the client has an owner-checked recovery path for an older account without a profile. Row Level Security policies protect the public-schema tables and product image storage. The schema, relationships and access matrix are in [docs/project-design.md](docs/project-design.md).

Checkout creates the order, order items and pending payment with the `checkout_cart` database function, which reads current prices and stock from PostgreSQL. The QR currently represents **demo data only**. The demo action records `demo_paid` through an owner-checked function; it does not create a bank payment or prove that money was received. A real QPay integration requires merchant credentials, a trusted backend/Edge Function, invoice creation, and server-side payment verification.

Product image URLs in the seed file use external image hosts and require an internet connection. Admin-uploaded product images use the configured Supabase Storage bucket.

## Project structure

- `src/state/StoreContext.tsx` — shared catalog, auth, cart and order state/actions
- `src/pages/` — route-level screens
- `src/components/` — shared navigation, product cards and dialogs
- `src/lib/supabase.ts` — Supabase client and database operations
- `src/types/store.ts` — shared product, order and user types
- `supabase/migrations/` — schema, security policies and database functions
- `supabase/seed.sql` — sample catalog data
- `docs/project-design.md` — problem, user flows, wireframes, route map, ERD and RLS summary
- `archive/legacy-stays/` — preserved, unused accommodation-booking prototype; not part of the camera store

## Available checks

```sh
npm run lint
npm run build
```

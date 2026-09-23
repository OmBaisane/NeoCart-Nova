# NeoCart Nova — Current Project Context

## 1. Project Identity

- **Project:** NeoCart Nova
- **Type:** Modern full-stack e-commerce platform and serious portfolio project
- **Goal:** Production-oriented e-commerce application demonstrating Next.js, TypeScript, Tailwind, Node.js, Express, MongoDB, Mongoose, REST APIs, JWT authentication, authorization, validation, e-commerce business logic, responsive UI, admin management, Git/GitHub workflow, and deployment.
- **Build approach:** Fresh implementation from scratch.
- **Old NeoCart:** Reference-only. Do not copy or migrate the old PHP/MySQL/Bootstrap/Vanilla JS architecture.
- **Current source of truth:** This context file + the finalized NeoCart Nova Master Build Prompt. Actual code inspection remains standard when verifying implementation correctness.

---

## 2. Locked Architecture

```text
Next.js Frontend
      ↓
REST API
      ↓
Express + Node.js Backend
      ↓
Mongoose
      ↓
MongoDB
Frontend
Next.js App Router (v15+)

TypeScript

Tailwind CSS v4

TanStack Query for server/API state management & caching

Lucide React for consistent icons

Layout Isolation via StoreLayoutWrapper: Public storefront (Navbar + Footer) completely detached from dedicated /admin control shell

Responsive Admin Sidebar: Desktop navigation with mobile slide-over drawer and hamburger toggle

No Redux unless real complexity later requires it

Backend
Node.js & Express with TypeScript

REST API architecture

Mongoose ODM connected to MongoDB

Database Seeder utility (npm run seed) for authentic products, categories, admin, and demo users

Authentication & Security
JWT authentication

Strict HttpOnly, SameSite, and environment-aware secure cookies (No JWT/token storage in localStorage)

Cross-site cookie attribute parity (sameSite: 'none', secure: true in production) across login and logout endpoints

bcryptjs password hashing via Mongoose pre-save hook (minimum 8 characters enforced)

Backend-enforced role authorization (protect and adminOnly middlewares)

Validation
Zod v4 at appropriate API/form request boundaries

TypeScript types inferred directly from Zod schemas (z.infer)

3. Locked V1 Scope
Customer Experience
Premium home/landing page with dark hero banner, value pillars, category discovery, and featured products grid

Product catalog with live text search, category filters, price range filter, multi-criteria sorting, and responsive pagination

Suspense boundary wrapped catalog for static prerendering compatibility with useSearchParams()

Product details page (/products/[slug]) with image gallery switcher, discount badges, out-of-stock lock guards, and verified reviews list

Verified ratings and reviews system (1–5 stars, comments, 1 review per user/product constraint)

Authentication & Accounts
Register, login, and logout endpoints

HttpOnly cookie sessions

Customer and admin route protection

User profile management, structured shipping address pre-fill, and password change (/profile)

Shopping, Orders & Checkout
Add to cart, update exact quantities, remove items (/cart) with dynamic mutations

Per-user persistent cart

Strict server-side stock validation and price retrieval directly from MongoDB

Cash on Delivery (COD) checkout flow with auto-prefilled addresses (/checkout)

Direct-access empty cart protection on checkout with graceful fallback states

Immutable historical order item snapshots (freezes price, name, image, and quantity)

Auto-generated human-readable tracking numbers (NC-NOV-...)

Immediate invoice and tracking screen (/order-success/[id])

Customer order history with self-service cancellation and automatic warehouse restock (/orders)

Admin Portal
Isolated administrative shell: Dedicated sidebar navigation, responsive mobile drawer, executive topbar, and complete removal of storefront navbar/footer

Executive Dashboard overview with real-time KPI telemetry (catalog items, customer accounts, low stock alerts) (/admin)

Product inventory table with live search, stock badges, and direct deletion (/admin/products)

Reusable product creation and edit forms with category selectors and image arrays (/admin/products/new, /admin/products/[id]/edit)

Customer order fulfillment table with status dispatch lifecycle (pending to delivered/cancelled) and detailed snapshot inspection modal (/admin/orders)

Registered customer directory view with saved shipping address inspection (/admin/users)

Explicitly OUT of V1
Do not implement unless explicitly requested:

Wishlist, Coupons, Loyalty system, Live Chat, Notifications, Multi-vendor marketplace, Product variants, Complex payment gateways, Microservices.

4. Current Status — September 2026
Phase 1 — Foundation
STATUS: 100% COMPLETED

Monorepo-style frontend/backend separation

Next.js App Router + TypeScript + Tailwind CSS v4 setup

Express + TypeScript backend scaffolding

MongoDB + Mongoose connection lifecycle

Brand tokens: Deep Indigo (#0B0F19), Electric Blue (#2563EB), Cyan Accent (#06B6D4)

Phase 2 — Backend Core
STATUS: 100% COMPLETED & VERIFIED

Database Models: User, Category, Product, Cart, Order, Review

Authentication & User Management APIs (/api/auth, /api/users)

Category & Product CRUD APIs (/api/categories, /api/products)

Persistent Cart with server stock checks (/api/cart)

COD Orders with frozen snapshots, cancellation restock, and tracking (/api/orders)

Customer Reviews aggregation (/api/reviews, /api/products/:productId/reviews)

Admin User Directory API (/api/admin/users)

Database Seeder script (backend/src/utils/seeder.ts)

Phase 3 — Frontend Core
STATUS: 100% COMPLETED

[x] Axios centralized client with withCredentials: true

[x] TanStack Query setup & QueryProvider

[x] Global AuthContext managing session state & auto-profile sync

[x] Semantic Storefront Navbar & Footer with brand tokens

[x] Reusable ProductCard component with stock alerts and discount badges

[x] Authentication Pages: /login and /register

[x] Landing Page (/) with high-contrast Hero and Value Pillars

[x] Catalog Page (/products) with keyword search, category filters, and pagination

[x] Product Details Page (/products/[slug]) with image switcher, stock guard, and reviews

[x] Shopping Cart (/cart) with dynamic mutations and server-calculated subtotals

[x] Checkout Page (/checkout) with address capture and COD flow

[x] Order Success (/order-success/[id]) with tracking code and receipt

[x] Customer Order History (/orders) with self-cancellation restock

[x] Customer Profile (/profile) with default address pre-fill and password updates

Phase 4 — Admin Portal
STATUS: 100% COMPLETED

[x] Route-level Layout Isolation (StoreLayoutWrapper detaching storefront nav/footer from admin)

[x] Dedicated Admin Layout with Sidebar, Executive Header, and adminOnly Role Guard (/admin)

[x] Responsive Mobile Slide-over Drawer with Hamburger Navigation for Admin

[x] Executive KPI Dashboard with warehouse inventory alerts (/admin)

[x] Inventory Management Table with live search and product deletion (/admin/products)

[x] Product Create & Edit Forms (/admin/products/new, /admin/products/[id]/edit)

[x] Customer Fulfillment & Orders Table with live status dispatcher and inspection modal (/admin/orders)

[x] Registered Customer Directory with address and contact audits (/admin/users)

Phase 5 — Integration & Polish
STATUS: 100% COMPLETED

[x] Shimmer loading skeleton components (ProductCardSkeleton, ProductGridSkeleton, TableSkeleton)

[x] Reusable EmptyState component integrated across Catalog, Cart, Checkout, and Admin tables

[x] Global Error Boundary (frontend/src/app/error.tsx)

[x] Custom 404 Route (frontend/src/app/not-found.tsx)

[x] Next.js App Router Suspense boundary on /products for production build prerendering

[x] Direct-access empty cart guard on /checkout

[x] Out-of-stock purchase lock and stock boundary checks on /products/[slug]

Phase 6 — Production & Deployment
STATUS: READY FOR LIVE DEPLOYMENT (Starting Tomorrow)

[x] Dynamic production CORS origin handler in backend

[x] Secure cross-origin cookie attributes (sameSite: 'none', secure: true) aligned across token creation and logout

[x] Full production TypeScript build verification for both backend (tsc) and frontend (next build)

[ ] MongoDB Atlas Cloud database setup & connection string verification

[ ] Backend deployment on Render/Railway

[ ] Frontend deployment on Vercel

[ ] Live cross-origin cookie authentication and end-to-end checkout verification

5. Current Project Structure
Plaintext
NeoCart-Nova/
├── backend/
│   ├── src/
│   │   ├── config/ (db.ts, env.ts)
│   │   ├── controllers/ (auth, user, product, category, cart, order, review, admin)
│   │   ├── middleware/ (auth.middleware.ts, errorHandler.ts)
│   │   ├── models/ (user, product, category, cart, order, review)
│   │   ├── routes/ (auth, user, product, category, cart, order, review, admin)
│   │   ├── types/ (express.d.ts)
│   │   ├── utils/ (jwt.ts, validators.ts, seeder.ts)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── login/page.tsx
    │   │   │   └── register/page.tsx
    │   │   ├── admin/
    │   │   │   ├── orders/page.tsx
    │   │   │   ├── products/
    │   │   │   │   ├── [id]/edit/page.tsx
    │   │   │   │   ├── components/ProductForm.tsx
    │   │   │   │   ├── new/page.tsx
    │   │   │   │   └── page.tsx
    │   │   │   ├── users/page.tsx
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── cart/page.tsx
    │   │   ├── checkout/page.tsx
    │   │   ├── order-success/[id]/page.tsx
    │   │   ├── orders/page.tsx
    │   │   ├── products/
    │   │   │   ├── [slug]/page.tsx
    │   │   │   └── page.tsx
    │   │   ├── profile/page.tsx
    │   │   ├── error.tsx
    │   │   ├── not-found.tsx
    │   │   ├── globals.css
    │   │   ├── icon.svg
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Footer.tsx
    │   │   │   ├── Logo.tsx
    │   │   │   ├── Navbar.tsx
    │   │   │   └── StoreLayoutWrapper.tsx
    │   │   └── ui/
    │   │       ├── EmptyState.tsx
    │   │       ├── ProductCard.tsx
    │   │       └── Skeletons.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── lib/
    │   │   └── api.ts
    │   └── providers/
    │       └── QueryProvider.tsx
    ├── package.json
    └── tsconfig.json
6. Git Workflow Rules
For every milestone:

Explain

Implement

Verify

Review changed files via git status

Commit with clean conventional commit message

Push to GitHub remote

Report status and wait for "Done bhai ab next"

Never commit secrets, .env, or passwords.

7. Next Immediate Milestone
Milestone 6.2: Live Production Deployment — MongoDB Atlas cloud database synchronization, deploying backend to Render/Railway, deploying frontend to Vercel, and validating live cross-origin authenticated checkout flow.
```

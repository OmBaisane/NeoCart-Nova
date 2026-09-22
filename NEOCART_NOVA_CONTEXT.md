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

No Redux unless real complexity later requires it

Backend
Node.js & Express with TypeScript

REST API architecture

Mongoose ODM connected to MongoDB

Authentication & Security
JWT authentication

Strict HttpOnly, SameSite, and environment-aware secure cookies (No JWT/token storage in localStorage)

bcryptjs password hashing via Mongoose pre-save hook (minimum 8 characters enforced)

Backend-enforced role authorization (protect and adminOnly middlewares)

Validation
Zod v4 at appropriate API/form request boundaries

TypeScript types inferred directly from Zod schemas (z.infer)

3. Locked V1 Scope
Customer Experience
Premium home/landing page with glowing hero banner & value proposition pillars

Featured products collection

Category discovery carousel/pills

Product catalog with live text search, category filters, price range filter, multi-criteria sorting, and responsive pagination

Product details page with image view, price/discount display, stock indicators, and reviews list

Ratings and reviews system (1–5 stars, comments, 1 review per user/product constraint)

Authentication & Accounts
Register, login, and logout endpoints

HttpOnly cookie sessions

Protected customer and admin routes

User profile viewing, structured shipping address management, and password change

Shopping & Cart
Add to cart, update exact quantities, remove items

Per-user persistent cart

Strict server-side stock validation and price retrieval directly from MongoDB

Cash on Delivery (COD) checkout flow

Orders & Tracking
Server-side order total calculation (subtotal, conditional shipping fees)

Historical order item snapshotting (freezes historical name, image, price, quantity)

Auto-generated human-readable tracking numbers (NC-NOV-...)

Customer order history & order cancellation with automatic inventory restock

Order status lifecycle management

Admin Portal
Admin authentication & route guards

Dashboard metrics overview

Product CRUD & live inventory/stock management

Order status & tracking number management

Registered customer directory view

Explicitly OUT of V1
Do not implement unless explicitly requested:

Wishlist, Coupons, Loyalty system, Live Chat, Notifications, Multi-vendor marketplace, Product variants, Complex payment gateways, Microservices.

4. Current Status — September 2026
Phase 1 — Foundation
STATUS: COMPLETED

Monorepo-style frontend/backend separation

Next.js App Router + TypeScript + Tailwind CSS v4 setup

Express + TypeScript backend scaffolding

MongoDB + Mongoose connection lifecycle

Brand tokens: Deep Indigo (#0B0F19), Electric Blue (#2563EB), Cyan Accent (#06B6D4)

Dynamic SVG Favicon (src/app/icon.svg) and root layout structure

Phase 2 — Backend Core
STATUS: 100% COMPLETED & VERIFIED

Database Models: User, Category, Product, Cart, Order, Review

Authentication: Register, Login, Logout, Me (/api/auth)

User Management: Profile fetch/update, Password change (/api/users)

Category CRUD: Public fetch, Admin-only create/update/delete (/api/categories)

Product CRUD: Public catalog with search/filter/sort/pagination, Admin mutation (/api/products)

Cart System: Live stock validation, server-side price snapshots & recalculation (/api/cart)

Order System: COD checkout, live stock deduction, immutable item snapshots, tracking generation, cancellation restock (/api/orders)

Review System: 1-to-5 rating, one review per product/user constraint, real-time average aggregation (/api/reviews)

Admin API: Customer directory listing with search & pagination (/api/admin/users)

Phase 3 — Frontend Core
STATUS: IN PROGRESS (Milestones 3.1 to 3.5 Completed)

[x] Axios centralized client with withCredentials: true

[x] TanStack Query setup & QueryProvider

[x] Global AuthContext managing session state & auto-profile sync

[x] Semantic Navbar with search, cart trigger, dynamic auth dropdown, and mobile drawer

[x] Semantic Footer with brand tokens & trust statements

[x] Scalable vector Logo component placed in components/layout/

[x] Reusable ProductCard component with stock alerts, discounts, and ratings

[x] Authentication Pages: /login and /register with client validation & auth redirects

[x] Storefront Landing Page (/) with Hero, Value Pillars, Category Discovery, and Featured Grid

[x] Product Catalog Page (/products) with real-time keyword search, category filter sidebar, price range form, sorting, and pagination

[ ] Product Details Page (/products/[slug])

[ ] Customer Ratings & Review submission UI

[ ] User Profile & Shipping Address Page (/profile)

[ ] Shopping Cart Drawer/Page (/cart)

[ ] Checkout Page with Shipping Form & COD (/checkout)

[ ] Order Success (/order-success/[id]) & Customer Order History (/orders)

Phase 4 — Admin Portal
STATUS: PENDING

Protected Dashboard overview (/admin/dashboard)

Product CRUD & Inventory Management UI (/admin/products)

Order Processing & Status Update UI (/admin/orders)

Customer Directory UI (/admin/users)

Phase 5 — Integration & Polish
STATUS: PENDING

Loading skeletons, empty states, error boundaries

Responsive & accessibility audit

Stock concurrency & checkout edge cases review

Phase 6 — Production & Deployment
STATUS: PENDING

Production CORS, secure cookie configurations, and live deployments

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
│   │   ├── utils/ (jwt.ts, validators.ts)
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
    │   │   ├── products/
    │   │   │   └── page.tsx
    │   │   ├── globals.css
    │   │   ├── icon.svg
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Footer.tsx
    │   │   │   ├── Logo.tsx
    │   │   │   └── Navbar.tsx
    │   │   └── ui/
    │   │       └── ProductCard.tsx
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
Milestone 3.6: Product Details Page (/products/[slug]) — Hero image view, live pricing with discount calculation, stock availability badge, add-to-cart selector with quantity limit, and customer review list with aggregated star summary.
```

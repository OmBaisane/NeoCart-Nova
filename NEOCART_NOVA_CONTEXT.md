# NeoCart Nova — Current Project Context

## 1. Project Identity

- **Project:** NeoCart Nova
- **Type:** Modern full-stack e-commerce platform and serious portfolio project.
- **Goal:** Production-oriented e-commerce application demonstrating Next.js, TypeScript, Tailwind, Node.js, Express, MongoDB/Mongoose, REST APIs, JWT authentication, authorization, Zod validation, e-commerce business logic, responsive UI, admin management, security, accessibility, performance, and deployment.
- **Build approach:** Fresh implementation from scratch.
- **Old NeoCart:** Reference-only. Never copy or migrate the old PHP/MySQL/Bootstrap/Vanilla JS architecture.
- **Source of truth:** This context + Master Build Prompt + actual repository.
- **V1 scope:** Locked. No feature expansion during final verification.

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
MongoDB Atlas
```

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Lucide React
- shadcn/ui only where useful
- Storefront and admin shells remain isolated

### Backend

- Node.js
- Express
- TypeScript
- REST
- Mongoose
- MongoDB Atlas

### Authentication

- JWT
- Secure HttpOnly cookies
- No JWT/token in localStorage
- bcryptjs
- `protect` and `adminOnly`
- Production cross-site cookies use `SameSite=None` + `Secure`

### Validation

- Zod at runtime boundaries
- TypeScript types for compile-time safety

## 3. Locked V1 Scope

### Customer

- Home/landing
- Featured products
- Categories
- Product listing
- Search/filter/sort/pagination
- Product details
- Product images
- Ratings/reviews

### Authentication & Account

- Register/login/logout
- JWT authentication
- Protected routes
- Profile
- Shipping address/profile management
- Password change
- Admin authorization

### Shopping & Orders

- Add/update/remove cart items
- Persistent user cart
- Stock validation
- Checkout
- Shipping information
- COD
- Historical order snapshots
- Order history/details
- Tracking number
- Valid cancellation
- Restock after cancellation

### Reviews

- 1–5 rating
- Comment
- One review per user/product
- Edit own review
- Delete own review
- Product rating/review count

### Admin

- Admin authentication
- Dashboard
- Product/inventory management
- Stock management
- Order management/status/tracking
- Customer/user list

### Explicitly OUT of V1

- Wishlist
- Coupons
- Loyalty
- Chat
- Notifications
- Marketplace/multi-vendor
- Product variants
- Advanced analytics
- AI recommendations
- Complex payment gateway
- Multiple admin roles
- Advanced moderation
- Microservices
- Unnecessary abstractions

## 4. Current Status — 2026-09-28

### Phase 1 — Foundation

**STATUS: COMPLETED**

### Phase 2 — Backend Core

**STATUS: FEATURE-COMPLETE**

Implemented:

- User, Category, Product, Cart, Order, Review models
- Auth/user/product/category/cart/order/review/admin APIs
- JWT + HttpOnly cookie authentication
- bcrypt password hashing
- `protect` / `adminOnly`
- Centralized error handling
- Zod validation
- Server-side price/stock/order-total logic
- Historical order snapshots
- Review ownership and one-review-per-user/product constraint
- Database seeder

### Phase 3 — Frontend Core

**STATUS: COMPLETED**

Implemented:

- Home
- Auth pages
- Product catalog/search/filter/sort/pagination
- Product details/gallery/reviews
- Cart
- Checkout/COD
- Order success/history/details/cancellation
- Profile/address/password management
- TanStack Query integration
- Responsive storefront UI

### Phase 4 — Admin Portal

**STATUS: COMPLETED**

Implemented:

- Isolated admin layout
- Dashboard/KPIs
- Responsive sidebar/drawer
- Product/inventory management
- Product create/edit/deactivation
- Order fulfillment/status/tracking
- Customer directory
- Frontend admin guard + backend authorization

### Phase 5 — Integration, Security & Hardening

**STATUS: COMPLETED**

Completed:

- Nested `<main>` landmark fix
- Accessibility/navigation ARIA improvements
- CSRF Origin/Referer protection
- Helmet/security headers
- Authentication rate limiting
- Strict production CORS
- Production environment validation
- Search regex escaping + search length cap
- Production-safe seeder behavior
- Product soft-delete/deactivation
- Category deletion protection
- Atomic stock decrement
- Transaction-safe checkout
- Transaction-safe cancellation/restocking
- Review edit/delete routes and UI
- Meaningful TypeScript `any` cleanup
- Professional comment cleanup
- Existing loading/empty/error states
- robots/sitemap and metadata improvements
- Image optimization configuration

### Phase 6 — Production Deployment

**STATUS: DEPLOYED — FINAL LIVE VERIFICATION**

Deployment state:

- **MongoDB Atlas:** COMPLETED from the beginning; no setup work remaining.
- **Backend:** DEPLOYED.
- **Frontend:** DEPLOYED.
- Production frontend/backend configuration is in place.

Remaining work is verification, not deployment setup.

## 5. Final Production Verification

The remaining checklist is:

- [ ] Actual frontend lint passes
- [ ] Actual frontend production build passes
- [ ] Actual backend TypeScript/build passes
- [ ] Live frontend → backend communication verified
- [ ] Register/login/logout verified in production
- [ ] HttpOnly authentication cookie verified in production
- [ ] CORS/CSRF behavior verified in production
- [ ] Catalog/search/filter/sort/pagination verified
- [ ] Cart persistence and stock validation verified
- [ ] Live COD checkout verified
- [ ] Order creation + cart clearing verified
- [ ] Live cancellation + restocking verified
- [ ] Review create/edit/delete verified
- [ ] Admin authorization and critical admin flows verified
- [ ] Final production smoke test completed

Do not claim a check passed unless it was actually verified.

## 6. Security Rules — Preserve

Do not regress:

- HttpOnly JWT cookies
- Secure production cookies
- SameSite production configuration
- strict CORS
- CSRF protection
- Helmet/security headers
- auth rate limiting
- bcrypt
- Zod validation
- production environment validation
- production error-message hiding
- regex search hardening
- soft-delete/deactivation
- category deletion protection
- atomic stock updates
- transaction-safe checkout
- transaction-safe cancellation

## 7. Seeder Rules

The seeder is **development-only**.

Production behavior:

- `NODE_ENV=production` must refuse seeding.
- No production force flag should bypass this protection.
- No hardcoded credentials.
- Development seed credentials must come from environment variables.

Expected seed environment variables:

```text
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_ADMIN_PHONE
SEED_DEMO_USER_EMAIL
SEED_DEMO_USER_PASSWORD
SEED_DEMO_USER_PHONE
```

These values belong only in local/development environment configuration and must never be committed.

The seed script is not part of the live deployment flow.

## 8. Code Quality Rules

- No meaningful `any` unless genuinely unavoidable.
- Comments should be concise professional English and explain WHY/non-obvious behavior.
- No secrets, passwords, `.env`, node_modules, or generated noise in Git.
- Prefer readable code over unnecessary abstractions.
- Preserve the existing architecture.
- No feature creep.

## 9. Git Workflow

For every meaningful milestone:

```text
Inspect
↓
Explain briefly
↓
Implement
↓
Verify
↓
Review changed files
↓
git status
↓
git add .
↓
git commit -m "meaningful message"
↓
git push
↓
Report exact result
↓
STOP
```

Never claim a command passed unless it actually passed.

## 10. Final Project Goal

NeoCart Nova is no longer in feature-development mode.

Current goal:

```text
V1 Complete
   ↓
Production Hardening Complete
   ↓
MongoDB Atlas + Backend + Frontend Deployed
   ↓
Final Live Verification
   ↓
Production Sign-off
```

After the final live verification passes, NeoCart Nova should move to maintenance/portfolio status. Do not restart architecture or begin another feature cycle unless a future V1.1 scope is explicitly defined.

**This file is the current-state handoff document for NeoCart Nova.**

# NeoCart Nova — Current Project Context

> Last updated: 2026-11-03  
> Project release: NeoCart Nova V1.1  
> Current focus: Final documentation, Git review and push, followed by remaining live customer/admin E2E verification.

## 1. Project Identity

- **Project:** NeoCart Nova
- **Type:** Full-stack e-commerce platform and portfolio project.
- **Goal:** Demonstrate practical, production-oriented full-stack engineering.
- **Implementation:** Built from scratch.
- **Old NeoCart:** Reference-only. Do not copy or migrate the old PHP/MySQL/Bootstrap/Vanilla JS architecture.
- **Repository:** https://github.com/OmBaisane/NeoCart-Nova
- **Frontend:** https://neo-cart-nova.vercel.app
- **Backend:** https://neocart-nova-backend.onrender.com
- **Database:** MongoDB Atlas M0 Free tier.
- **License:** MIT License.
- **Current release:** V1.1 finalization.

The actual repository is the source of truth for implementation. This context file records the intended architecture, verified progress, remaining work, and project-specific rules.

## 2. Locked Architecture

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Lucide React
- Separate storefront and admin experiences

### Backend

- Node.js
- Express
- TypeScript
- REST API
- Mongoose
- MongoDB Atlas
- Zod validation

### Authentication

- JWT authentication
- HttpOnly cookies
- bcryptjs password hashing
- No JWT/token storage in localStorage
- `protect` and `adminOnly` middleware
- Secure production cookie configuration, including `SameSite=None` and `Secure` where required

### Validation

- Zod runtime validation
- TypeScript compile-time safety
- Server-side business-rule validation

## 3. Current Feature Scope

The following describes the intended V1.1 application scope. Final production behavior must be confirmed through release verification.

### Customer Storefront

- Home and landing page
- Featured products
- Categories
- Product catalog
- Search
- Category and price filters
- Sorting and pagination
- Product details and image gallery
- Ratings and reviews

### Authentication and Account

- Registration
- Login and logout
- JWT authentication
- Protected routes
- Profile management
- Shipping address management
- Password management
- Admin authorization

### Shopping

- Add, update, and remove cart items
- Persistent user cart
- Cart validation
- Server-side stock validation

### Checkout and Orders

- Cash on Delivery
- Shipping information
- Server-side price and total calculation
- Stock validation during checkout
- Transaction-based order creation
- Historical order snapshots
- Order history and details
- Tracking numbers
- Eligible cancellation
- Inventory restoration after cancellation

### Reviews

- 1–5 star ratings
- Written comments
- One review per user per product
- Review ownership checks
- Review editing and deletion
- Product rating and review-count recalculation

### Admin Portal

- Admin-only access
- Dashboard and statistics
- Product management
- Product creation and editing
- Product deactivation
- Inventory management
- Category management
- Order management
- Order-status updates
- Customer/user directory

Do not remove implemented V1.1 features merely because they were absent from the original V1 scope.

## 4. Backend Business Rules

### Authentication

- Passwords are hashed using bcryptjs.
- User passwords are excluded from normal queries using `select: false`.
- Authentication uses HttpOnly cookies.
- User-specific API access requires authentication.
- Admin APIs require the admin role.
- Public user responses must not expose passwords or secrets.

### Product and Inventory

- Product slugs are unique.
- Product prices cannot be negative.
- Discount prices must be lower than original prices.
- Stock must be a non-negative integer.
- Inactive products must not be treated as available for normal customer purchases.
- Inventory updates must preserve stock consistency.

### Cart

- Each user has one cart.
- Cart totals are recalculated from item quantities and prices.
- Stock and current effective product prices must be validated.
- Cart concurrency conflicts must be handled safely.

### Orders

- Orders contain product snapshots, not merely live product references.
- Checkout must validate the cart and inventory.
- Checkout uses MongoDB transactions.
- A successful checkout clears the corresponding cart.
- A failed transaction must not leave partial inventory/order changes.
- Cancellation is allowed only for eligible order states.
- Inventory restoration must not happen repeatedly for the same order.
- Order-status changes must follow the defined transition rules.

### Order Status Transitions

```text
pending
  ├── confirmed
  ├── processing
  └── cancelled

confirmed
  ├── processing
  ├── shipped
  └── cancelled

processing
  ├── shipped
  └── cancelled

shipped
  └── delivered

delivered / cancelled
  └── terminal states
```

For COD, payment is marked paid when the order is delivered, according to the backend business rules.

## 5. Security Requirements — Preserve

Do not regress:

- HttpOnly JWT cookies
- Secure production cookies
- Production SameSite configuration
- Strict CORS
- CSRF Origin/Referer protection
- Helmet security headers
- Authentication rate limiting
- bcrypt password hashing
- Zod validation
- Production environment validation
- Production-safe error responses
- Search regex escaping and query bounds
- Product deactivation instead of unsafe deletion
- Category deletion protection
- Atomic stock updates
- Transaction-safe checkout
- Transaction-safe cancellation/restocking
- Admin authorization
- Ownership checks
- Unique constraints

Any security change must be reviewed for regressions before release.

**Credential safety reminder:** An admin JWT cookie/token was previously pasted into chat. Treat that token as exposed. If not already completed, rotate `JWT_SECRET` in Render, redeploy the backend to invalidate old tokens, and log in again. Never paste a new token into chat or commit it.

## 6. Database and Transaction Testing

- Database provider: MongoDB Atlas.
- Current tier: M0 Free.
- The application uses MongoDB transactions for critical order workflows.
- Transaction support requires a MongoDB deployment configured as a replica set or another transaction-capable deployment.
- Never use the production database for destructive automated tests.
- Automated tests must use a separate test database or an isolated test environment.
- Test data must be uniquely identifiable and safely cleaned up.
- Never print, commit, or share MongoDB credentials.

Checkout, cancellation, and restocking must be verified against actual transaction behavior before claiming full production integration coverage. Mock-only transaction tests must not be reported as full transaction integration coverage.

## 7. Seeder Rules

The seeder is development-only.

Production behavior:

- `NODE_ENV=production` must refuse seeding.
- No force flag may bypass production protection.
- No hardcoded credentials.
- Development seed credentials must come from environment variables.

Expected seed variables:

```text
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_DEMO_USER_EMAIL
SEED_DEMO_USER_PASSWORD
SEED_DEMO_USER_PHONE
SEED_ALLOW_RESET
```

These values belong only in local/development environment configuration and must never be committed.

The seed script is not part of the production deployment flow.

## 8. M11 — Testing and Quality Assurance

**Status: Backend automated tests and local frontend checks completed. Live E2E verification is partially complete and remains pending.**

### Backend Testing

Implemented and verified:

- Query-safety tests
- Validator tests
- Model tests
- JWT utility tests
- Environment configuration tests
- Authentication middleware tests
- CSRF middleware tests
- Error-handler tests
- Selected authentication controller tests
- Selected user controller tests

**Latest verified result: 16 test files, 205 tests passing.**

Commands successfully executed:

```bash
npm test
npm run type-check
npm run build
npm audit
```

Backend results:

- 16 test files passed.
- 205 tests passed.
- Type-check passed.
- Production build passed.
- Dependency audit: **0 vulnerabilities**.

### Frontend Verification

Successfully executed:

```bash
npm run lint
npm run build
npm audit
npm audit --omit=dev
```

Frontend results:

- ESLint passed.
- Next.js 16.4.3 production build passed.
- TypeScript validation passed during build.
- 21 static pages generated.
- Production dependency audit (`npm audit --omit=dev`): **0 vulnerabilities**.
- Full dependency audit: **15 moderate findings** in the development-only ESLint/tooling dependency tree.

The dependency tree was inspected. A forced breaking downgrade was intentionally avoided. Do not claim the full frontend audit is clean; distinguish production dependencies from development tooling.

### Testing Limitations

The current automated suite does not establish complete end-to-end coverage of every customer/admin workflow or actual production database transaction behavior.

Do not claim unimplemented frontend tests, complete API integration coverage, or full transaction integration coverage.

### Testing Rules

- Do not mark tests complete until they actually pass.
- Do not use production data for automated testing.
- Avoid mocking every controller and calling it integration testing.
- Do not chase coverage numbers at the cost of meaningful assertions.
- Keep test configuration compatible with the existing Node.js, TypeScript, and package setup.
- Add only necessary dependencies.
- Avoid unnecessary additional tests during finalization unless a concrete critical gap is identified.

## 9. M11 Final Live E2E Checklist

**Status: Partially verified — production workflows have not yet been fully signed off.**

### Confirmed live checks

- [x] Admin Product Edit page loads.
- [x] Admin Product Save/Update works.
- [x] Product Details page checked.
- [x] Product images checked.
- [x] Product Details compare-count event issue fixed and confirmed by user.

### Customer Journey — Remaining Verification

- [ ] Register, login, and logout
- [ ] Authentication cookie behavior
- [ ] Product catalog and product details — full journey
- [ ] Search, filters, sorting, and pagination
- [ ] Cart add/update/remove
- [ ] Cart persistence and stock validation
- [ ] Checkout with COD
- [ ] Order creation
- [ ] Cart clearing after successful order
- [ ] Order history and details
- [ ] Eligible cancellation
- [ ] Inventory restoration
- [ ] Review create/edit/delete

### Admin Journey — Remaining Verification

- [ ] Admin login and logout
- [ ] Admin route/API authorization
- [ ] Dashboard and analytics
- [ ] Product creation
- [ ] Product edit/update — confirmed above
- [ ] Product activation/deactivation
- [ ] Category management
- [ ] Inventory updates
- [ ] Customer directory
- [ ] Order listing and details
- [ ] Valid order-status transitions
- [ ] Tracking and delivery workflow

### Production Security and Smoke Tests — Remaining Verification

- [ ] CORS behavior
- [ ] CSRF behavior
- [ ] Unauthorized API requests
- [ ] Admin-only API protection
- [ ] Invalid input handling
- [ ] Error response behavior
- [ ] Production frontend/backend communication
- [ ] Final health checks
- [ ] Confirm admin JWT secret rotation after prior token exposure, if not already done

Do not perform destructive tests on real customer data. Use controlled test accounts and test products/orders. Record any production test data created and clean it up safely where appropriate.

## 10. Documentation and Licensing

- Root `README.md` describes the V1.1 application.
- Root `LICENSE` contains the MIT License.
- Root `NEOCART_NOVA_CONTEXT.md` is the current-state handoff document.
- Documentation must not claim unverified tests, deployment checks, or features.
- Keep environment examples aligned with actual environment validation.
- Never put secrets in documentation.

## 11. Code Quality Rules

- Avoid meaningful `any` unless genuinely unavoidable.
- Use concise professional English comments explaining non-obvious behavior.
- No secrets, passwords, `.env`, node_modules, or generated noise in Git.
- Prefer readable code over unnecessary abstractions.
- Preserve the existing architecture.
- No feature creep during finalization.
- Do not rewrite working files without a concrete reason.
- Provide complete updated files when changes are needed.

## 12. Git Workflow

Follow this sequence:

```text
Inspect
  ↓
Explain
  ↓
Implement
  ↓
Verify
  ↓
Review changed files
  ↓
git status
  ↓
Run all required checks
  ↓
Review staged changes
  ↓
git commit
  ↓
git push
  ↓
Verify push result
  ↓
Run consolidated live E2E
  ↓
Production sign-off
```

Never claim a command passed unless it was actually executed and passed.

Never push unverified code.

The consolidated live E2E round happens after the final code push.

## 13. Current Release Plan

```text
V1.1 Repository Audit
          ↓
M11 Test Infrastructure
          ↓
Backend Automated Tests
          ↓
Frontend Lint and Build
          ↓
Fix Verified Issues
          ↓
Final Local Verification
          ↓
README + LICENSE + Context Finalization
          ↓
Final Git Review and Push
          ↓
Customer + Admin Live E2E
          ↓
Production Sign-off
          ↓
NeoCart Nova V1.1 Closed
```

## 14. Final Closure Criteria

NeoCart Nova V1.1 can be marked fully closed only after:

1. Necessary code changes are complete.
2. Automated tests have actually passed.
3. Frontend lint and production build pass.
4. Backend type-check and production build pass.
5. Documentation matches the final implementation.
6. Final changes are pushed to GitHub.
7. Customer and admin live E2E workflows are verified.
8. Critical production issues are resolved or explicitly documented.
9. Credential exposure follow-up is completed.

After closure, move the project to maintenance and portfolio status.

Do not restart architecture or begin another feature cycle unless a future scope is explicitly defined.

**This file is the current-state handoff document for NeoCart Nova V1.1.**

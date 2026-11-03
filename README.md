# NeoCart Nova

A full-stack e-commerce platform built with Next.js, TypeScript, Express, MongoDB, and secure cookie-based authentication. NeoCart Nova is designed as a practical portfolio project demonstrating real-world storefront, administration, product, cart, checkout, and order-management workflows.

**Live application:** https://neo-cart-nova.vercel.app  
**Backend API:** https://neocart-nova-backend.onrender.com  
**Repository:** https://github.com/OmBaisane/NeoCart-Nova

---

## Overview

NeoCart Nova is an independently built e-commerce application with separate customer and admin experiences.

The project focuses on:

- Full-stack application architecture
- Secure authentication and role-based authorization
- Product catalog and inventory management
- Cart validation and checkout
- Order lifecycle management
- Server-side validation and business rules
- Maintainable code and production-oriented security practices

The older PHP/MySQL NeoCart project was used only as a reference. This application was built using the current architecture described below.

## Features

### Customer storefront

- Responsive storefront and home page
- Featured products and categories
- Product catalog and product details
- Product image gallery
- Search, filtering, sorting, and pagination
- Product ratings and reviews

### Authentication and account

- User registration and login
- Logout and protected routes
- JWT authentication using HttpOnly cookies
- Profile and shipping-address management
- Password management
- Role-based admin authorization

### Shopping cart

- Add, update, and remove cart items
- Persistent user cart
- Server-side cart validation
- Stock and current-price validation

### Checkout and orders

- Cash on Delivery checkout
- Server-side price and total calculation
- Inventory validation during checkout
- Transaction-based order creation
- Historical product snapshots in orders
- Order history and order details
- Eligible order cancellation
- Inventory restoration after cancellation
- Order tracking and status updates

### Reviews

- 1–5 star ratings and written reviews
- Review ownership validation
- One review per user per product
- Review editing and deletion
- Product rating and review-count recalculation

### Admin portal

- Admin-only dashboard
- Product creation and editing
- Product activation and deactivation
- Inventory management
- Category management
- Order listing and management
- Order-status updates
- Customer directory and dashboard statistics

## Business Rules

- Product slugs are unique.
- Prices cannot be negative; a discount price must be lower than the original price.
- Stock must be a non-negative integer.
- Inactive products are unavailable for normal customer purchases.
- Cart totals and checkout totals are validated server-side.
- Orders retain product snapshots so historical orders do not depend on mutable product data.
- Checkout and cancellation use MongoDB transactions.
- Inventory restoration must not occur repeatedly for the same cancellation.
- Order status changes follow defined transition rules.
- For Cash on Delivery, payment is marked paid when the order is delivered.

Product deletion in the admin workflow uses deactivation rather than destructive deletion, preserving historical references.

## Technology Stack

### Frontend

- Next.js 16.4.3 (App Router)
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Lucide React
- shadcn/ui components

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Zod

### Security

- JWT authentication with HttpOnly cookies
- bcryptjs password hashing
- Role-based authorization
- Secure production cookie configuration
- Strict CORS configuration
- CSRF Origin/Referer protection
- Helmet security headers
- Authentication rate limiting
- Server-side validation
- Bounded and escaped search queries
- Production environment validation

## Project Structure

```text
NeoCart-Nova/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── ...
│   └── package.json
│
├── LICENSE
└── README.md
```

The actual repository structure is the source of truth if implementation folders change.

## Getting Started

### Prerequisites

- Node.js compatible with the project dependencies
- npm
- MongoDB connection string
- Environment variables configured separately for frontend and backend

### 1. Clone the repository

```bash
git clone https://github.com/OmBaisane/NeoCart-Nova.git
cd NeoCart-Nova
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

Configure the frontend environment variables using the project's environment example and actual validation requirements.

Start the frontend development server:

```bash
npm run dev
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

Configure the backend environment variables using the project's environment example and actual validation requirements. Do not commit `.env` files or expose credentials.

Start the backend development server:

```bash
npm run dev
```

The exact environment variable names and required values should be taken from the current frontend and backend environment validation files. Never use production credentials in local development or automated tests.

## Testing and Quality Checks

### Backend

Run from the `backend` directory:

```bash
npm test
npm run type-check
npm run build
npm audit
```

**Latest verified results:**

- 16 test files passed
- 205 tests passed
- TypeScript type-check passed
- Production build passed
- Dependency audit: 0 vulnerabilities

### Frontend

Run from the `frontend` directory:

```bash
npm run lint
npm run build
npm audit
npm audit --omit=dev
```

**Latest verified results:**

- ESLint passed
- Next.js production build passed
- TypeScript validation passed during build
- 21 static pages generated
- Production dependency audit (`npm audit --omit=dev`): 0 vulnerabilities
- Full dependency audit: 15 moderate findings in the development-only ESLint/tooling dependency tree

A forced breaking downgrade was intentionally avoided. The development-tooling findings are documented rather than hidden; the production dependency audit is clean.

### Testing limitations

Passing automated tests, lint, builds, and dependency audits do not by themselves establish that every deployed customer/admin workflow or real MongoDB transaction has been verified end to end.

Do not interpret mock-based tests as proof of full production database transaction integration.

## Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Production environment variables must be configured in the relevant hosting dashboards. Never commit secrets, access tokens, database credentials, or private environment files.

## Current Release Status — V1.1

### Local verification

- Backend automated tests, type-check, and build passed.
- Backend dependency audit reports zero vulnerabilities.
- Frontend lint and production build passed.
- Frontend production dependency audit reports zero vulnerabilities.
- Frontend full audit reports 15 moderate development-tooling findings.

### Live verification

The following live workflows have been confirmed:

- Admin product edit page loads and product updates work.
- Product details page and product images have been checked.

The remaining customer, admin, security, and production smoke-test workflows still require consolidated live verification. Therefore, this README does not claim that the entire production E2E checklist is complete.

## Security and Data Handling

- Never commit `.env` files, passwords, JWTs, database credentials, or API keys.
- Keep authentication tokens in secure HttpOnly cookies.
- Keep production CORS and cookie settings restrictive.
- Validate user input on the server.
- Protect admin routes with role-based authorization.
- Use a separate test database or isolated environment for automated tests.
- Do not run destructive automated tests against production customer data.
- Keep seed scripts development-only and protected from production execution.

## Future Scope

Additional features may be considered in a separately scoped release. The current V1.1 scope should remain stable during final verification; avoid adding unrelated features during release closure.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**NeoCart Nova** — a full-stack e-commerce project focused on practical engineering, secure workflows, and maintainable implementation.

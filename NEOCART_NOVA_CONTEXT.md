# NeoCart Nova — Project Context & Master Specifications

## 1. Project Overview

- **Name:** NeoCart Nova
- **Type:** Full-Stack Production-Grade E-Commerce Platform
- **Architecture:** Monorepo with strict logical decoupling
  - **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query
  - **Backend:** Node.js, Express, TypeScript, Mongoose
  - **Database:** MongoDB
  - **Auth:** JWT using secure HttpOnly cookies (No localStorage token storage)

## 2. Brand Identity & Design Tokens

- **Logo Identity:** Stylized geometric 'N' arrow with 4-point star accent[cite: 3]
- **Color Palette:**
  - **Deep Indigo:** `#0B0F19` (Background / Surfaces / Primary Dark)[cite: 3]
  - **Electric Blue:** `#2563EB` (Primary Action / Accents)[cite: 3]
  - **Cyan Accent:** `#06B6D4` (Highlights / Stars / Interactive)[cite: 3]
  - **Neutral Light:** `#F8FAFC` (Storefront light background)
  - **Surface White:** `#FFFFFF`
  - **Deep Charcoal:** `#0F172A` (Typography)

## 3. Security & Validation Rules

- **Passwords:** Minimum 8 characters, hashed using `bcryptjs` via Mongoose pre-save hook.
- **Sessions:** JWT with 7-day expiration, stored strictly in `httpOnly`, `sameSite`, and environment-aware `secure` cookies.
- **Request Boundaries:** Strict server-side Zod validation before controller execution.
- **Business Logic Guard:** Zero trust on frontend prices, totals, or inventory numbers. Backend calculates all order totals and validates live stock.

## 4. Locked V1 Scope

- **Customer Storefront:** Landing page, product catalog, search, filter (category/price), sort, product details, ratings/reviews.
- **Authentication:** Register, login, logout, profile view, HttpOnly cookie sessions, protected customer and admin routes.
- **Shopping Flow:** Server-validated Cart, stock checks, Checkout, Shipping details, Cash on Delivery (COD).
- **Orders:** Order snapshot creation, tracking number, status tracking, customer order history, cancellation.
- **Reviews:** 1–5 rating, comment, 1 review per user/product, edit/delete own review.
- **Admin Portal:** Protected Dashboard, product CRUD, inventory management, order status update, customer management.

## 5. Architectural Rules

- Never duplicate business/database logic inside Next.js API routes; Express handles all REST APIs.
- Never trust frontend calculations for prices, discounts, totals, or stock.
- Every completed milestone must follow: Explain -> Implement -> Verify -> Git commit/push -> Report -> Wait.

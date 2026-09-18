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

## 3. Development Phases Roadmap

- **Phase 1 — Foundation (Completed):**
  - Git repository & monorepo hygiene (`.gitignore`, `.env.example`).
  - Next.js App Router + TypeScript + Tailwind CSS v4 setup.
  - Node.js + Express + TypeScript backend scaffolding.
  - MongoDB + Mongoose connection lifecycle & error events.
  - Official vector logo component & base layout.
- **Phase 2 — Backend Core (In Progress):**
  - Database Models (User, Category, Product, Cart, Order, Review).
  - Authentication (JWT HttpOnly cookies, password hashing with bcrypt, 8-character min).
  - Middlewares (`protect`, `adminOnly`, Zod validation, central error handler).
  - Core REST APIs (Auth, Users, Products, Categories, Cart, Orders, Reviews, Admin).
  - Server-side business logic & stock validation.
- **Phase 3 — Frontend Core:**
  - Storefront UI, design system, responsive Navbar & Footer.
  - Home landing, Product listing (search, filter, sort, pagination).
  - Product details & customer reviews.
  - Authentication UI (Register, Login, Profile).
  - Persistent Cart & Checkout flow (Cash on Delivery).
  - Order success & tracking pages.
  - TanStack Query server-state integration.
- **Phase 4 — Admin Portal:**
  - Admin authentication & authorization.
  - Admin Dashboard analytics overview.
  - Product CRUD & live inventory/stock management.
  - Order management (status transitions: pending -> confirmed -> processing -> shipped -> delivered -> cancelled, tracking numbers).
  - Customer directory view.
- **Phase 5 — Integration & Polish:**
  - Full end-to-end integration, loading skeletons, empty states, error boundaries.
  - Edge cases (stock race conditions, price manipulation guard, cart clearance on order).
  - Accessibility & mobile responsiveness audit.
- **Phase 6 — Production & Deployment:**
  - Production environment configs, CORS, secure cookies.
  - Backend & frontend deployments.

## 4. Architectural & Security Rules

- Never duplicate business/database logic inside Next.js API routes; Express handles all REST APIs.
- Never trust frontend calculations for prices, discounts, totals, or stock. All order totals are calculated server-side.
- Passwords must be minimum 8 characters and hashed with bcrypt.
- Passwords must never leak (`select: false`).
- Terminal-first, milestone-by-milestone approach: Explain -> Implement -> Verify -> Git commit/push -> Report -> Wait for "Done bhai ab next".

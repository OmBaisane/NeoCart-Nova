# 🛍️ NeoCart Nova

A production-oriented full-stack e-commerce platform built with Next.js 16, React, TypeScript, Node.js, Express, and MongoDB Atlas.

NeoCart Nova demonstrates practical full-stack engineering through secure authentication, product discovery, persistent shopping, inventory management, transaction-aware order processing, and a dedicated administration portal.

**Live Storefront:** https://neo-cart-nova.vercel.app

**Backend API:** https://neocart-nova-backend.onrender.com/api

**GitHub Repository:** https://github.com/OmBaisane/NeoCart-Nova

---

## 🌟 Overview

NeoCart Nova is a modern e-commerce application built from scratch with a clear separation between the frontend, REST API, and database layers.

The project focuses on realistic e-commerce workflows and production-oriented engineering practices rather than basic CRUD functionality alone.

### Highlights

- Customer storefront and product discovery
- Secure authentication and role-based authorization
- Persistent shopping cart
- Stock-aware checkout with Cash on Delivery
- Transaction-based order processing
- Order history, tracking, and cancellation
- Product reviews and ratings
- Dedicated administration portal
- Product, category, inventory, and order management
- Input validation and application security
- Responsive user interface

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────┐
│              Next.js Frontend            │
│       App Router · React · TypeScript    │
│       Tailwind CSS · TanStack Query      │
└─────────────────────┬────────────────────┘
                      │
               REST API + Cookies
                      │
┌─────────────────────▼────────────────────┐
│             Express Backend              │
│        Node.js · TypeScript · Zod         │
│                 Mongoose                 │
└─────────────────────┬────────────────────┘
                      │
               MongoDB Connection
                      │
┌─────────────────────▼────────────────────┐
│               MongoDB Atlas              │
│              Cloud Database              │
└──────────────────────────────────────────┘
```

The frontend communicates with the backend through REST APIs. The backend handles authentication, authorization, validation, business logic, and database operations.

---

## ✨ Features

### 👤 Customer Experience

**Product Discovery**

- Product catalog and product detail pages
- Keyword search
- Category and price filtering
- Sorting and pagination
- Featured products
- Product image gallery

**Authentication and Account**

- User registration and login
- JWT-based authentication
- Secure HttpOnly authentication cookies
- Protected account routes
- Profile management
- Shipping address management
- Password management

**Shopping**

- Persistent user cart
- Add, update, and remove cart items
- Server-side stock validation
- Cart validation and price synchronization

**Checkout and Orders**

- Cash on Delivery checkout
- Server-side price and total calculation
- Stock validation during checkout
- Transaction-based order creation
- Historical product and price snapshots
- Order history and details
- Tracking numbers
- Eligible order cancellation
- Inventory restoration after cancellation

**Reviews**

- 1–5 star product ratings
- Written product reviews
- One review per user per product
- Review ownership validation
- Review editing and deletion
- Product rating and review-count calculation

### 🛡️ Admin Portal

The administration experience is separated from the public storefront and protected by backend authorization.

**Dashboard and Analytics**

- Store statistics and dashboard information
- Product and customer statistics
- Inventory monitoring

**Product and Category Management**

- Create and edit products
- Product inventory management
- Product activation and deactivation
- Category management

**Order Management**

- Review customer orders
- Review order details
- Manage order fulfillment
- Apply validated order-status transitions
- Manage tracking information

**Customer Management**

- View registered users
- Review customer information
- Review user roles

---

## 📦 Order Lifecycle

The backend supports defined order-status transitions.

```text
Pending
   ├── Confirmed
   ├── Processing
   └── Cancelled

Confirmed
   ├── Processing
   ├── Shipped
   └── Cancelled

Processing
   ├── Shipped
   └── Cancelled

Shipped
   └── Delivered
```

Delivered and cancelled orders are terminal states.

For Cash on Delivery, payment is marked as paid when the order is delivered, according to the backend business rules.

Cancellation and inventory restoration are handled through transaction-aware backend operations.

---

## 🔒 Security and Reliability

Security and data consistency are important parts of NeoCart Nova.

**Authentication and Authorization**

- JWT-based authentication
- HttpOnly cookies
- Password hashing with bcryptjs
- Protected API routes
- Admin-only authorization
- Ownership checks for user-specific resources

**Request Validation**

- Zod runtime validation
- Server-side input validation
- Server-side price and total calculation
- Server-side stock validation
- Environment variable validation

**Application Security**

- Helmet security headers
- CORS configuration
- CSRF Origin/Referer protection
- Authentication rate limiting
- Secure production cookie configuration
- Search input and regular-expression hardening
- Centralized error handling
- Production-safe error responses

**Data Consistency**

- MongoDB transactions for critical order workflows
- Atomic inventory updates
- Historical order item snapshots
- Cart concurrency protection
- Unique constraints for important records

Transaction support requires a MongoDB deployment configured to support transactions, such as a replica-set deployment.

---

## 🛠️ Tech Stack

| Layer            | Technologies                                      |
| ---------------- | ------------------------------------------------- |
| Frontend         | Next.js 16, React 19, TypeScript                  |
| Styling          | Tailwind CSS                                      |
| Data fetching    | TanStack Query, Axios                             |
| Icons            | Lucide React                                      |
| Backend          | Node.js, Express 5, TypeScript                    |
| Database         | MongoDB Atlas, Mongoose                           |
| Validation       | Zod                                               |
| Authentication   | JWT, bcryptjs, HttpOnly cookies                   |
| Security         | Helmet, CORS, express-rate-limit, CSRF protection |
| Frontend hosting | Vercel                                            |
| Backend hosting  | Render                                            |

---

## 📁 Project Structure

```text
NeoCart-Nova/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── providers/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── LICENSE
├── README.md
└── NEOCART_NOVA_CONTEXT.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22
- npm
- Git
- MongoDB Atlas account or a transaction-capable MongoDB deployment

### 1. Clone the Repository

```bash
git clone https://github.com/OmBaisane/NeoCart-Nova.git
cd NeoCart-Nova
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal at the repository root:

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create `backend/.env` using `backend/.env.example` as the reference.

Example:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:3000
```

Create `frontend/.env.local` using `frontend/.env.example` as the reference.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Use the exact variable names and any additional required values documented in the environment example files.

**Security reminders**

- Never commit `.env` or `.env.local`.
- Never expose database credentials or JWT secrets.
- Do not use production credentials in local testing.
- Keep development seeding separate from production.

### 5. Start the Backend

From the `backend` directory:

```bash
npm run dev
```

### 6. Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

Open:

http://localhost:3000

---

## 🧪 Testing and Verification

Testing is part of the NeoCart Nova V1.1 quality and release process.

### Backend

The backend includes an automated Vitest suite covering utility functions, validation, models, authentication, authorization, middleware, and selected controller behavior.

**Verified backend test result:**

- 15 test files
- 197 tests passing

Verified commands:

```bash
npm run type-check
npm test
npm run build
npm audit
```

The backend dependency audit reports **0 vulnerabilities**.

### Frontend

Verified commands:

```bash
npm run lint
npm run build
```

The frontend production dependency audit reports **0 vulnerabilities**.

Some moderate findings remain in the development-only ESLint dependency tree. They are documented rather than addressed through potentially breaking dependency downgrades.

### Remaining Verification

Live customer and admin workflows still require final production verification.

Passing local automated checks does not, by itself, establish that every production workflow has been verified.

---

## 🌐 Live Deployment

| Service     | URL                                           |
| ----------- | --------------------------------------------- |
| Storefront  | https://neo-cart-nova.vercel.app              |
| Backend API | https://neocart-nova-backend.onrender.com/api |
| GitHub      | https://github.com/OmBaisane/NeoCart-Nova     |

The application uses Vercel for the frontend, Render for the backend, and MongoDB Atlas for persistent data storage.

---

## 🎯 Project Goals

NeoCart Nova was built to strengthen practical understanding of:

- Full-stack application architecture
- REST API design
- Authentication and authorization
- Database modeling and relationships
- MongoDB transactions
- Inventory consistency
- Server-side validation
- Application security
- Frontend state management
- Error handling
- Responsive UI development
- Accessibility
- Production deployment

The project emphasizes understanding the engineering decisions behind real-world features, not simply making the application work.

---

## 📄 License

NeoCart Nova is licensed under the **MIT License**.

See the [LICENSE](./LICENSE) file for the complete license text.

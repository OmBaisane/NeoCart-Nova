🛍️ NeoCart Nova

A production-oriented full-stack e-commerce platform built from scratch with Next.js 16, TypeScript, Node.js, Express, and MongoDB Atlas.

NeoCart Nova focuses on real-world e-commerce workflows, secure authentication, reliable inventory management, transaction-safe order processing, and a responsive user experience.

---

🌟 Overview

NeoCart Nova is a modern e-commerce application designed to demonstrate production-oriented full-stack development rather than just basic CRUD functionality.

The platform includes:

- Customer-facing storefront and product discovery
- Secure authentication and authorization
- Persistent shopping cart
- Stock-aware checkout
- Transaction-safe order processing
- Order tracking and cancellation
- Product reviews and ratings
- Dedicated administration portal
- Inventory and order management
- Production-focused security and validation

The application was built from scratch with a clear separation between the frontend, REST API, and database layers.

---

🏗️ Architecture

┌─────────────────────────────────────────────┐
│ Next.js 16 Frontend │
│ App Router + React + TanStack Query │
└──────────────────────┬──────────────────────┘
│
REST API + Secure
HttpOnly Cookies
│
┌──────────────────────▼──────────────────────┐
│ Node.js + Express Backend │
│ TypeScript + Zod + Mongoose │
└──────────────────────┬──────────────────────┘
│
Mongoose / Sessions
│
┌──────────────────────▼──────────────────────┐
│ MongoDB Atlas │
│ Persistent Cloud Database │
└─────────────────────────────────────────────┘

---

✨ Core Features

👤 Customer Experience

Product Discovery

- Product catalog
- Keyword search
- Category filtering
- Price range filtering
- Multi-criteria sorting
- Responsive pagination
- Product detail pages

Authentication & Profile

- User registration and login
- Email-based authentication
- JWT-based authentication
- Secure HttpOnly cookies
- Protected routes
- Profile management
- Role-based authorization

Shopping Cart

- Persistent cart
- Server-side stock validation
- Quantity management
- Automatic cart synchronization
- TanStack Query cache synchronization

Checkout & Orders

- Cash on Delivery checkout
- Server-side price and total validation
- Stock validation during checkout
- Transaction-safe inventory updates
- Order history
- Order details
- Human-readable tracking numbers
- Order cancellation
- Automatic stock restoration after eligible cancellation

Reviews

- 1–5 star ratings
- Product reviews
- One review per user per product
- Review ownership validation
- Review editing
- Review deletion

---

🛡️ Admin Management

NeoCart Nova includes a dedicated administrative experience separated from the public storefront.

Dashboard

- Product and catalog statistics
- Registered user statistics
- Low-stock monitoring
- Out-of-stock monitoring

Product & Inventory Management

- Create products
- Edit products
- Manage inventory
- Monitor stock levels
- Configure stock thresholds
- Soft-delete/deactivate products
- Category management

Order Management

- View customer orders
- Update order status
- Manage fulfillment workflow
- Generate tracking numbers

Order lifecycle:

Pending → Confirmed → Shipped → Delivered

Customer Management

- View registered customers
- Review contact information
- View saved shipping information
- Review user roles

---

🔒 Security & Reliability

Security and data consistency were major considerations throughout the project.

Authentication

- JWT-based authentication
- Secure HttpOnly cookies
- Password hashing with bcrypt
- Protected API routes
- Role-based authorization
- Ownership checks for user-specific resources

Request & Data Validation

- Zod schema validation
- Server-side input validation
- Server-side price validation
- Server-side order total calculation
- Server-side inventory validation
- Environment variable validation

Application Security

- Helmet security headers
- CORS configuration
- CSRF protection
- API rate limiting
- Search/input hardening
- Secure cookie configuration
- Centralized error handling

Data Consistency

Checkout and cancellation operations use MongoDB transactions where multiple related database changes must succeed together.

This helps maintain consistency between:

- Orders
- Order items
- Product inventory
- Cart state

Inventory updates are also handled with server-side checks and atomic database operations to reduce the risk of overselling.

---

🛠️ Tech Stack

Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Lucide React

Backend

- Node.js
- Express.js
- TypeScript
- Mongoose

Database

- MongoDB Atlas

Validation & Security

- Zod
- JSON Web Tokens (JWT)
- bcryptjs
- Helmet
- Express Rate Limit
- CSRF protection

Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

📁 Project Structure

NeoCart-Nova/
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── hooks/
│ ├── lib/
│ └── ...
│
├── backend/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── utils/
│ └── ...
│
└── README.md

---

🚀 Getting Started

Prerequisites

- Node.js 18+
- MongoDB Atlas account or local MongoDB instance

1. Clone the Repository

git clone https://github.com/your-username/neocart-nova.git
cd neocart-nova

2. Install Dependencies

Backend:

cd backend
npm install

Frontend:

cd ../frontend
npm install

3. Configure Environment Variables

Backend — "backend/.env"

PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000

Frontend — "frontend/.env.local"

NEXT_PUBLIC_API_URL=http://localhost:5000/api

«Never commit real credentials, JWT secrets, or database connection strings to the repository.»

4. Run the Development Servers

Backend:

cd backend
npm run dev

Frontend:

cd frontend
npm run dev

Open:

http://localhost:3000

---

🌐 Live Project

Frontend:
https://neo-cart-nova.vercel.app

Backend API:
https://neocart-nova-backend.onrender.com/api

---

📸 Project Highlights

NeoCart Nova includes dedicated experiences for:

- Product discovery
- Product details and reviews
- Shopping cart
- Checkout
- Order management
- User profile
- Admin dashboard
- Inventory management
- Order fulfillment

---

🎯 Project Goals

The primary goal of NeoCart Nova was to build a realistic full-stack e-commerce system while strengthening practical understanding of:

- Full-stack architecture
- REST API design
- Authentication & authorization
- Database modeling
- Transaction handling
- Inventory consistency
- Server-side validation
- Application security
- State management
- Error handling
- Accessibility
- Responsive UI
- Production deployment

The project emphasizes understanding the engineering decisions behind the features, not simply making the application work.

---

📄 License

This project is licensed under the MIT License.

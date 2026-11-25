
# BistroPOS — Restaurant POS & Order Management System

A full-stack web-based Point-of-Sale (POS) and Order Management System for restaurants, cafés, and quick-service restaurants.

---

## 1. Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19 (JavaScript), Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (`jsonwebtoken`), `bcryptjs`, Role-Based Access Control (`Admin`, `Staff`)
- **Testing:** Node.js built-in test runner (`node --test`)

---

## 2. Key Features & Business Rules

### 1. Authentication & Access Control

- JWT-based login (`POST /api/auth/login`) and session verification (`GET /api/auth/me`).
- Two roles: `Admin` and `Staff`.
- Admin can create, edit, and manage menu availability.
- Staff can browse menus, manage orders, record payments, and view sales reports.

### 2. Menu Management (`/menu`)

- Create, view, edit, activate, and deactivate menu items.
- Category filtering: `Starters`, `Mains`, `Sides`, `Beverages`, `Desserts`.
- Live text search.

### 3. POS Order Creation (`/pos`)

- Supports **Dine-In** (table number required) and **Takeaway** orders.
- Optional customer name.
- Add, remove, and update item quantities.
- Apply optional discounts.
- Generates unique order numbers (`ORD-YYYYMMDD-XXXX`).
- Unavailable items are disabled in the UI and rejected by the backend (`400 Bad Request`).

### 4. Server-Side Billing

- Live bill preview on the frontend.
- Backend calculates authoritative prices using MongoDB menu data.
- Calculates subtotal, discount, tax (`TAX_RATE_PERCENT`), and final total.
- Validates discount limits (`0 <= discount <= subtotal`).
- Client-submitted prices and totals are never trusted.

### 5. Order Management, Payments & Receipts (`/orders`)

- Sequential order workflow:

  `Pending → Preparing → Ready → Completed`
- Skipping or reversing order statuses is rejected (`400 Bad Request`).
- Payment methods: `Cash`, `UPI`, and `Card`.
- Prevents duplicate payments.
- Search and filter orders by order number, table number, customer name, and status.
- Print-friendly receipts using `@media print` CSS.

### 6. Daily Sales Dashboard (`/dashboard`)

- Total orders and completed orders.
- Daily paid sales and unpaid bills.
- Payment method breakdown (`Cash`, `UPI`, `Card`).
- Recent orders for a selected date.

---

## 3. Project Structure

```
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js                 # Express setup, CORS, routes, centralized error handler
│   │   ├── server.js              # MongoDB connection and HTTP server startup
│   │   ├── config/
│   │   │   ├── db.js              # Mongoose connection helper
│   │   │   └── env.js             # Environment variable parser
│   │   ├── models/
│   │   │   ├── User.js            # User schema + bcrypt password comparison
│   │   │   ├── MenuItem.js        # Menu item schema & categories
│   │   │   └── Order.js           # Order items, billing breakdown, status, payment
│   │   ├── middleware/
│   │   │   ├── asyncHandler.js    # Async route error forwarding
│   │   │   ├── auth.js            # JWT verification & role authorization
│   │   │   └── errorHandler.js    # Consistent JSON error responses
│   │   ├── utils/
│   │   │   ├── AppError.js        # Custom HTTP error class
│   │   │   ├── billing.js         # Server-side subtotal, discount, tax, total logic
│   │   │   ├── orderNumber.js     # Unique order number generator
│   │   │   └── orderWorkflow.js   # Sequential state transition rules
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   └── reportController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   └── reportRoutes.js
│   │   └── seed/
│   │       └── seedData.js        # Idempotent database seed script
│   └── tests/
│       ├── billing.test.js        # Unit tests for billing calculations & validation
│       ├── orderWorkflow.test.js  # Unit tests for status transitions
│       └── api.test.js            # Integration tests against Express + MongoDB
└── frontend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── app/
        │   ├── page.js            # Auth-aware root redirect (/dashboard or /login)
        │   ├── login/page.js      # Sign-in page with validation & demo fill buttons
        │   ├── dashboard/page.js  # Daily sales metrics & recent orders
        │   ├── pos/page.js        # POS order builder & live bill preview
        │   ├── orders/page.js     # Kitchen status workflow, payments & print receipt
        │   └── menu/page.js       # Menu browsing & Admin CRUD/availability management
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedLayout.jsx
        │   ├── ReceiptModal.jsx
        │   └── StatusBadge.jsx
        └── lib/
            ├── api.js             # Fetch wrapper with JWT header & error normalization
            ├── auth.js            # localStorage session helpers
            └── format.js          # Currency & date formatting helpers
```

---

## 4. Environment Variables

### Backend (`backend/.env`)

| Variable           | Description                      | Example                                    |
| ------------------ | -------------------------------- | ------------------------------------------ |
| `PORT`             | Express server port              | `5000`                                     |
| `NODE_ENV`         | Runtime mode                     | `development`                              |
| `MONGODB_URI`      | MongoDB connection string        | `mongodb://127.0.0.1:27017/restaurant_pos` |
| `JWT_SECRET`       | JWT signing secret               | `replace-with-a-long-random-secret-key`    |
| `JWT_EXPIRES_IN`   | Token expiration                 | `1d`                                       |
| `TAX_RATE_PERCENT` | Configurable tax percentage      | `5`                                        |
| `CLIENT_ORIGIN`    | Allowed frontend origin for CORS | `http://localhost:3000`                    |

### Frontend (`frontend/.env.local`)

| Variable                       | Description                     | Example                     |
| ------------------------------ | ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`          | Backend API URL                 | `http://localhost:5000/api` |
| `NEXT_PUBLIC_TAX_RATE_PERCENT` | Tax percentage for live preview | `5`                         |

Secrets are excluded via `.gitignore`. Placeholder templates are provided in both `.env.example` files.

---

## 5. Local Setup & Database Seeding

### Step 1: Install Dependencies

```
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Configure Environment Files

Create the environment files using the provided templates:

```
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### Step 3: Seed MongoDB

Ensure MongoDB is running locally or configure MongoDB Atlas in `backend/.env`.

```
cd backend
npm run seed
```

**Seeded Demo Accounts:**

| Role  | Email             | Password    |
| ----- | ----------------- | ----------- |
| Admin | `admin@pos.local` | `Admin@123` |
| Staff | `staff@pos.local` | `Staff@123` |

The seed script also populates 10 menu items (including 1 unavailable item) and 3 sample orders if the orders collection is empty.

### Step 4: Run the Application

**Terminal 1 — Backend (`http://localhost:5000`)**

```
cd backend
npm run dev
```

**Terminal 2 — Frontend (`http://localhost:3000`)**

```
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 6. API Reference

All endpoints except `/api/health` and `/api/auth/login` require `Authorization: Bearer <token>`.

| Method  | Endpoint                   | Access        | Description                                                            |
| ------- | -------------------------- | ------------- | ---------------------------------------------------------------------- |
| `GET`   | `/api/health`              | Public        | Health check and active `taxRatePercent`                               |
| `POST`  | `/api/auth/login`          | Public        | Authenticate user and return JWT + user info                           |
| `GET`   | `/api/auth/me`             | Authenticated | Return current authenticated user profile                              |
| `GET`   | `/api/menu`                | Authenticated | List menu items (`category`, `search`, `available` filters)            |
| `POST`  | `/api/menu`                | Admin only    | Create a new menu item                                                 |
| `PUT`   | `/api/menu/:id`            | Admin only    | Update an existing menu item                                           |
| `PATCH` | `/api/menu/:id/status`     | Admin only    | Activate or deactivate (`isAvailable`) a menu item                     |
| `POST`  | `/api/orders`              | Authenticated | Create order with server-calculated totals                             |
| `GET`   | `/api/orders`              | Authenticated | List orders (`status`, `search`, `orderType`, `paymentStatus`)         |
| `GET`   | `/api/orders/:id`          | Authenticated | Get full details of a single order                                     |
| `PATCH` | `/api/orders/:id/status`   | Authenticated | Advance order status (`Pending` → `Preparing` → `Ready` → `Completed`) |
| `POST`  | `/api/orders/:id/payment`  | Authenticated | Record payment (`Cash`, `UPI`, or `Card`)                              |
| `GET`   | `/api/reports/daily-sales` | Authenticated | Daily order counts, paid sales, payment breakdown & recent orders      |

**Error Format:**

All errors return consistent JSON with an appropriate HTTP status code (`400`, `401`, `403`, `404`, `409`, `500`).

```
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 7. Running Tests

**Backend unit and integration tests:**

Uses a separate `restaurant_pos_test` database and cleans up automatically.

```
cd backend
npm test
```

**Frontend production build:**

```
cd frontend
npm run build
```

---

## 8. Deployment Guide

### 1. Database (MongoDB Atlas)

- Create a free MongoDB Atlas cluster.
- Configure network access (`0.0.0.0/0` or backend host IPs).
- Copy the connection URI including the database name.

Example:

```
.../restaurant_pos?retryWrites=true&w=majority
```

### 2. Backend (Render / Railway / Fly.io)

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Configure these environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `TAX_RATE_PERCENT`
- `CLIENT_ORIGIN` (deployed frontend URL, without trailing slash)

Seed the production database once:

```
MONGODB_URI="<atlas-uri>" npm run seed
```

Alternatively, temporarily use `npm run seed && npm start` as the Start Command for the first deployment, then switch back to `npm start`.

### 3. Frontend (Vercel / Netlify)

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`

Configure:

```
NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api
NEXT_PUBLIC_TAX_RATE_PERCENT=5
```

Add a clear project overviewAdd request and response examplesBelow is the cleaned-up Markdown version. I have preserved the **original project structure, all API endpoints, environment variables, demo credentials, commands, and technical details** without changing them. Only unnecessary repetition and lengthy explanations have been removed.

# BistroPOS — Restaurant POS & Order Management System

A full-stack web-based Point-of-Sale (POS) and Order Management System for restaurants, cafés, and quick-service restaurants.

---

## 1. Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19 (JavaScript), Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (`jsonwebtoken`), `bcryptjs`, Role-Based Access Control (`Admin`, `Staff`)
- **Testing:** Node.js built-in test runner (`node --test`)

---

## 2. Key Features & Business Rules

### 1. Authentication & Access Control

- JWT-based login (`POST /api/auth/login`) and session verification (`GET /api/auth/me`).
- Two roles: `Admin` and `Staff`.
- Admin can create, edit, and manage menu availability.
- Staff can browse menus, manage orders, record payments, and view sales reports.

### 2. Menu Management (`/menu`)

- Create, view, edit, activate, and deactivate menu items.
- Category filtering: `Starters`, `Mains`, `Sides`, `Beverages`, `Desserts`.
- Live text search.

### 3. POS Order Creation (`/pos`)

- Supports **Dine-In** (table number required) and **Takeaway** orders.
- Optional customer name.
- Add, remove, and update item quantities.
- Apply optional discounts.
- Generates unique order numbers (`ORD-YYYYMMDD-XXXX`).
- Unavailable items are disabled in the UI and rejected by the backend (`400 Bad Request`).

### 4. Server-Side Billing

- Live bill preview on the frontend.
- Backend calculates authoritative prices using MongoDB menu data.
- Calculates subtotal, discount, tax (`TAX_RATE_PERCENT`), and final total.
- Validates discount limits (`0 <= discount <= subtotal`).
- Client-submitted prices and totals are never trusted.

### 5. Order Management, Payments & Receipts (`/orders`)

- Sequential order workflow:

  `Pending → Preparing → Ready → Completed`
- Skipping or reversing order statuses is rejected (`400 Bad Request`).
- Payment methods: `Cash`, `UPI`, and `Card`.
- Prevents duplicate payments.
- Search and filter orders by order number, table number, customer name, and status.
- Print-friendly receipts using `@media print` CSS.

### 6. Daily Sales Dashboard (`/dashboard`)

- Total orders and completed orders.
- Daily paid sales and unpaid bills.
- Payment method breakdown (`Cash`, `UPI`, `Card`).
- Recent orders for a selected date.

---

## 3. Project Structure

```
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js                 # Express setup, CORS, routes, centralized error handler
│   │   ├── server.js              # MongoDB connection and HTTP server startup
│   │   ├── config/
│   │   │   ├── db.js              # Mongoose connection helper
│   │   │   └── env.js             # Environment variable parser
│   │   ├── models/
│   │   │   ├── User.js            # User schema + bcrypt password comparison
│   │   │   ├── MenuItem.js        # Menu item schema & categories
│   │   │   └── Order.js           # Order items, billing breakdown, status, payment
│   │   ├── middleware/
│   │   │   ├── asyncHandler.js    # Async route error forwarding
│   │   │   ├── auth.js            # JWT verification & role authorization
│   │   │   └── errorHandler.js    # Consistent JSON error responses
│   │   ├── utils/
│   │   │   ├── AppError.js        # Custom HTTP error class
│   │   │   ├── billing.js         # Server-side subtotal, discount, tax, total logic
│   │   │   ├── orderNumber.js     # Unique order number generator
│   │   │   └── orderWorkflow.js   # Sequential state transition rules
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   └── reportController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   └── reportRoutes.js
│   │   └── seed/
│   │       └── seedData.js        # Idempotent database seed script
│   └── tests/
│       ├── billing.test.js        # Unit tests for billing calculations & validation
│       ├── orderWorkflow.test.js  # Unit tests for status transitions
│       └── api.test.js            # Integration tests against Express + MongoDB
└── frontend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── app/
        │   ├── page.js            # Auth-aware root redirect (/dashboard or /login)
        │   ├── login/page.js      # Sign-in page with validation & demo fill buttons
        │   ├── dashboard/page.js  # Daily sales metrics & recent orders
        │   ├── pos/page.js        # POS order builder & live bill preview
        │   ├── orders/page.js     # Kitchen status workflow, payments & print receipt
        │   └── menu/page.js       # Menu browsing & Admin CRUD/availability management
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedLayout.jsx
        │   ├── ReceiptModal.jsx
        │   └── StatusBadge.jsx
        └── lib/
            ├── api.js             # Fetch wrapper with JWT header & error normalization
            ├── auth.js            # localStorage session helpers
            └── format.js          # Currency & date formatting helpers
```

---

## 4. Environment Variables

### Backend (`backend/.env`)

| Variable           | Description                      | Example                                    |
| ------------------ | -------------------------------- | ------------------------------------------ |
| `PORT`             | Express server port              | `5000`                                     |
| `NODE_ENV`         | Runtime mode                     | `development`                              |
| `MONGODB_URI`      | MongoDB connection string        | `mongodb://127.0.0.1:27017/restaurant_pos` |
| `JWT_SECRET`       | JWT signing secret               | `replace-with-a-long-random-secret-key`    |
| `JWT_EXPIRES_IN`   | Token expiration                 | `1d`                                       |
| `TAX_RATE_PERCENT` | Configurable tax percentage      | `5`                                        |
| `CLIENT_ORIGIN`    | Allowed frontend origin for CORS | `http://localhost:3000`                    |

### Frontend (`frontend/.env.local`)

| Variable                       | Description                     | Example                     |
| ------------------------------ | ------------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`          | Backend API URL                 | `http://localhost:5000/api` |
| `NEXT_PUBLIC_TAX_RATE_PERCENT` | Tax percentage for live preview | `5`                         |

Secrets are excluded via `.gitignore`. Placeholder templates are provided in both `.env.example` files.

---

## 5. Local Setup & Database Seeding

### Step 1: Install Dependencies

```
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Configure Environment Files

Create the environment files using the provided templates:

```
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### Step 3: Seed MongoDB

Ensure MongoDB is running locally or configure MongoDB Atlas in `backend/.env`.

```
cd backend
npm run seed
```

**Seeded Demo Accounts:**

| Role  | Email             | Password    |
| ----- | ----------------- | ----------- |
| Admin | `admin@pos.local` | `Admin@123` |
| Staff | `staff@pos.local` | `Staff@123` |

The seed script also populates 10 menu items (including 1 unavailable item) and 3 sample orders if the orders collection is empty.

### Step 4: Run the Application

**Terminal 1 — Backend (`http://localhost:5000`)**

```
cd backend
npm run dev
```

**Terminal 2 — Frontend (`http://localhost:3000`)**

```
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 6. API Reference

All endpoints except `/api/health` and `/api/auth/login` require `Authorization: Bearer <token>`.

| Method  | Endpoint                   | Access        | Description                                                            |
| ------- | -------------------------- | ------------- | ---------------------------------------------------------------------- |
| `GET`   | `/api/health`              | Public        | Health check and active `taxRatePercent`                               |
| `POST`  | `/api/auth/login`          | Public        | Authenticate user and return JWT + user info                           |
| `GET`   | `/api/auth/me`             | Authenticated | Return current authenticated user profile                              |
| `GET`   | `/api/menu`                | Authenticated | List menu items (`category`, `search`, `available` filters)            |
| `POST`  | `/api/menu`                | Admin only    | Create a new menu item                                                 |
| `PUT`   | `/api/menu/:id`            | Admin only    | Update an existing menu item                                           |
| `PATCH` | `/api/menu/:id/status`     | Admin only    | Activate or deactivate (`isAvailable`) a menu item                     |
| `POST`  | `/api/orders`              | Authenticated | Create order with server-calculated totals                             |
| `GET`   | `/api/orders`              | Authenticated | List orders (`status`, `search`, `orderType`, `paymentStatus`)         |
| `GET`   | `/api/orders/:id`          | Authenticated | Get full details of a single order                                     |
| `PATCH` | `/api/orders/:id/status`   | Authenticated | Advance order status (`Pending` → `Preparing` → `Ready` → `Completed`) |
| `POST`  | `/api/orders/:id/payment`  | Authenticated | Record payment (`Cash`, `UPI`, or `Card`)                              |
| `GET`   | `/api/reports/daily-sales` | Authenticated | Daily order counts, paid sales, payment breakdown & recent orders      |

**Error Format:**

All errors return consistent JSON with an appropriate HTTP status code (`400`, `401`, `403`, `404`, `409`, `500`).

```
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 7. Running Tests

**Backend unit and integration tests:**

Uses a separate `restaurant_pos_test` database and cleans up automatically.

```
cd backend
npm test
```

**Frontend production build:**

```
cd frontend
npm run build
```

---

## 8. Deployment Guide

### 1. Database (MongoDB Atlas)

- Create a free MongoDB Atlas cluster.
- Configure network access (`0.0.0.0/0` or backend host IPs).
- Copy the connection URI including the database name.

Example:

```
.../restaurant_pos?retryWrites=true&w=majority
```

### 2. Backend (Render / Railway / Fly.io)

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Configure these environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `TAX_RATE_PERCENT`
- `CLIENT_ORIGIN` (deployed frontend URL, without trailing slash)

Seed the production database once:

```
MONGODB_URI="<atlas-uri>" npm run seed
```

Alternatively, temporarily use `npm run seed && npm start` as the Start Command for the first deployment, then switch back to `npm start`.

### 3. Frontend (Vercel / Netlify)

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`

Configure:

```
NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api
NEXT_PUBLIC_TAX_RATE_PERCENT=5
```

Add a clear project overviewAdd request and response examples

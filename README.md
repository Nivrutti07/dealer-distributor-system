# Prince Piping Systems

Prince Piping Systems is a full-stack distributor and dealer portal built for managing products, orders, payments, deliveries, and analytics in a role-based workflow. The project has three main user roles:

- Dealer: browse products, add items to cart, place orders, submit payments, and track deliveries
- Admin: manage products, users, orders, payments, deliveries, and view analytics
- Traveller: accept and update delivery statuses in real time

---

## 1. Project Overview

This application connects a React frontend with an Express.js backend and a MySQL database. It is designed to support the full business flow of a piping and infrastructure distribution system.

The main goal is to provide a simple but complete portal where:

1. Dealers can browse available products and place orders.
2. Admins can review and approve orders and payments.
3. Travellers can manage delivery progress and status updates.
4. Business owners can view analytics dashboards and operational reports.

---

## 2. Key Features

### Dealer Features
- User registration and login
- JWT-based authentication
- Product browsing with search and filters
- Product details view
- Cart management
- Order placement with delivery type selection
- Payment submission for orders
- Order history and order details
- Delivery tracking for own orders
- Profile management

### Admin Features
- Admin login and secure dashboard access
- Product management (create, update, delete)
- Bulk product upload via Excel file
- User management (view users, activate/deactivate accounts)
- Order management and status updates
- Payment verification and rejection workflows
- Delivery creation and assignment
- Delivery tracking overview
- Admin analytics dashboard with charts

### Traveller Features
- View available and assigned deliveries
- Accept deliveries
- Update delivery status through workflow steps
- Track progress with location and remarks
- View delivery history and performance summary

---

## 3. Tech Stack

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- Recharts for analytics charts
- Tailwind CSS-inspired UI styling
- Lucide icons
- React Hot Toast for notifications

### Backend
- Node.js + Express.js
- MySQL database
- JWT authentication
- bcryptjs for password hashing
- Multer for file uploads
- XLSX for Excel file processing
- Razorpay integration for payment flows
- CORS enabled for frontend integration

---

## 4. Project Structure

```text
SE1/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
└── prince-piping-backend/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── server.js
    └── package.json
```

---

## 5. Setup Instructions

### Prerequisites
Make sure the following are installed:
- Node.js (recommended latest LTS)
- npm
- MySQL server

### 1) Clone and open the project
```bash
git clone <repo-url>
cd SE1
```

### 2) Install frontend dependencies
```bash
cd frontend
npm install
```

### 3) Install backend dependencies
```bash
cd ../prince-piping-backend
npm install
```

### 4) Configure the environment
Create a file named `.env` inside the backend folder with the following values:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=prince_piping_db

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1h

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

> The backend uses MySQL, so the database must exist before starting the server.

### 5) Start the backend
```bash
cd prince-piping-backend
npm run dev
```

The backend will run at:
```text
http://localhost:5000
```

### 6) Start the frontend
```bash
cd ../frontend
npm run dev
```

The frontend will run at:
```text
http://localhost:5173
```

### 7) Build for production
```bash
cd frontend
npm run build
```

---

## 6. API Endpoints

The backend exposes the API under `/api`.

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin only)
- `PUT /api/products/:id` (admin only)
- `DELETE /api/products/:id` (admin only)
- `POST /api/products/bulk-upload` (admin only)

### Categories
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` (admin only)
- `PUT /api/categories/:id` (admin only)
- `DELETE /api/categories/:id` (admin only)

### Cart
- `POST /api/cart/add`
- `GET /api/cart`
- `PUT /api/cart/update/:itemId`
- `DELETE /api/cart/remove/:itemId`
- `DELETE /api/cart/clear`
- `POST /api/cart/reorder/:orderId`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/feedback`
- `PATCH /api/orders/:id/status` (admin only)

### Payments
- `POST /api/payments`
- `GET /api/payments/my`
- `GET /api/payments`
- `PUT /api/payments/:id/verify`
- `PUT /api/payments/:id/reject`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`

### Deliveries
- `POST /api/deliveries`
- `POST /api/deliveries/assign`
- `GET /api/deliveries`
- `GET /api/deliveries/:id`
- `PUT /api/deliveries/:id/accept`
- `POST /api/deliveries/:id/update-status`
- `GET /api/deliveries/:id/tracking`
- `GET /api/deliveries/tracking/:orderId`

### Users and Travellers
- `GET /api/users`
- `GET /api/users/travellers`
- `PATCH /api/users/:id/activate`
- `PATCH /api/users/:id/deactivate`
- `PUT /api/users/:id`
- `GET /api/travellers`

### Analytics
- `GET /api/analytics`

---

## 7. Business Flow Explanation

### Dealer Workflow
1. Dealer registers or logs in.
2. Dealer browses products and filters by category or price.
3. Dealer adds products to cart.
4. Dealer places an order with a delivery preference.
5. Dealer submits payment.
6. Admin verifies payment and confirms the order.
7. Delivery is created and tracked until completion.

### Admin Workflow
1. Admin monitors incoming orders and payments.
2. Admin verifies payments and updates order status.
3. Admin creates or assigns deliveries.
4. Admin reviews overall business performance through analytics.
5. Admin manages products and user accounts.

### Traveller Workflow
1. Traveller sees listed deliveries.
2. Traveller accepts an unassigned delivery.
3. Traveller updates the delivery status step by step.
4. Traveller records location and remarks for each update.
5. Delivery reaches delivered or failed state.

---

## 8. Notes

- The frontend uses the backend API at `http://localhost:5000/api` by default.
- You can override this with the `VITE_API_BASE_URL` environment variable in the frontend.
- The application uses role-based access control for each module.
- This project is well suited for extension into a more complete ERP-style distributor management system.

---

## 9. Summary

Prince Piping Systems is a practical multi-role e-commerce and logistics portal built for distributors. It combines product management, shopping cart flow, order processing, payments, delivery tracking, and admin analytics into one integrated solution.

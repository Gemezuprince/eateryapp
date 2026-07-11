# Eatery App — Backend API

A REST API for a food ordering app built with Node.js, Express, and MongoDB Atlas.

---

## Features

- User registration and login with JWT authentication
- Role-based access (customer and admin)
- Dynamic menu categories
- Menu management with image upload via Cloudinary
- Order placement and tracking
- Paystack payment integration
- Payment history
- Customer reviews and ratings

---

## Tech Stack

- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT + bcryptjs
- Cloudinary + Multer
- Paystack (via Axios)

---

## Environment Variables

Create a `.env` file in the root folder:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

---

## Installation

```bash
git clone https://github.com/Gemezuprince/eateryapp.git
cd eateryapp
npm install
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Login and get token |
| GET | /api/auth/me | Protected | Get current user |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/categories | Public | Get all categories |
| GET | /api/categories/:id | Public | Get one category |
| GET | /api/categories/:id/menu | Public | Get menu items by category |
| POST | /api/categories | Admin | Create category |
| PUT | /api/categories/:id | Admin | Update category |
| DELETE | /api/categories/:id | Admin | Delete category |

### Menu
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/menu | Public | Get all menu items |
| GET | /api/menu/:id | Public | Get one menu item |
| POST | /api/menu | Admin | Add menu item with image |
| PUT | /api/menu/:id | Admin | Update menu item |
| DELETE | /api/menu/:id | Admin | Delete menu item |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/orders | Protected | Place an order |
| GET | /api/orders/myorders | Protected | Get my orders |
| GET | /api/orders | Admin | Get all orders |
| PUT | /api/orders/:id/status | Admin | Update order status |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/payments/initiate | Protected | Initiate Paystack payment |
| POST | /api/payments/verify | Protected | Verify payment |
| GET | /api/payments/mypayments | Protected | Get my payment history |
| GET | /api/payments/history | Admin | Get all payments |

### Reviews
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/reviews | Protected | Add a review |
| GET | /api/reviews/:menuItemId | Public | Get reviews for a menu item |
| DELETE | /api/reviews/:id | Protected | Delete your review |

---

## Authentication

Add this header to all protected requests:

```
Authorization: Bearer your_token_here
```

Admin routes require the user role to be set to `admin` in the database.

---

## Order Status Flow

```
pending → confirmed → preparing → delivered
```

Payment verification automatically sets status to `confirmed`.
Admin manually updates to `preparing` and `delivered`.

---

## Image Upload

Menu item images are uploaded as `multipart/form-data` with field name `image`.
Images are stored on Cloudinary under `eateryapp/menu`.

---

## Payment Flow

1. Place an order — get order `_id`
2. Initiate payment — get `authorizationUrl` and `reference`
3. Customer completes payment on Paystack page
4. Verify payment using `reference`
5. Order status updates to `confirmed` and `paymentStatus` to `paid`

---

## Package Versions

```
cloudinary@1.41.3
multer@1.4.4-lts.1
multer-storage-cloudinary@4.0.0
```

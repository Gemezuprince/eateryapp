# Eatery App API

A backend REST API for a food ordering app. Users can create accounts, browse the menu, place orders, and leave reviews. Admins can manage the menu and track all orders.

---

## Tech Stack

- Node.js + Express
- MongoDB Atlas + Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eateryapp.git
   cd eateryapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root folder:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

You should see:
```
Server running on port 5000
MongoDB Atlas connected
```

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Create a new account |
| POST | /api/auth/login | Public | Login and receive token |
| GET | /api/auth/me | Protected | Get current logged in user |

### Menu

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/menu | Public | Get all available menu items |
| GET | /api/menu/:id | Public | Get a single menu item |
| POST | /api/menu | Admin | Add a new menu item |
| PUT | /api/menu/:id | Admin | Update a menu item |
| DELETE | /api/menu/:id | Admin | Delete a menu item |

### Orders

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/orders | Protected | Place a new order |
| GET | /api/orders/myorders | Protected | Get your own orders |
| GET | /api/orders | Admin | Get all orders |
| PUT | /api/orders/:id/status | Admin | Update order status |

### Reviews

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/reviews | Protected | Add a review |
| GET | /api/reviews/:menuItemId | Public | Get reviews for a menu item |
| DELETE | /api/reviews/:id | Protected | Delete your own review |

---

## Authentication

Protected routes require a Bearer token in the request header:

```
Authorization: Bearer your_token_here
```

To get a token, register or login. Admin routes require the user's role to be set to `admin` in the database.

---

## Sample Request Bodies

**Register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Add Menu Item** (Admin)
```json
{
  "name": "Jollof Rice",
  "description": "Spicy party jollof with chicken",
  "price": 2500,
  "category": "main"
}
```

**Place Order**
```json
{
  "items": [
    { "menuItem": "menu_item_id_here", "quantity": 2 }
  ],
  "deliveryAddress": "12 Mango Street, Lagos"
}
```

**Add Review**
```json
{
  "menuItem": "menu_item_id_here",
  "rating": 5,
  "comment": "Absolutely delicious!"
}
```

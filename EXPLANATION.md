# Eatery App — Full Code Explanation
## From Registration to Review

---

## THE BIG PICTURE

When a user interacts with your app, every request follows this same path:

```
User/Client (Postman or Browser)
        ↓  sends HTTP request
server.js
        ↓  matches the URL
routes/
        ↓  runs middleware (protect, adminOnly)
middleware/
        ↓  calls the right function
controllers/
        ↓  reads/writes data using the model
models/
        ↓  talks to the database
MongoDB Atlas
        ↓  returns data back up the chain
User/Client receives JSON response
```

Every single feature in your app follows this flow. Let's walk through each one.

---

# PART 1 — REGISTRATION

## What happens when a user registers

```
POST /api/auth/register
Body: { name, email, password }
```

### Step 1 — server.js receives the request

```js
app.use('/api/auth', require('./routes/auth'));
```

Any request starting with `/api/auth` is handed to `routes/auth.js`.
The `app.use()` function is Express's way of saying:
"For any request that starts with this path, use this router."

---

### Step 2 — routes/auth.js matches the path

```js
router.post('/register', register);
```

This says: when a POST request hits `/register`,
call the `register` function from `authController.js`.

The full URL becomes `/api/auth` + `/register` = `/api/auth/register`.

`router.post` means this route only responds to POST requests.
A GET request to the same URL would get a 404.

---

### Step 3 — authController.js runs the register function

```js
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
```

`exports.register` makes this function available to be imported in the route file.

`async` means this function uses `await` inside — needed because database
operations take time and we don't want to block the server.

`req.body` contains the JSON data the user sent:
```json
{ "name": "John", "email": "john@example.com", "password": "password123" }
```

`const { name, email, password } = req.body` is destructuring —
a shorthand for:
```js
const name = req.body.name;
const email = req.body.email;
const password = req.body.password;
```

---

```js
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' });
  }
```

`User.findOne({ email })` searches the database for a user with that email.
`await` pauses execution until MongoDB responds.

If a user is found, we return a 400 error immediately.
`return` is important here — it stops the function from continuing.

`res.status(400)` sets the HTTP status code.
`.json()` sends the response as JSON.

Status codes:
- 200 = OK (default)
- 201 = Created
- 400 = Bad Request (user's fault)
- 401 = Unauthorized (not logged in)
- 403 = Forbidden (logged in but not allowed)
- 404 = Not Found
- 500 = Server Error (our fault)

---

```js
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
```

We NEVER store plain passwords in a database.
If your database gets hacked, hackers would see everyone's password.

`bcrypt.genSalt(10)` generates a random "salt" — a string of random characters.
The number 10 is the "cost factor" — higher means more secure but slower.
10 is the recommended balance.

`bcrypt.hash(password, salt)` combines the password with the salt
and runs it through a one-way hashing algorithm.

"password123" becomes something like:
"$2a$10$XqZ9k3mN2pL8vB4wR7dYuO1jH5sF9cE6aT3iM2nG8oK4lP6qW1xV"

This cannot be reversed — you can never get "password123" back from the hash.

---

```js
  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });
```

`User.create()` is a Mongoose method that:
1. Validates the data against the UserSchema
2. Saves it to the MongoDB `users` collection
3. Returns the saved document

We store `hashedPassword`, not the original `password`.

---

```js
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
```

`201` means "Created" — something new was made in the database.

We send back only the fields the client needs.
Notice we do NOT send back the password — not even the hashed version.

`generateToken(user._id)` creates a JWT token for the user.

---

### The generateToken function

```js
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
```

`jwt.sign()` creates a token. It takes 3 arguments:

1. `{ id }` — the payload (data encoded inside the token).
   We only store the user's ID. This is enough to identify them later.

2. `process.env.JWT_SECRET` — a secret key from your .env file.
   This signs the token. Anyone with this secret can verify or create tokens,
   which is why you never expose it.

3. `{ expiresIn: '7d' }` — the token expires in 7 days.
   After that, the user must log in again.

The token looks like: `eyJhbGci...` — a long encoded string.
It's not encrypted — it's just encoded. Anyone can decode it.
But they can't FORGE a new one without the secret key.

---

# PART 2 — LOGIN

```js
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
```

We search for the user by email.
If not found, we return "Invalid credentials" —
NOT "Email not found", because telling hackers which emails exist
is a security risk.

---

```js
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
```

`bcrypt.compare()` takes the plain password the user typed
and the hashed password from the database.

It hashes the plain password the same way and compares.
If they match, the user typed the right password.

You cannot "unhash" to compare — you hash again and compare hashes.
That's the brilliance of bcrypt.

---

# PART 3 — PROTECT MIDDLEWARE

Every protected route runs this middleware BEFORE the controller.

```js
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
```

The client sends the token in the request header like this:
```
Authorization: Bearer eyJhbGci...
```

`req.headers.authorization` reads that header.
`.startsWith('Bearer ')` confirms it has the right format.
`.split(' ')[1]` splits "Bearer eyJhbGci..." by the space
and takes index [1] — just the token part.

```
"Bearer eyJhbGci...".split(' ')
→ ["Bearer", "eyJhbGci..."]
→ [0]="Bearer"  [1]="eyJhbGci..."
```

---

```js
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
```

If no token was found in the header, reject immediately with 401.
This is why you got "Not authorized, no token" earlier
when Bearer was accidentally deleted.

---

```js
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password');
  next();
```

`jwt.verify()` checks that:
1. The token was signed with our secret (not forged)
2. The token hasn't expired

If valid, it returns the payload: `{ id: "6a42f71e..." }`

`User.findById(decoded.id)` finds the actual user in the database.
`.select('-password')` fetches everything EXCEPT the password field.
The `-` before a field name means "exclude this".

`req.user = ...` attaches the user to the request object.
Every subsequent controller in this request can now access `req.user`.

`next()` passes control to the next function in the chain —
which is the actual controller.

---

### adminOnly middleware

```js
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only' });
  }
};
```

This runs AFTER protect — so `req.user` is already set.
It simply checks if the role is "admin".
403 means "Forbidden" — you're authenticated but not allowed.

---

# PART 4 — MENU

### Creating a Menu Item (Admin only)

```js
router.post('/', protect, adminOnly, createMenuItem);
```

Three functions run in sequence:
1. `protect` — verifies the token
2. `adminOnly` — checks role is admin
3. `createMenuItem` — actually creates the item

If protect fails, adminOnly and createMenuItem never run.
If adminOnly fails, createMenuItem never runs.
This chain is called middleware chaining.

---

```js
exports.createMenuItem = async (req, res) => {
  const item = await Menu.create(req.body);
  res.status(201).json(item);
};
```

`req.body` contains the JSON sent by the client.
`Menu.create()` validates it against the MenuSchema and saves it.

The MenuSchema has:
```js
category: {
  type: String,
  enum: ['starter', 'main', 'dessert', 'drink'],
  required: true
}
```

`enum` means only these exact values are allowed.
If you send "food" as a category, Mongoose rejects it.

---

### Getting Menu Items (Public)

```js
exports.getAllMenuItems = async (req, res) => {
  const items = await Menu.find({ available: true });
  res.json(items);
};
```

`Menu.find({ available: true })` fetches all documents
where `available` equals `true`.

This means if you mark an item unavailable (sold out),
it won't show up in the public menu — without deleting it.

---

# PART 5 — ORDERS

### Placing an Order

```js
exports.createOrder = async (req, res) => {
  const { items, deliveryAddress } = req.body;

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = await Menu.findById(item.menuItem);
    totalAmount += menuItem.price * item.quantity;
    orderItems.push({
      menuItem: menuItem._id,
      quantity: item.quantity,
      price: menuItem.price   // snapshot of current price
    });
  }
```

The client sends:
```json
{
  "items": [{ "menuItem": "abc123", "quantity": 2 }],
  "deliveryAddress": "12 Mango Street"
}
```

`for...of` loops through each item in the array.

For each item, we fetch the menu item from the database.
This is important — we don't trust the price the client sends.
We always fetch the price from our own database.
This prevents users from manipulating prices on the frontend.

`totalAmount += menuItem.price * item.quantity` accumulates the total.
2 × 2500 = 5000.

We store `price: menuItem.price` as a SNAPSHOT.
If the price changes tomorrow, old orders still show the original price.
This is how real e-commerce works.

---

```js
  const order = await Order.create({
    user: req.user._id,   // from protect middleware
    items: orderItems,
    totalAmount,
    deliveryAddress
  });
```

`req.user._id` comes from the protect middleware.
This is how the order gets linked to the user who placed it.
The client doesn't need to send their own ID — we get it from the token.
This is also a security measure — users can't place orders as other users.

---

### Getting My Orders

```js
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('items.menuItem', 'name price');
};
```

`Order.find({ user: req.user._id })` fetches only orders
belonging to the logged in user.

`.populate('items.menuItem', 'name price')` is very powerful.
In the database, `menuItem` is just an ID: `"6a43ce16fa8c415ffefd208f"`.
`.populate()` replaces that ID with the actual menu item data.

Without populate:
```json
{ "menuItem": "6a43ce16fa8c415ffefd208f", "quantity": 2 }
```

With populate:
```json
{ "menuItem": { "name": "Jollof Rice", "price": 2500 }, "quantity": 2 }
```

`'name price'` means only fetch these two fields from the Menu collection.
This is called field selection — fetch only what you need.

---

# PART 6 — REVIEWS

### Adding a Review

```js
exports.addReview = async (req, res) => {
  const { menuItem, rating, comment } = req.body;

  const existing = await Review.findOne({
    user: req.user._id,
    menuItem
  });
  if (existing) {
    return res.status(400).json({ message: 'You already reviewed this item' });
  }
```

`Review.findOne({ user, menuItem })` checks if this user
already reviewed this specific item.

This works together with the unique index in the ReviewSchema:
```js
ReviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });
```

This creates a compound unique index — no two documents can have
the same combination of user AND menuItem.
The `1` means ascending order (for index sorting).

Even if the controller check fails somehow, the database index
will reject the duplicate at the database level. Double protection.

---

```js
  const review = await Review.create({
    user: req.user._id,
    menuItem,
    rating,
    comment
  });
```

Again `req.user._id` links the review to the logged in user.
The rating (1-5) is validated by the model:
```js
rating: { type: Number, min: 1, max: 5 }
```

If someone sends `rating: 10`, Mongoose rejects it.

---

### Getting Reviews for a Menu Item (Public)

```js
exports.getReviewsForItem = async (req, res) => {
  const reviews = await Review.find({ menuItem: req.params.menuItemId })
    .populate('user', 'name');
};
```

`req.params.menuItemId` reads the ID from the URL.
For `/api/reviews/6a43ce16fa8c415ffefd208f`,
`req.params.menuItemId` = `"6a43ce16fa8c415ffefd208f"`.

`.populate('user', 'name')` replaces the user ID with just the user's name.
So reviews show "John Doe gave 5 stars" instead of just an ID.

---

### Deleting a Review (Owner only)

```js
  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
```

`review.user` is a MongoDB ObjectId.
`req.user._id` is also an ObjectId.

You can't compare ObjectIds directly with `!==` because they're objects.
`.toString()` converts both to strings first, then compares.

This ensures only the person who wrote the review can delete it.
An admin can't delete someone else's review (in this current setup).

---

# SUMMARY TABLE

| File | Role | Key concept |
|---|---|---|
| `server.js` | Entry point | Connects everything together |
| `config/db.js` | Database connection | mongoose.connect() |
| `models/User.js` | User structure | Schema, validation, hashing |
| `models/Menu.js` | Menu item structure | enum, available flag |
| `models/Order.js` | Order structure | Nested schema, price snapshot |
| `models/Review.js` | Review structure | Compound unique index |
| `middleware/protect.js` | Authentication guard | JWT verify, req.user |
| `controllers/authController.js` | Register/Login logic | bcrypt, jwt.sign |
| `controllers/menuController.js` | Menu CRUD | find, create, update, delete |
| `controllers/orderController.js` | Order logic | price calculation, populate |
| `controllers/reviewController.js` | Review logic | duplicate check, populate |
| `routes/auth.js` | Auth URL mapping | router.post, router.get |
| `routes/menu.js` | Menu URL mapping | public vs protected routes |
| `routes/order.js` | Order URL mapping | middleware chaining |
| `routes/review.js` | Review URL mapping | owner-only delete |

---

# KEY CONCEPTS GLOSSARY

| Term | Meaning |
|---|---|
| `req` | The incoming request (URL, headers, body, params) |
| `res` | The outgoing response (what you send back) |
| `next()` | Pass control to the next middleware/function |
| `async/await` | Handle operations that take time (like DB calls) |
| `exports.fn` | Make a function available to other files |
| `require()` | Import a file or package |
| `Schema` | Blueprint that defines what a document looks like |
| `Model` | The interface used to interact with a collection |
| `populate()` | Replace an ID reference with actual data |
| `middleware` | A function that runs between request and controller |
| `JWT` | A token that proves who you are without storing sessions |
| `bcrypt` | A library that hashes passwords securely |
| `enum` | Restricts a field to only specific allowed values |
| `req.params` | Values from the URL path e.g. `/menu/:id` |
| `req.body` | Data sent in the request body (POST/PUT) |
| `req.user` | The logged in user attached by protect middleware |

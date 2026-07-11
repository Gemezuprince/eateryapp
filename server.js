require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors({
  origin: 'https://eatery-xi.vercel.app',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/menu',    require('./routes/menu'));
app.use('/api/orders',  require('./routes/order'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/payments', require('./routes/payment'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: true
},
   
  imageUrl: String,
  available: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);
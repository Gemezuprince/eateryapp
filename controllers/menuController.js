const Menu = require('../models/Menu');
const cloudinary = require('../config/cloudinary');

// GET /api/menu
exports.getAllMenuItems = async (req, res) => {
  try {
    const items = await Menu.find({ available: true })
      .populate('category', 'name description');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/menu/:id
exports.getMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id)
      .populate('category', 'name description');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/menu
exports.createMenuItem = async (req, res) => {
  try {
    const itemData = { ...req.body };

    if (req.file) {
      itemData.imageUrl = req.file.path;
    }

    const item = await Menu.create(itemData);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    const item = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Menu item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
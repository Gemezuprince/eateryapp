const Category = require('../models/Category');
const Menu = require('../models/Menu');

// POST /api/categories  — admin only
exports.createCategory = async (req, res) => {
  try {
    const existing = await Category.findOne({ name: req.body.name });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories  — public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories/:id  — public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/categories/:id  — admin only
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/categories/:id  — admin only
exports.deleteCategory = async (req, res) => {
  try {
    // Check if any menu items use this category
    const menuItems = await Menu.findOne({ category: req.params.id });
    if (menuItems) {
      return res.status(400).json({
        message: 'Cannot delete category — menu items are using it'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories/:id/menu  — public
// Get all menu items belonging to a category
exports.getMenuByCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const items = await Menu.find({
      category: req.params.id,
      available: true
    });

    res.json({
      category: category.name,
      items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getMenuByCategory
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/protect');

router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.get('/:id/menu', getMenuByCategory);
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
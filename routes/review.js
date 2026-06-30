const express = require('express');
const router = express.Router();
const {
  addReview,
  getReviewsForItem,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/protect');

router.post('/', protect, addReview);
router.get('/:menuItemId', getReviewsForItem);
router.delete('/:id', protect, deleteReview);

module.exports = router;
const Review = require('../models/Review');

// POST /api/reviews
exports.addReview = async (req, res) => {
  const { menuItem, rating, comment } = req.body;

  try {
    const existing = await Review.findOne({
      user: req.user._id,
      menuItem
    });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this item' });
    }

    const review = await Review.create({
      user: req.user._id,
      menuItem,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/:menuItemId
exports.getReviewsForItem = async (req, res) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.menuItemId })
      .populate('user', 'name');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
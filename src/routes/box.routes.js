const express = require('express');
const router = express.Router();
const {
  getAllBoxes,
  getBox,
  createBox,
  updateBox,
  deleteBox,
} = require('../controllers/box.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view boxes
router.get('/', getAllBoxes);
router.get('/:id', getBox);

// Protected routes - Only admin can create, update, delete boxes
router.post('/', protect, authorize('admin'), createBox);
router.put('/:id', protect, authorize('admin'), updateBox);
router.delete('/:id', protect, authorize('admin'), deleteBox);

module.exports = router;
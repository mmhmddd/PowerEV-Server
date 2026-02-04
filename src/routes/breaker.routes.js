const express = require('express');
const router = express.Router();
const {
  getAllBreakers,
  getBreaker,
  createBreaker,
  updateBreaker,
  deleteBreaker,
} = require('../controllers/breaker.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view breakers
router.get('/', getAllBreakers);
router.get('/:id', getBreaker);

// Protected routes - Only admin can create, update, delete breakers
router.post('/', protect, authorize('admin'), createBreaker);
router.put('/:id', protect, authorize('admin'), updateBreaker);
router.delete('/:id', protect, authorize('admin'), deleteBreaker);

module.exports = router;
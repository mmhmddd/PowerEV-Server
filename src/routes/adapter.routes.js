const express = require('express');
const router = express.Router();
const {
  getAllAdapters,
  getAdapter,
  createAdapter,
  updateAdapter,
  deleteAdapter,
} = require('../controllers/adapter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view adapters
router.get('/', getAllAdapters);
router.get('/:id', getAdapter);

// Protected routes - Only admin can create, update, delete adapters
router.post('/', protect, authorize('admin'), createAdapter);
router.put('/:id', protect, authorize('admin'), updateAdapter);
router.delete('/:id', protect, authorize('admin'), deleteAdapter);

module.exports = router;
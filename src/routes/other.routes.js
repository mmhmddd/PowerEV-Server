const express = require('express');
const router = express.Router();
const {
  getAllOthers,
  getOther,
  createOther,
  updateOther,
  deleteOther,
} = require('../controllers/other.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view other products
router.get('/', getAllOthers);
router.get('/:id', getOther);

// Protected routes - Only admin can create, update, delete other products
router.post('/', protect, authorize('admin'), createOther);
router.put('/:id', protect, authorize('admin'), updateOther);
router.delete('/:id', protect, authorize('admin'), deleteOther);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getAllCables,
  getCable,
  createCable,
  updateCable,
  deleteCable,
} = require('../controllers/cable.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view cables
router.get('/', getAllCables);
router.get('/:id', getCable);

// Protected routes - Only admin can create, update, delete cables
router.post('/', protect, authorize('admin'), createCable);
router.put('/:id', protect, authorize('admin'), updateCable);
router.delete('/:id', protect, authorize('admin'), deleteCable);

module.exports = router;
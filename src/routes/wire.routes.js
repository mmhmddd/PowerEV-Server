const express = require('express');
const router = express.Router();
const {
  getAllWires,
  getWire,
  createWire,
  updateWire,
  deleteWire,
} = require('../controllers/wire.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view wires
router.get('/', getAllWires);
router.get('/:id', getWire);

// Protected routes - Only admin can create, update, delete wires
router.post('/', protect, authorize('admin'), createWire);
router.put('/:id', protect, authorize('admin'), updateWire);
router.delete('/:id', protect, authorize('admin'), deleteWire);

module.exports = router;
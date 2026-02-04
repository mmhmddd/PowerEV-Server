const express = require('express');
const router = express.Router();
const {
  getAllChargers,
  getCharger,
  createCharger,
  updateCharger,
  deleteCharger,
} = require('../controllers/charger.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view chargers
router.get('/', getAllChargers);
router.get('/:id', getCharger);

// Protected routes - Only admin can create, update, delete chargers
router.post('/', protect, authorize('admin'), createCharger);
router.put('/:id', protect, authorize('admin'), updateCharger);
router.delete('/:id', protect, authorize('admin'), deleteCharger);

module.exports = router;
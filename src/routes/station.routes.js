const express = require('express');
const router = express.Router();
const {
  getAllStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/station.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view stations
router.get('/', getAllStations);
router.get('/:id', getStation);

// Protected routes - Only admin can create, update, delete stations
router.post('/', protect, authorize('admin'), createStation);
router.put('/:id', protect, authorize('admin'), updateStation);
router.delete('/:id', protect, authorize('admin'), deleteStation);

module.exports = router;
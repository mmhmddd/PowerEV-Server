const express = require('express');
const router = express.Router();
const {
  getAllPlugs,
  getPlug,
  createPlug,
  updatePlug,
  deletePlug,
} = require('../controllers/plug.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view plugs
router.get('/', getAllPlugs);
router.get('/:id', getPlug);

// Protected routes - Only admin can create, update, delete plugs
router.post('/', protect, authorize('admin'), createPlug);
router.put('/:id', protect, authorize('admin'), updatePlug);
router.delete('/:id', protect, authorize('admin'), deletePlug);

module.exports = router;
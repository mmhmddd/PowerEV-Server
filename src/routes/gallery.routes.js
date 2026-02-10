const express = require('express');
const router = express.Router();
const {
  getAllGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require('../controllers/gallery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can view gallery items
router.get('/', getAllGalleryItems);
router.get('/:id', getGalleryItem);

// Protected routes - Only admin can create, update, delete gallery items
router.post('/', protect, authorize('admin'), createGalleryItem);
router.put('/:id', protect, authorize('admin'), updateGalleryItem);
router.delete('/:id', protect, authorize('admin'), deleteGalleryItem);

module.exports = router;
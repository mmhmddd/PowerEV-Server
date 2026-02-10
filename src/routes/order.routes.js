const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrder,
  trackOrder,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrder,
  deleteOrder,
  getMyOrders,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// IMPORTANT: More specific routes MUST come before generic routes with params

// Public routes - Anyone can create and track orders
router.post('/', createOrder);

// Specific routes BEFORE :id route
router.get('/track/:orderNumber', trackOrder);

// Protected routes - User must be logged in
router.get('/user/my-orders', protect, getMyOrders);

// Admin routes - Only admin can manage all orders
// These specific routes come BEFORE the generic :id route
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/:id/payment-status', protect, authorize('admin'), updatePaymentStatus);

// Admin route for getting all orders
router.get('/', protect, authorize('admin'), getAllOrders);

// Generic :id routes come LAST to avoid conflicts
router.get('/:id', getOrder);
router.put('/:id', protect, authorize('admin'), updateOrder);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
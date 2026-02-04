const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrder,
  trackOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getMyOrders,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes - Anyone can create and track orders
router.post('/', createOrder);
router.get('/track/:orderNumber', trackOrder);
router.get('/:id', getOrder);

// Protected routes - User must be logged in
router.get('/user/my-orders', protect, getMyOrders);

// Admin routes - Only admin can manage all orders
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/:id', protect, authorize('admin'), updateOrder);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
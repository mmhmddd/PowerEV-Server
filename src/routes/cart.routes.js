const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');

// All cart routes are public - no authentication required
router.get('/:sessionId', getCart);
router.post('/:sessionId/add', addToCart);
router.put('/:sessionId/update', updateCartItem);
router.delete('/:sessionId/remove/:productId/:productType', removeFromCart);
router.delete('/:sessionId/clear', clearCart);

module.exports = router;
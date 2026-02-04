const Cart = require('../models/cart.model');
const mongoose = require('mongoose');

// Helper function to get product model
const getProductModel = (productType) => {
  const models = {
    Charger: require('../models/charger.model'),
    Cable: require('../models/cable.model'),
    Station: require('../models/station.model'),
    Adapter: require('../models/adapter.model'),
    Box: require('../models/box.model'),
    Breaker: require('../models/breaker.model'),
    Plug: require('../models/plug.model'),
    Wire: require('../models/wire.model'),
    Other: require('../models/other.model'),
  };
  return models[productType];
};

// @desc    Get cart by session ID
// @route   GET /api/cart/:sessionId
// @access  Public
exports.getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    let cart = await Cart.findOne({ sessionId });

    if (!cart) {
      // Create empty cart if not exists
      cart = await Cart.create({
        sessionId,
        items: [],
        totalAmount: 0,
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/:sessionId/add
// @access  Public
exports.addToCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, productType, quantity } = req.body;

    // Validate input
    if (!productId || !productType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and productType',
      });
    }

    // Validate product type
    const validTypes = ['Charger', 'Cable', 'Station', 'Adapter', 'Box', 'Breaker', 'Plug', 'Wire', 'Other'];
    if (!validTypes.includes(productType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product type',
      });
    }

    // Get product details
    const ProductModel = getProductModel(productType);
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock
    if (product.stock < (quantity || 1)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ sessionId });

    if (!cart) {
      cart = new Cart({
        sessionId,
        items: [],
      });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.productType === productType
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item
      cart.items.push({
        productId,
        productType,
        name: product.name,
        price: product.price,
        quantity: quantity || 1,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:sessionId/update
// @access  Public
exports.updateCartItem = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, productType, quantity } = req.body;

    if (!productId || !productType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, productType, and quantity',
      });
    }

    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.productType === productType
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Check stock
    const ProductModel = getProductModel(productType);
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:sessionId/remove/:productId/:productType
// @access  Public
exports.removeFromCart = async (req, res) => {
  try {
    const { sessionId, productId, productType } = req.params;

    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      item => !(item.productId.toString() === productId && item.productType === productType)
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/:sessionId/clear
// @access  Public
exports.clearCart = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
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
      data: cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
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

    console.log('Add to cart request:', { sessionId, productId, productType, quantity });

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

    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
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

    console.log('Product found:', { name: product.name, price: product.price, stock: product.stock });

    // Check stock
    const requestedQuantity = quantity || 1;
    if (product.stock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
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
      const newQuantity = cart.items[existingItemIndex].quantity + requestedQuantity;
      
      // Check stock for new quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. You have ${cart.items[existingItemIndex].quantity} in cart. Available: ${product.stock}`,
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      console.log('Updated existing item quantity:', newQuantity);
    } else {
      // Add new item
      const imageUrl = product.images && product.images.length > 0 
        ? (product.images[0].url || product.images[0]) 
        : '';

      cart.items.push({
        productId,
        productType,
        name: product.name,
        price: product.offer?.enabled ? product.finalPrice : product.price,
        quantity: requestedQuantity,
        image: imageUrl,
      });
      console.log('Added new item to cart');
    }

    await cart.save();
    console.log('Cart saved successfully. Total items:', cart.items.length);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
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

    console.log('Update cart item request:', { sessionId, productId, productType, quantity });

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
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    console.log('Cart item updated successfully');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
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

    console.log('Remove from cart request:', { sessionId, productId, productType });

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

    console.log('Item removed from cart successfully');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
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

    console.log('Clear cart request:', { sessionId });

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

    console.log('Cart cleared successfully');

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
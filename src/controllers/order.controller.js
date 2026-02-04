const Order = require('../models/order.model');
const Cart = require('../models/cart.model');

// @desc    Create order (from cart or direct)
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      items,
      sessionId,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and address',
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    // If sessionId is provided, get items from cart
    if (sessionId) {
      const cart = await Cart.findOne({ sessionId });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty',
        });
      }

      orderItems = cart.items;
      totalAmount = cart.totalAmount;
    } 
    // Otherwise, use items from request body
    else if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items;
      totalAmount = items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'Please provide items or sessionId',
      });
    }

    // Create order data
    const orderData = {
      name,
      phone,
      address,
      items: orderItems,
      totalAmount,
      status: 'pending',
    };

    // Add optional fields if provided
    if (email) orderData.email = email;
    if (notes) orderData.notes = notes;
    if (req.user) orderData.userId = req.user._id;

    // Create order
    const order = await Order.create(orderData);

    // Clear cart if order was created from cart
    if (sessionId) {
      const cart = await Cart.findOne({ sessionId });
      if (cart) {
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public (by order ID)
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status',
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
exports.updateOrder = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      status,
      notes,
    } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) order.name = name;
    if (phone !== undefined) order.phone = phone;
    if (email !== undefined) order.email = email;
    if (address !== undefined) order.address = address;
    if (status !== undefined) order.status = status;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user orders (if user is logged in)
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to view your orders',
      });
    }

    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');

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
      paymentMethod,
    } = req.body;

    console.log('📝 Creating order:', { name, phone, address, paymentMethod, sessionId, hasItems: !!items });

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and address',
      });
    }

    // Validate phone format (Egyptian format)
    const phoneRegex = /^(01)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be Egyptian format (01XXXXXXXXX)',
      });
    }

    // Validate payment method
    let validatedPaymentMethod = paymentMethod || 'cash';
    const validPaymentMethods = ['cash', 'instapay', 'vodafonecash'];
    
    if (!validPaymentMethods.includes(validatedPaymentMethod)) {
      console.log('❌ Invalid payment method:', validatedPaymentMethod);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose: cash, instapay, or vodafonecash',
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    // If sessionId is provided, get items from cart
    if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
      console.log('🛒 Fetching cart for sessionId:', sessionId);
      const cart = await Cart.findOne({ sessionId });

      if (!cart || !cart.items || cart.items.length === 0) {
        console.log('❌ Cart is empty or not found');
        return res.status(400).json({
          success: false,
          message: 'Cart is empty. Please add items before creating an order.',
        });
      }

      // Map cart items to order items format
      orderItems = cart.items.map(item => ({
        productId: item.productId,
        productType: item.productType || 'Other',
        name: item.name || 'Product',
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      }));
      
      totalAmount = cart.totalAmount || 0;
      console.log('✅ Cart items mapped:', orderItems.length, 'Total:', totalAmount);
    } 
    // Otherwise, use items from request body
    else if (items && Array.isArray(items) && items.length > 0) {
      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.productType || !item.price || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have productId, productType, price, and quantity',
          });
        }
      }

      orderItems = items.map(item => ({
        productId: item.productId,
        productType: item.productType || 'Other',
        name: item.name || 'Product',
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      }));
      
      totalAmount = items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      console.log('✅ Using direct items:', orderItems.length, 'Total:', totalAmount);
    } 
    else {
      console.log('❌ No items or sessionId provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide items or sessionId',
      });
    }

    // Final validation
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order total amount must be greater than 0',
      });
    }

    // CRITICAL: Verify stock availability before creating order
    console.log('🔍 Verifying stock availability...');
    for (const item of orderItems) {
      const ProductModel = getProductModel(item.productType);
      
      if (!ProductModel) {
        return res.status(400).json({
          success: false,
          message: `Unknown product type: ${item.productType}`,
        });
      }

      const product = await ProductModel.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      console.log(`✅ Stock OK for ${item.name}: ${product.stock} >= ${item.quantity}`);
    }

    // Create order data
    const orderData = {
      name: name.trim(),
      phone: phone.replace(/[\s\-]/g, ''),
      address: address.trim(),
      items: orderItems,
      totalAmount,
      paymentMethod: validatedPaymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
    };

    // Add optional fields if provided
    if (email && email.trim()) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
      orderData.email = email.trim().toLowerCase();
    }
    
    if (notes && notes.trim()) {
      orderData.notes = notes.trim();
    }
    
    if (req.user) {
      orderData.userId = req.user._id;
    }

    console.log('💾 Creating order with data...');

    // Create order
    const order = await Order.create(orderData);
    console.log('✅ Order created successfully:', order.orderNumber);

    // CRITICAL FIX: Decrement stock for each ordered item
    console.log('📦 Decrementing stock for ordered items...');
    for (const item of orderItems) {
      try {
        const ProductModel = getProductModel(item.productType);
        
        if (ProductModel) {
          const product = await ProductModel.findById(item.productId);
          
          if (product) {
            // Decrement stock
            const previousStock = product.stock;
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
            console.log(`✅ Stock decremented for ${item.name}: ${previousStock} → ${product.stock} (-${item.quantity})`);
          } else {
            console.warn(`⚠️ Product not found for stock decrement: ${item.productId}`);
          }
        } else {
          console.warn(`⚠️ Unknown product type: ${item.productType}`);
        }
      } catch (stockError) {
        // Log error but don't fail the order (order is already created)
        console.error(`❌ Error decrementing stock for ${item.name}:`, stockError.message);
      }
    }

    // Clear cart if order was created from cart
    if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
      const cart = await Cart.findOne({ sessionId });
      if (cart) {
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();
        console.log('✅ Cart cleared for sessionId:', sessionId);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('Error stack:', error.stack);
    
    // More detailed error message
    let errorMessage = 'Server error while creating order';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: error.errors || null
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
      data: orders,
    });
  } catch (error) {
    console.error('❌ Error getting all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
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
      data: order,
    });
  } catch (error) {
    console.error('❌ Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order',
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
      data: order,
    });
  } catch (error) {
    console.error('❌ Error tracking order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking order',
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
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
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
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
      error: error.message,
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment status',
      });
    }

    const validPaymentStatuses = ['pending', 'paid', 'failed'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status',
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
      paymentMethod,
      paymentStatus,
    } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) order.name = name.trim();
    if (phone !== undefined) order.phone = phone.replace(/[\s\-]/g, '');
    if (email !== undefined) order.email = email.trim().toLowerCase();
    if (address !== undefined) order.address = address.trim();
    if (status !== undefined) order.status = status;
    if (notes !== undefined) order.notes = notes.trim();
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order',
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

    // Optional: Restore stock when deleting an order
    console.log('🔄 Restoring stock for deleted order...');
    for (const item of order.items) {
      try {
        const ProductModel = getProductModel(item.productType);
        
        if (ProductModel) {
          const product = await ProductModel.findById(item.productId);
          
          if (product) {
            const previousStock = product.stock;
            product.stock = product.stock + item.quantity;
            await product.save();
            console.log(`✅ Stock restored for ${item.name}: ${previousStock} → ${product.stock} (+${item.quantity})`);
          }
        }
      } catch (stockError) {
        console.error(`❌ Error restoring stock for ${item.name}:`, stockError.message);
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting order',
      error: error.message,
    });
  }
};

// @desc    Get user orders (if user is logged in)
// @route   GET /api/orders/user/my-orders
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
      data: orders,
    });
  } catch (error) {
    console.error('❌ Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user orders',
      error: error.message,
    });
  }
};
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  productType: {
    type: String,
    required: [true, 'Please provide product type'],
    enum: ['Charger', 'Cable', 'Station', 'Adapter', 'Box', 'Breaker', 'Plug', 'Wire', 'Other'],
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  image: {
    type: String,
  },
});

const cartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total amount before saving
// Use async function without next() callback for newer Mongoose versions
cartSchema.pre('save', async function() {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
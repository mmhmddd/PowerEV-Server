const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide station name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: [0, 'Price cannot be negative'],
    },
    stockStatus: {
      type: String,
      enum: ['in stock', 'out of stock'],
      default: 'in stock',
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    voltage: {
      type: Number,
      min: [0, 'Voltage cannot be negative'],
    },
    amperage: {
      type: Number,
      min: [0, 'Amperage cannot be negative'],
    },
    brand: {
      type: String,
      trim: true,
    },
    offer: {
      enabled: {
        type: Boolean,
        default: false,
      },
      discountPercentage: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
        default: 0,
      },
    },
    connectorType: {
      type: String,
      trim: true,
    },
    phase: {
      type: String,
      trim: true,
    },
    efficiency: {
      type: Number,
      min: [0, 'Efficiency cannot be negative'],
      max: [100, 'Efficiency cannot exceed 100%'],
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
stationSchema.index({ stockStatus: 1 });
stationSchema.index({ brand: 1 });
stationSchema.index({ connectorType: 1 });

// Virtual for checking if in stock based on quantity
stationSchema.virtual('isAvailable').get(function() {
  return this.stockStatus === 'in stock' && this.quantity > 0;
});

// FIXED: Pre-save middleware - removed the middleware entirely since it's commented out
// If you need auto-update of stockStatus based on quantity, uncomment this:
/*
stationSchema.pre('save', function() {
  // Auto-update stockStatus based on quantity
  if (this.quantity === 0) {
    this.stockStatus = 'out of stock';
  } else if (this.quantity > 0 && this.stockStatus === 'out of stock') {
    this.stockStatus = 'in stock';
  }
  // No need to call next() - it's handled automatically in modern Mongoose
});
*/

module.exports = mongoose.model('Station', stationSchema);
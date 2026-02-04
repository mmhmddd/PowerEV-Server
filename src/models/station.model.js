const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a station name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: String,
      required: [true, 'Please provide quantity status'],
      enum: ['in stock', 'out of stock'],
      default: 'in stock',
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
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    offer: {
      enabled: {
        type: Boolean,
        default: false,
      },
      discountPercentage: {
        type: Number,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100'],
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
      max: [100, 'Efficiency cannot exceed 100'],
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(images) {
          // Validate that all items are valid URLs or base64 strings
          return images.every(img => {
            // Check if it's a valid URL or base64 string
            return typeof img === 'string' && img.length > 0;
          });
        },
        message: 'All images must be valid strings (URLs or base64)'
      }
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for final price after discount
stationSchema.virtual('finalPrice').get(function () {
  if (this.offer && this.offer.enabled && this.offer.discountPercentage > 0) {
    return this.price - (this.price * this.offer.discountPercentage) / 100;
  }
  return this.price;
});

// Ensure virtuals are included in JSON responses
stationSchema.set('toJSON', { virtuals: true });
stationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Station', stationSchema);
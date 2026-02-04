const mongoose = require('mongoose');

const cableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a cable name'],
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
    type: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    connectorFrom: {
      type: String,
      trim: true,
    },
    connectorTo: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    voltage: {
      type: Number,
      min: [0, 'Voltage cannot be negative'],
    },
    current: {
      type: Number,
      min: [0, 'Current cannot be negative'],
    },
    phase: {
      type: String,
      trim: true,
    },
    cableLength: {
      type: Number,
      min: [0, 'Cable length cannot be negative'],
    },
    wireGauge: {
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
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100'],
        default: 0,
      },
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
cableSchema.virtual('finalPrice').get(function () {
  if (this.offer && this.offer.enabled && this.offer.discountPercentage > 0) {
    return this.price - (this.price * this.offer.discountPercentage) / 100;
  }
  return this.price;
});

// Ensure virtuals are included in JSON responses
cableSchema.set('toJSON', { virtuals: true });
cableSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cable', cableSchema);
const mongoose = require('mongoose');

const adapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an adapter name'],
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    efficiency: {
      type: Number,
      min: [0, 'Efficiency cannot be negative'],
      max: [100, 'Efficiency cannot exceed 100'],
    },
    voltage: {
      type: Number,
      min: [0, 'Voltage cannot be negative'],
    },
    current: {
      type: Number,
      min: [0, 'Current cannot be negative'],
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

module.exports = mongoose.model('Adapter', adapterSchema);
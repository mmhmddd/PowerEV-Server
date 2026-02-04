const mongoose = require('mongoose');

const wireSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a wire name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
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
          return images.every(img => {
            return typeof img === 'string' && img.length > 0;
          });
        },
        message: 'All images must be valid strings (URLs or base64)'
      }
    },
    brand: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    offer: {
      type: Number,
      min: [0, 'Offer cannot be negative'],
      max: [100, 'Offer cannot exceed 100%'],
    },
    length: {
      type: Number,
      min: [0, 'Length cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wire', wireSchema);
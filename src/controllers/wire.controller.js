const Wire = require('../models/wire.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// @desc    Get all wires
// @route   GET /api/wires
// @access  Public
exports.getAllWires = async (req, res) => {
  try {
    const wires = await Wire.find();

    res.status(200).json({
      success: true,
      count: wires.length,
      wires,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single wire
// @route   GET /api/wires/:id
// @access  Public
exports.getWire = async (req, res) => {
  try {
    const wire = await Wire.findById(req.params.id);

    if (!wire) {
      return res.status(404).json({
        success: false,
        message: 'Wire not found',
      });
    }

    res.status(200).json({
      success: true,
      wire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create wire
// @route   POST /api/wires
// @access  Private/Admin
exports.createWire = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images,
      brand,
      type,
      stock,
      offer,
      length,
    } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and stock',
      });
    }

    // Create wire object with only provided fields
    const wireData = {
      name,
      price,
      stock,
    };

    // Add optional fields if provided
    if (description !== undefined) wireData.description = description;
    if (brand !== undefined) wireData.brand = brand;
    if (type !== undefined) wireData.type = type;
    if (offer !== undefined) wireData.offer = offer;
    if (length !== undefined) wireData.length = length;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/wires');
        wireData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create wire
    const wire = await Wire.create(wireData);

    res.status(201).json({
      success: true,
      wire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update wire
// @route   PUT /api/wires/:id
// @access  Private/Admin
exports.updateWire = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images,
      brand,
      type,
      stock,
      offer,
      length,
    } = req.body;

    // Find wire
    const wire = await Wire.findById(req.params.id);

    if (!wire) {
      return res.status(404).json({
        success: false,
        message: 'Wire not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) wire.name = name;
    if (price !== undefined) wire.price = price;
    if (description !== undefined) wire.description = description;
    if (brand !== undefined) wire.brand = brand;
    if (type !== undefined) wire.type = type;
    if (stock !== undefined) wire.stock = stock;
    if (offer !== undefined) wire.offer = offer;
    if (length !== undefined) wire.length = length;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Delete old images from Cloudinary if they exist
      if (wire.images && wire.images.length > 0) {
        await deleteMultipleImages(wire.images);
      }

      // Upload new images if provided
      if (images.length > 0) {
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/wires');
          wire.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        wire.images = [];
      }
    }

    await wire.save();

    res.status(200).json({
      success: true,
      wire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete wire
// @route   DELETE /api/wires/:id
// @access  Private/Admin
exports.deleteWire = async (req, res) => {
  try {
    const wire = await Wire.findById(req.params.id);

    if (!wire) {
      return res.status(404).json({
        success: false,
        message: 'Wire not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (wire.images && wire.images.length > 0) {
      await deleteMultipleImages(wire.images);
    }

    await Wire.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Wire deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
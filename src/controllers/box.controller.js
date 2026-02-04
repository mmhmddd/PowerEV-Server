const Box = require('../models/box.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// @desc    Get all boxes
// @route   GET /api/boxes
// @access  Public
exports.getAllBoxes = async (req, res) => {
  try {
    const boxes = await Box.find();

    res.status(200).json({
      success: true,
      count: boxes.length,
      boxes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single box
// @route   GET /api/boxes/:id
// @access  Public
exports.getBox = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);

    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box not found',
      });
    }

    res.status(200).json({
      success: true,
      box,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create box
// @route   POST /api/boxes
// @access  Private/Admin
exports.createBox = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      images,
      size,
      stock,
      quantity,
      offer,
    } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and stock',
      });
    }

    // Create box object with only provided fields
    const boxData = {
      name,
      price,
      stock,
    };

    // Add optional fields if provided
    if (brand !== undefined) boxData.brand = brand;
    if (description !== undefined) boxData.description = description;
    if (size !== undefined) boxData.size = size;
    if (quantity !== undefined) boxData.quantity = quantity;
    if (offer !== undefined) boxData.offer = offer;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/boxes');
        boxData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create box
    const box = await Box.create(boxData);

    res.status(201).json({
      success: true,
      box,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update box
// @route   PUT /api/boxes/:id
// @access  Private/Admin
exports.updateBox = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      images,
      size,
      stock,
      quantity,
      offer,
    } = req.body;

    // Find box
    const box = await Box.findById(req.params.id);

    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) box.name = name;
    if (brand !== undefined) box.brand = brand;
    if (price !== undefined) box.price = price;
    if (description !== undefined) box.description = description;
    if (size !== undefined) box.size = size;
    if (stock !== undefined) box.stock = stock;
    if (quantity !== undefined) box.quantity = quantity;
    if (offer !== undefined) box.offer = offer;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Delete old images from Cloudinary if they exist
      if (box.images && box.images.length > 0) {
        await deleteMultipleImages(box.images);
      }

      // Upload new images if provided
      if (images.length > 0) {
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/boxes');
          box.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        box.images = [];
      }
    }

    await box.save();

    res.status(200).json({
      success: true,
      box,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete box
// @route   DELETE /api/boxes/:id
// @access  Private/Admin
exports.deleteBox = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);

    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (box.images && box.images.length > 0) {
      await deleteMultipleImages(box.images);
    }

    await Box.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Box deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
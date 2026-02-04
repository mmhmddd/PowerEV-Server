const Plug = require('../models/plug.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// @desc    Get all plugs
// @route   GET /api/plugs
// @access  Public
exports.getAllPlugs = async (req, res) => {
  try {
    const plugs = await Plug.find();

    res.status(200).json({
      success: true,
      count: plugs.length,
      plugs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single plug
// @route   GET /api/plugs/:id
// @access  Public
exports.getPlug = async (req, res) => {
  try {
    const plug = await Plug.findById(req.params.id);

    if (!plug) {
      return res.status(404).json({
        success: false,
        message: 'Plug not found',
      });
    }

    res.status(200).json({
      success: true,
      plug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create plug
// @route   POST /api/plugs
// @access  Private/Admin
exports.createPlug = async (req, res) => {
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
    } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and stock',
      });
    }

    // Create plug object with only provided fields
    const plugData = {
      name,
      price,
      stock,
    };

    // Add optional fields if provided
    if (description !== undefined) plugData.description = description;
    if (brand !== undefined) plugData.brand = brand;
    if (type !== undefined) plugData.type = type;
    if (offer !== undefined) plugData.offer = offer;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/plugs');
        plugData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create plug
    const plug = await Plug.create(plugData);

    res.status(201).json({
      success: true,
      plug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update plug
// @route   PUT /api/plugs/:id
// @access  Private/Admin
exports.updatePlug = async (req, res) => {
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
    } = req.body;

    // Find plug
    const plug = await Plug.findById(req.params.id);

    if (!plug) {
      return res.status(404).json({
        success: false,
        message: 'Plug not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) plug.name = name;
    if (price !== undefined) plug.price = price;
    if (description !== undefined) plug.description = description;
    if (brand !== undefined) plug.brand = brand;
    if (type !== undefined) plug.type = type;
    if (stock !== undefined) plug.stock = stock;
    if (offer !== undefined) plug.offer = offer;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Delete old images from Cloudinary if they exist
      if (plug.images && plug.images.length > 0) {
        await deleteMultipleImages(plug.images);
      }

      // Upload new images if provided
      if (images.length > 0) {
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/plugs');
          plug.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        plug.images = [];
      }
    }

    await plug.save();

    res.status(200).json({
      success: true,
      plug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete plug
// @route   DELETE /api/plugs/:id
// @access  Private/Admin
exports.deletePlug = async (req, res) => {
  try {
    const plug = await Plug.findById(req.params.id);

    if (!plug) {
      return res.status(404).json({
        success: false,
        message: 'Plug not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (plug.images && plug.images.length > 0) {
      await deleteMultipleImages(plug.images);
    }

    await Plug.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Plug deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
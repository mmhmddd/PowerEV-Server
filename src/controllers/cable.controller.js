const Cable = require('../models/cable.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// @desc    Get all cables
// @route   GET /api/cables
// @access  Public
exports.getAllCables = async (req, res) => {
  try {
    const cables = await Cable.find();

    res.status(200).json({
      success: true,
      count: cables.length,
      cables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single cable
// @route   GET /api/cables/:id
// @access  Public
exports.getCable = async (req, res) => {
  try {
    const cable = await Cable.findById(req.params.id);

    if (!cable) {
      return res.status(404).json({
        success: false,
        message: 'Cable not found',
      });
    }

    res.status(200).json({
      success: true,
      cable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create cable
// @route   POST /api/cables
// @access  Private/Admin
exports.createCable = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      type,
      brand,
      connectorFrom,
      connectorTo,
      stock,
      voltage,
      current,
      phase,
      cableLength,
      wireGauge,
      offer,
      description,
      images,
    } = req.body;

    // Validate required fields
    if (!name || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and quantity',
      });
    }

    // Create cable object with only provided fields
    const cableData = {
      name,
      price,
      quantity,
    };

    // Add optional fields if provided
    if (type !== undefined) cableData.type = type;
    if (brand !== undefined) cableData.brand = brand;
    if (connectorFrom !== undefined) cableData.connectorFrom = connectorFrom;
    if (connectorTo !== undefined) cableData.connectorTo = connectorTo;
    if (stock !== undefined) cableData.stock = stock;
    if (voltage !== undefined) cableData.voltage = voltage;
    if (current !== undefined) cableData.current = current;
    if (phase !== undefined) cableData.phase = phase;
    if (cableLength !== undefined) cableData.cableLength = cableLength;
    if (wireGauge !== undefined) cableData.wireGauge = wireGauge;
    if (offer !== undefined) cableData.offer = offer;
    if (description !== undefined) cableData.description = description;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/cables');
        cableData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create cable
    const cable = await Cable.create(cableData);

    res.status(201).json({
      success: true,
      cable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update cable
// @route   PUT /api/cables/:id
// @access  Private/Admin
exports.updateCable = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      type,
      brand,
      connectorFrom,
      connectorTo,
      stock,
      voltage,
      current,
      phase,
      cableLength,
      wireGauge,
      offer,
      description,
      images,
    } = req.body;

    // Find cable
    const cable = await Cable.findById(req.params.id);

    if (!cable) {
      return res.status(404).json({
        success: false,
        message: 'Cable not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) cable.name = name;
    if (price !== undefined) cable.price = price;
    if (quantity !== undefined) cable.quantity = quantity;
    if (type !== undefined) cable.type = type;
    if (brand !== undefined) cable.brand = brand;
    if (connectorFrom !== undefined) cable.connectorFrom = connectorFrom;
    if (connectorTo !== undefined) cable.connectorTo = connectorTo;
    if (stock !== undefined) cable.stock = stock;
    if (voltage !== undefined) cable.voltage = voltage;
    if (current !== undefined) cable.current = current;
    if (phase !== undefined) cable.phase = phase;
    if (cableLength !== undefined) cable.cableLength = cableLength;
    if (wireGauge !== undefined) cable.wireGauge = wireGauge;
    if (offer !== undefined) cable.offer = offer;
    if (description !== undefined) cable.description = description;

    // Handle image updates - FIXED VERSION
    // Only process images if explicitly provided in the request
    if (images !== undefined && Array.isArray(images)) {
      // New images are being uploaded
      if (images.length > 0) {
        // Delete old images from Cloudinary if they exist
        if (cable.images && cable.images.length > 0) {
          try {
            await deleteMultipleImages(cable.images);
          } catch (deleteError) {
            console.error('Error deleting old images:', deleteError);
            // Continue with upload even if delete fails
          }
        }

        // Upload new images
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/cables');
          cable.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        // Empty array means user wants to remove all images
        if (cable.images && cable.images.length > 0) {
          try {
            await deleteMultipleImages(cable.images);
          } catch (deleteError) {
            console.error('Error deleting images:', deleteError);
          }
        }
        cable.images = [];
      }
    }
    // If images is undefined, don't modify the existing images

    await cable.save();

    res.status(200).json({
      success: true,
      cable,
    });
  } catch (error) {
    console.error('Update cable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete cable
// @route   DELETE /api/cables/:id
// @access  Private/Admin
exports.deleteCable = async (req, res) => {
  try {
    const cable = await Cable.findById(req.params.id);

    if (!cable) {
      return res.status(404).json({
        success: false,
        message: 'Cable not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (cable.images && cable.images.length > 0) {
      try {
        await deleteMultipleImages(cable.images);
      } catch (deleteError) {
        console.error('Error deleting images:', deleteError);
        // Continue with cable deletion even if image deletion fails
      }
    }

    await Cable.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Cable deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
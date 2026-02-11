const Charger = require('../models/charger.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// Helper function to check if a string is a base64 image
const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
};

// Helper function to check if a string is a Cloudinary URL
const isCloudinaryUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.includes('cloudinary.com') || str.startsWith('http');
};

// @desc    Get all chargers
// @route   GET /api/chargers
// @access  Public
exports.getAllChargers = async (req, res) => {
  try {
    const chargers = await Charger.find();

    res.status(200).json({
      success: true,
      count: chargers.length,
      chargers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single charger
// @route   GET /api/chargers/:id
// @access  Public
exports.getCharger = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    res.status(200).json({
      success: true,
      charger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create charger
// @route   POST /api/chargers
// @access  Private/Admin
exports.createCharger = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      voltage,
      amperage,
      brand,
      stock,
      offer,
      connectorType,
      phase,
      efficiency,
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

    // Create charger object with only provided fields
    const chargerData = {
      name,
      price,
      quantity,
    };

    // Add optional fields if provided
    if (voltage !== undefined) chargerData.voltage = voltage;
    if (amperage !== undefined) chargerData.amperage = amperage;
    if (brand !== undefined) chargerData.brand = brand;
    if (stock !== undefined) chargerData.stock = stock;
    if (offer !== undefined) chargerData.offer = offer;
    if (connectorType !== undefined) chargerData.connectorType = connectorType;
    if (phase !== undefined) chargerData.phase = phase;
    if (efficiency !== undefined) chargerData.efficiency = efficiency;
    if (description !== undefined) chargerData.description = description;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        // Only upload base64 images
        const base64Images = images.filter(img => isBase64Image(img));
        
        if (base64Images.length > 0) {
          const uploadedImageUrls = await uploadMultipleImages(base64Images, 'powerev/chargers');
          chargerData.images = uploadedImageUrls;
        } else {
          chargerData.images = [];
        }
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create charger
    const charger = await Charger.create(chargerData);

    res.status(201).json({
      success: true,
      charger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update charger
// @route   PUT /api/chargers/:id
// @access  Private/Admin
exports.updateCharger = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      voltage,
      amperage,
      brand,
      stock,
      offer,
      connectorType,
      phase,
      efficiency,
      description,
      images,
    } = req.body;

    // Find charger
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) charger.name = name;
    if (price !== undefined) charger.price = price;
    if (quantity !== undefined) charger.quantity = quantity;
    if (voltage !== undefined) charger.voltage = voltage;
    if (amperage !== undefined) charger.amperage = amperage;
    if (brand !== undefined) charger.brand = brand;
    if (stock !== undefined) charger.stock = stock;
    if (offer !== undefined) charger.offer = offer;
    if (connectorType !== undefined) charger.connectorType = connectorType;
    if (phase !== undefined) charger.phase = phase;
    if (efficiency !== undefined) charger.efficiency = efficiency;
    if (description !== undefined) charger.description = description;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Separate existing URLs from new base64 images
      const existingUrls = images.filter(img => isCloudinaryUrl(img));
      const newBase64Images = images.filter(img => isBase64Image(img));

      // Determine which old images to delete
      const oldImagesToDelete = charger.images.filter(oldImg => !existingUrls.includes(oldImg));

      // Delete old images that are no longer needed
      if (oldImagesToDelete.length > 0) {
        try {
          await deleteMultipleImages(oldImagesToDelete);
        } catch (deleteError) {
          console.error('Error deleting old images:', deleteError);
          // Continue even if deletion fails
        }
      }

      // Upload new images if provided
      let uploadedImageUrls = [];
      if (newBase64Images.length > 0) {
        try {
          uploadedImageUrls = await uploadMultipleImages(newBase64Images, 'powerev/chargers');
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      }

      // Combine existing URLs with newly uploaded URLs
      charger.images = [...existingUrls, ...uploadedImageUrls];
    }

    await charger.save();

    res.status(200).json({
      success: true,
      charger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete charger
// @route   DELETE /api/chargers/:id
// @access  Private/Admin
exports.deleteCharger = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (charger.images && charger.images.length > 0) {
      try {
        await deleteMultipleImages(charger.images);
      } catch (deleteError) {
        console.error('Error deleting images:', deleteError);
        // Continue with deletion even if image deletion fails
      }
    }

    await Charger.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Charger deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
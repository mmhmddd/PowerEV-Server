const Breaker = require('../models/breaker.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// Helper function to check if a string is a base64 image
const isBase64Image = (str) => {
  return str.startsWith('data:image/');
};

// Helper function to check if a string is a Cloudinary URL
const isCloudinaryUrl = (str) => {
  return str.startsWith('http://') || str.startsWith('https://');
};

// @desc    Get all breakers
// @route   GET /api/breakers
// @access  Public
exports.getAllBreakers = async (req, res) => {
  try {
    const breakers = await Breaker.find();

    res.status(200).json({
      success: true,
      count: breakers.length,
      breakers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single breaker
// @route   GET /api/breakers/:id
// @access  Public
exports.getBreaker = async (req, res) => {
  try {
    const breaker = await Breaker.findById(req.params.id);

    if (!breaker) {
      return res.status(404).json({
        success: false,
        message: 'Breaker not found',
      });
    }

    res.status(200).json({
      success: true,
      breaker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create breaker
// @route   POST /api/breakers
// @access  Private/Admin
exports.createBreaker = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      images,
      stock,
      quantity,
      offer,
      ampere,
      voltage,
      type,
    } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and stock',
      });
    }

    // Create breaker object with only provided fields
    const breakerData = {
      name,
      price,
      stock,
    };

    // Add optional fields if provided
    if (brand !== undefined) breakerData.brand = brand;
    if (description !== undefined) breakerData.description = description;
    if (quantity !== undefined) breakerData.quantity = quantity;
    if (offer !== undefined) breakerData.offer = offer;
    if (ampere !== undefined) breakerData.ampere = ampere;
    if (voltage !== undefined) breakerData.voltage = voltage;
    if (type !== undefined) breakerData.type = type;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/breakers');
        breakerData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create breaker
    const breaker = await Breaker.create(breakerData);

    res.status(201).json({
      success: true,
      breaker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update breaker
// @route   PUT /api/breakers/:id
// @access  Private/Admin
exports.updateBreaker = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      images,
      stock,
      quantity,
      offer,
      ampere,
      voltage,
      type,
    } = req.body;

    // Find breaker
    const breaker = await Breaker.findById(req.params.id);

    if (!breaker) {
      return res.status(404).json({
        success: false,
        message: 'Breaker not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) breaker.name = name;
    if (brand !== undefined) breaker.brand = brand;
    if (price !== undefined) breaker.price = price;
    if (description !== undefined) breaker.description = description;
    if (stock !== undefined) breaker.stock = stock;
    if (quantity !== undefined) breaker.quantity = quantity;
    if (offer !== undefined) breaker.offer = offer;
    if (ampere !== undefined) breaker.ampere = ampere;
    if (voltage !== undefined) breaker.voltage = voltage;
    if (type !== undefined) breaker.type = type;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Separate existing URLs from new base64 images
      const existingUrls = images.filter(img => isCloudinaryUrl(img));
      const newBase64Images = images.filter(img => isBase64Image(img));

      // Determine which old images to delete
      const oldImagesToDelete = breaker.images.filter(oldImg => !existingUrls.includes(oldImg));

      // Delete removed images from Cloudinary
      if (oldImagesToDelete.length > 0) {
        try {
          await deleteMultipleImages(oldImagesToDelete);
        } catch (deleteError) {
          console.error('Error deleting old images:', deleteError);
          // Continue even if deletion fails
        }
      }

      // Upload new base64 images if provided
      let newUploadedUrls = [];
      if (newBase64Images.length > 0) {
        try {
          newUploadedUrls = await uploadMultipleImages(newBase64Images, 'powerev/breakers');
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new images',
            error: uploadError.message,
          });
        }
      }

      // Combine existing URLs with newly uploaded URLs
      breaker.images = [...existingUrls, ...newUploadedUrls];
    }

    await breaker.save();

    res.status(200).json({
      success: true,
      breaker,
    });
  } catch (error) {
    console.error('Update breaker error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete breaker
// @route   DELETE /api/breakers/:id
// @access  Private/Admin
exports.deleteBreaker = async (req, res) => {
  try {
    const breaker = await Breaker.findById(req.params.id);

    if (!breaker) {
      return res.status(404).json({
        success: false,
        message: 'Breaker not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (breaker.images && breaker.images.length > 0) {
      await deleteMultipleImages(breaker.images);
    }

    await Breaker.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Breaker deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
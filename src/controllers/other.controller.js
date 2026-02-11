const Other = require('../models/other.model');
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

// @desc    Get all other products
// @route   GET /api/others
// @access  Public
exports.getAllOthers = async (req, res) => {
  try {
    const others = await Other.find();

    res.status(200).json({
      success: true,
      count: others.length,
      others,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single other product
// @route   GET /api/others/:id
// @access  Public
exports.getOther = async (req, res) => {
  try {
    const other = await Other.findById(req.params.id);

    if (!other) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      other,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create other product
// @route   POST /api/others
// @access  Private/Admin
exports.createOther = async (req, res) => {
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

    // Create other product object with only provided fields
    const otherData = {
      name,
      price,
      stock,
    };

    // Add optional fields if provided
    if (description !== undefined) otherData.description = description;
    if (brand !== undefined) otherData.brand = brand;
    if (type !== undefined) otherData.type = type;
    if (offer !== undefined) otherData.offer = offer;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/others');
        otherData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create other product
    const other = await Other.create(otherData);

    res.status(201).json({
      success: true,
      other,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update other product
// @route   PUT /api/others/:id
// @access  Private/Admin
exports.updateOther = async (req, res) => {
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

    // Find other product
    const other = await Other.findById(req.params.id);

    if (!other) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) other.name = name;
    if (price !== undefined) other.price = price;
    if (description !== undefined) other.description = description;
    if (brand !== undefined) other.brand = brand;
    if (type !== undefined) other.type = type;
    if (stock !== undefined) other.stock = stock;
    if (offer !== undefined) other.offer = offer;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Separate existing URLs from new base64 images
      const existingUrls = images.filter(img => isCloudinaryUrl(img));
      const newBase64Images = images.filter(img => isBase64Image(img));

      // Determine which old images to delete
      const oldImagesToDelete = other.images.filter(oldImg => !existingUrls.includes(oldImg));

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
          newUploadedUrls = await uploadMultipleImages(newBase64Images, 'powerev/others');
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new images',
            error: uploadError.message,
          });
        }
      }

      // Combine existing URLs with newly uploaded URLs
      other.images = [...existingUrls, ...newUploadedUrls];
    }

    await other.save();

    res.status(200).json({
      success: true,
      other,
    });
  } catch (error) {
    console.error('Update other error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete other product
// @route   DELETE /api/others/:id
// @access  Private/Admin
exports.deleteOther = async (req, res) => {
  try {
    const other = await Other.findById(req.params.id);

    if (!other) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (other.images && other.images.length > 0) {
      await deleteMultipleImages(other.images);
    }

    await Other.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
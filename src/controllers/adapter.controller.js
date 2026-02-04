const Adapter = require('../models/adapter.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

// @desc    Get all adapters
// @route   GET /api/adapters
// @access  Public
exports.getAllAdapters = async (req, res) => {
  try {
    const adapters = await Adapter.find();

    res.status(200).json({
      success: true,
      count: adapters.length,
      adapters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single adapter
// @route   GET /api/adapters/:id
// @access  Public
exports.getAdapter = async (req, res) => {
  try {
    const adapter = await Adapter.findById(req.params.id);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Adapter not found',
      });
    }

    res.status(200).json({
      success: true,
      adapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create adapter
// @route   POST /api/adapters
// @access  Private/Admin
exports.createAdapter = async (req, res) => {
  try {
    const {
      name,
      type,
      brand,
      price,
      stock,
      efficiency,
      voltage,
      current,
      description,
      images,
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and price',
      });
    }

    // Create adapter object with only provided fields
    const adapterData = {
      name,
      price,
    };

    // Add optional fields if provided
    if (type !== undefined) adapterData.type = type;
    if (brand !== undefined) adapterData.brand = brand;
    if (stock !== undefined) adapterData.stock = stock;
    if (efficiency !== undefined) adapterData.efficiency = efficiency;
    if (voltage !== undefined) adapterData.voltage = voltage;
    if (current !== undefined) adapterData.current = current;
    if (description !== undefined) adapterData.description = description;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/adapters');
        adapterData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create adapter
    const adapter = await Adapter.create(adapterData);

    res.status(201).json({
      success: true,
      adapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update adapter
// @route   PUT /api/adapters/:id
// @access  Private/Admin
exports.updateAdapter = async (req, res) => {
  try {
    const {
      name,
      type,
      brand,
      price,
      stock,
      efficiency,
      voltage,
      current,
      description,
      images,
    } = req.body;

    // Find adapter
    const adapter = await Adapter.findById(req.params.id);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Adapter not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) adapter.name = name;
    if (type !== undefined) adapter.type = type;
    if (brand !== undefined) adapter.brand = brand;
    if (price !== undefined) adapter.price = price;
    if (stock !== undefined) adapter.stock = stock;
    if (efficiency !== undefined) adapter.efficiency = efficiency;
    if (voltage !== undefined) adapter.voltage = voltage;
    if (current !== undefined) adapter.current = current;
    if (description !== undefined) adapter.description = description;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Delete old images from Cloudinary if they exist
      if (adapter.images && adapter.images.length > 0) {
        await deleteMultipleImages(adapter.images);
      }

      // Upload new images if provided
      if (images.length > 0) {
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/adapters');
          adapter.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        adapter.images = [];
      }
    }

    await adapter.save();

    res.status(200).json({
      success: true,
      adapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete adapter
// @route   DELETE /api/adapters/:id
// @access  Private/Admin
exports.deleteAdapter = async (req, res) => {
  try {
    const adapter = await Adapter.findById(req.params.id);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Adapter not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (adapter.images && adapter.images.length > 0) {
      await deleteMultipleImages(adapter.images);
    }

    await Adapter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Adapter deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
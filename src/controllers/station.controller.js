const Station = require('../models/station.model');
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

// @desc    Get all stations
// @route   GET /api/stations
// @access  Public
exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();

    res.status(200).json({
      success: true,
      count: stations.length,
      stations,
    });
  } catch (error) {
    console.error('Error in getAllStations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single station
// @route   GET /api/stations/:id
// @access  Public
exports.getStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    res.status(200).json({
      success: true,
      station,
    });
  } catch (error) {
    console.error('Error in getStation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create station
// @route   POST /api/stations
// @access  Private/Admin
exports.createStation = async (req, res) => {
  try {
    console.log('=== CREATE STATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      price,
      stockStatus,
      voltage,
      amperage,
      brand,
      quantity,
      offer,
      connectorType,
      phase,
      efficiency,
      description,
      images,
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      console.error('Validation error: Missing name or price');
      return res.status(400).json({
        success: false,
        message: 'Please provide name and price',
      });
    }

    // Validate data types
    if (typeof price !== 'number' || price < 0) {
      console.error('Validation error: Invalid price');
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      console.error('Validation error: Invalid quantity', { quantity, type: typeof quantity });
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    if (stockStatus && !['in stock', 'out of stock'].includes(stockStatus)) {
      console.error('Validation error: Invalid stockStatus', { stockStatus });
      return res.status(400).json({
        success: false,
        message: 'Stock status must be either "in stock" or "out of stock"',
      });
    }

    // Create station object with only provided fields
    const stationData = {
      name,
      price: Number(price),
      stockStatus: stockStatus || 'in stock',
      quantity: quantity !== undefined ? Number(quantity) : 0,
    };

    console.log('Station data prepared:', {
      name: stationData.name,
      price: stationData.price,
      stockStatus: stationData.stockStatus,
      quantity: stationData.quantity,
      quantityType: typeof stationData.quantity
    });

    // Add optional fields if provided
    if (voltage !== undefined) stationData.voltage = Number(voltage);
    if (amperage !== undefined) stationData.amperage = Number(amperage);
    if (brand !== undefined) stationData.brand = brand;
    if (offer !== undefined) stationData.offer = offer;
    if (connectorType !== undefined) stationData.connectorType = connectorType;
    if (phase !== undefined) stationData.phase = phase;
    if (efficiency !== undefined) stationData.efficiency = Number(efficiency);
    if (description !== undefined) stationData.description = description;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        console.log(`Processing ${images.length} images...`);
        // Only upload base64 images
        const base64Images = images.filter(img => isBase64Image(img));
        console.log(`Found ${base64Images.length} base64 images to upload`);
        
        if (base64Images.length > 0) {
          const uploadedImageUrls = await uploadMultipleImages(base64Images, 'powerev/stations');
          stationData.images = uploadedImageUrls;
          console.log(`Successfully uploaded ${uploadedImageUrls.length} images`);
        } else {
          stationData.images = [];
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    console.log('Creating station with data:', stationData);

    // Create station
    const station = await Station.create(stationData);

    console.log('Station created successfully:', station._id);

    res.status(201).json({
      success: true,
      station,
    });
  } catch (error) {
    console.error('=== CREATE STATION ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating station',
      error: error.message,
    });
  }
};

// @desc    Update station
// @route   PUT /api/stations/:id
// @access  Private/Admin
exports.updateStation = async (req, res) => {
  try {
    console.log('=== UPDATE STATION REQUEST ===');
    console.log('Station ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      price,
      stockStatus,
      voltage,
      amperage,
      brand,
      quantity,
      offer,
      connectorType,
      phase,
      efficiency,
      description,
      images,
    } = req.body;

    // Find station
    const station = await Station.findById(req.params.id);

    if (!station) {
      console.error('Station not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    console.log('Found station:', {
      id: station._id,
      name: station.name,
      currentStockStatus: station.stockStatus,
      currentQuantity: station.quantity
    });

    // Validate data types before updating
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      console.error('Validation error: Invalid price');
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      console.error('Validation error: Invalid quantity', { quantity, type: typeof quantity });
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    if (stockStatus && !['in stock', 'out of stock'].includes(stockStatus)) {
      console.error('Validation error: Invalid stockStatus', { stockStatus });
      return res.status(400).json({
        success: false,
        message: 'Stock status must be either "in stock" or "out of stock"',
      });
    }

    // Update fields if provided
    if (name !== undefined) station.name = name;
    if (price !== undefined) station.price = Number(price);
    if (stockStatus !== undefined) station.stockStatus = stockStatus;
    if (quantity !== undefined) station.quantity = Number(quantity);
    if (voltage !== undefined) station.voltage = Number(voltage);
    if (amperage !== undefined) station.amperage = Number(amperage);
    if (brand !== undefined) station.brand = brand;
    if (offer !== undefined) station.offer = offer;
    if (connectorType !== undefined) station.connectorType = connectorType;
    if (phase !== undefined) station.phase = phase;
    if (efficiency !== undefined) station.efficiency = Number(efficiency);
    if (description !== undefined) station.description = description;

    console.log('Updated station data:', {
      name: station.name,
      price: station.price,
      stockStatus: station.stockStatus,
      quantity: station.quantity,
      quantityType: typeof station.quantity
    });

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      console.log(`Processing ${images.length} images for update...`);
      
      // Separate existing URLs from new base64 images
      const existingUrls = images.filter(img => isCloudinaryUrl(img));
      const newBase64Images = images.filter(img => isBase64Image(img));

      console.log(`Existing URLs: ${existingUrls.length}, New images: ${newBase64Images.length}`);

      // Determine which old images to delete
      const oldImagesToDelete = station.images.filter(oldImg => !existingUrls.includes(oldImg));

      // Delete old images that are no longer needed
      if (oldImagesToDelete.length > 0) {
        try {
          console.log(`Deleting ${oldImagesToDelete.length} old images...`);
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
          console.log(`Uploading ${newBase64Images.length} new images...`);
          uploadedImageUrls = await uploadMultipleImages(newBase64Images, 'powerev/stations');
          console.log(`Successfully uploaded ${uploadedImageUrls.length} images`);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      }

      // Combine existing URLs with newly uploaded URLs
      station.images = [...existingUrls, ...uploadedImageUrls];
      console.log(`Total images after update: ${station.images.length}`);
    }

    console.log('Saving updated station...');
    await station.save();
    console.log('Station updated successfully');

    res.status(200).json({
      success: true,
      station,
    });
  } catch (error) {
    console.error('=== UPDATE STATION ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating station',
      error: error.message,
    });
  }
};

// @desc    Delete station
// @route   DELETE /api/stations/:id
// @access  Private/Admin
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    // Delete images from Cloudinary if they exist
    if (station.images && station.images.length > 0) {
      try {
        await deleteMultipleImages(station.images);
      } catch (deleteError) {
        console.error('Error deleting images:', deleteError);
        // Continue with deletion even if image deletion fails
      }
    }

    await Station.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Station deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteStation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
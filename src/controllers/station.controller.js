const Station = require('../models/station.model');
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require('../utils/cloudinary');

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

    // Create station object with only provided fields
    const stationData = {
      name,
      price,
      quantity,
    };

    // Add optional fields if provided
    if (voltage !== undefined) stationData.voltage = voltage;
    if (amperage !== undefined) stationData.amperage = amperage;
    if (brand !== undefined) stationData.brand = brand;
    if (stock !== undefined) stationData.stock = stock;
    if (offer !== undefined) stationData.offer = offer;
    if (connectorType !== undefined) stationData.connectorType = connectorType;
    if (phase !== undefined) stationData.phase = phase;
    if (efficiency !== undefined) stationData.efficiency = efficiency;
    if (description !== undefined) stationData.description = description;

    // Handle image uploads to Cloudinary
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      try {
        const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/stations');
        stationData.images = uploadedImageUrls;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message,
        });
      }
    }

    // Create station
    const station = await Station.create(stationData);

    res.status(201).json({
      success: true,
      station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update station
// @route   PUT /api/stations/:id
// @access  Private/Admin
exports.updateStation = async (req, res) => {
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

    // Find station
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) station.name = name;
    if (price !== undefined) station.price = price;
    if (quantity !== undefined) station.quantity = quantity;
    if (voltage !== undefined) station.voltage = voltage;
    if (amperage !== undefined) station.amperage = amperage;
    if (brand !== undefined) station.brand = brand;
    if (stock !== undefined) station.stock = stock;
    if (offer !== undefined) station.offer = offer;
    if (connectorType !== undefined) station.connectorType = connectorType;
    if (phase !== undefined) station.phase = phase;
    if (efficiency !== undefined) station.efficiency = efficiency;
    if (description !== undefined) station.description = description;

    // Handle image updates
    if (images !== undefined && Array.isArray(images)) {
      // Delete old images from Cloudinary if they exist
      if (station.images && station.images.length > 0) {
        await deleteMultipleImages(station.images);
      }

      // Upload new images if provided
      if (images.length > 0) {
        try {
          const uploadedImageUrls = await uploadMultipleImages(images, 'powerev/stations');
          station.images = uploadedImageUrls;
        } catch (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      } else {
        station.images = [];
      }
    }

    await station.save();

    res.status(200).json({
      success: true,
      station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
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
      await deleteMultipleImages(station.images);
    }

    await Station.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Station deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
const Gallery = require('../models/gallery.model');

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public
exports.getAllGalleryItems = async (req, res) => {
  try {
    console.log('📷 Fetching all gallery items...');
    const galleryItems = await Gallery.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${galleryItems.length} gallery items`);

    res.status(200).json({
      success: true,
      count: galleryItems.length,
      galleryItems,
    });
  } catch (error) {
    console.error('❌ Error in getAllGalleryItems:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single gallery item
// @route   GET /api/gallery/:id
// @access  Public
exports.getGalleryItem = async (req, res) => {
  try {
    console.log('📷 Fetching gallery item:', req.params.id);
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      console.log('❌ Gallery item not found');
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    console.log('✅ Gallery item found');
    res.status(200).json({
      success: true,
      galleryItem,
    });
  } catch (error) {
    console.error('❌ Error in getGalleryItem:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create gallery item
// @route   POST /api/gallery
// @access  Private/Admin
exports.createGalleryItem = async (req, res) => {
  try {
    console.log('📷 Creating new gallery item...');
    const { image, title, description } = req.body;

    // Validate required fields
    if (!image) {
      console.log('❌ No image provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide an image',
      });
    }

    // Create gallery item object
    const galleryData = {
      image: image, // Store base64 directly in MongoDB
      title: title || '',
      description: description || '',
    };

    console.log('Creating gallery item with title:', galleryData.title || 'No title');
    const galleryItem = await Gallery.create(galleryData);

    console.log('✅ Gallery item created successfully:', galleryItem._id);
    res.status(201).json({
      success: true,
      galleryItem,
    });
  } catch (error) {
    console.error('❌ Error in createGalleryItem:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update gallery item
// @route   PUT /api/gallery/:id
// @access  Private/Admin
exports.updateGalleryItem = async (req, res) => {
  try {
    console.log('📷 Updating gallery item:', req.params.id);
    const { image, title, description } = req.body;

    // Find gallery item
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      console.log('❌ Gallery item not found');
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    // Update fields if provided
    if (title !== undefined) {
      console.log('Updating title:', title);
      galleryItem.title = title;
    }
    if (description !== undefined) {
      console.log('Updating description:', description);
      galleryItem.description = description;
    }
    if (image !== undefined && image !== '') {
      console.log('Updating image');
      galleryItem.image = image;
    }

    await galleryItem.save();

    console.log('✅ Gallery item updated successfully');
    res.status(200).json({
      success: true,
      galleryItem,
    });
  } catch (error) {
    console.error('❌ Error in updateGalleryItem:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
exports.deleteGalleryItem = async (req, res) => {
  try {
    console.log('📷 Deleting gallery item:', req.params.id);
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      console.log('❌ Gallery item not found');
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    await Gallery.findByIdAndDelete(req.params.id);

    console.log('✅ Gallery item deleted successfully');
    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteGalleryItem:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
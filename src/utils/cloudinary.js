// src/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload multiple images to Cloudinary
 * @param {string[]} images - Array of base64 image strings
 * @param {string} folder - Cloudinary folder path (e.g., 'powerev/boxes')
 * @returns {Promise<string[]>} - Array of uploaded image URLs
 */
const uploadMultipleImages = async (images, folder = 'powerev') => {
  try {
    if (!images || images.length === 0) {
      return [];
    }

    // Upload all images in parallel
    const uploadPromises = images.map((image) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          image,
          {
            folder: folder,
            resource_type: 'auto',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise<void>}
 */
const deleteMultipleImages = async (imageUrls) => {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    // Extract public IDs from URLs
    const publicIds = imageUrls.map((url) => {
      try {
        // Extract public ID from URL
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/powerev/boxes/abc123.jpg
        const parts = url.split('/');
        const uploadIndex = parts.findIndex((part) => part === 'upload');
        
        if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
          // Get everything after 'upload/v123456/'
          const pathParts = parts.slice(uploadIndex + 2);
          const fullPath = pathParts.join('/');
          // Remove file extension
          const publicId = fullPath.replace(/\.[^/.]+$/, '');
          return publicId;
        }
        return null;
      } catch (error) {
        console.error('Error extracting public ID from URL:', url, error);
        return null;
      }
    }).filter(id => id !== null);

    if (publicIds.length === 0) {
      console.log('No valid public IDs to delete');
      return;
    }

    // Delete all images in parallel
    const deletePromises = publicIds.map((publicId) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error('Cloudinary delete error for', publicId, ':', error);
            // Don't reject - continue deleting other images
            resolve({ success: false, publicId, error });
          } else {
            resolve({ success: true, publicId, result });
          }
        });
      });
    });

    const results = await Promise.all(deletePromises);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`Cloudinary delete results: ${successCount} succeeded, ${failCount} failed`);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    // Don't throw - deletion errors shouldn't block operations
  }
};

/**
 * Upload single image to Cloudinary
 * @param {string} image - Base64 image string
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<string>} - Uploaded image URL
 */
const uploadImage = async (image, folder = 'powerev') => {
  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete single image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<void>}
 */
const deleteImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted successfully:', publicId);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion errors shouldn't block operations
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null
 */
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex((part) => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
      const pathParts = parts.slice(uploadIndex + 2);
      const fullPath = pathParts.join('/');
      const publicId = fullPath.replace(/\.[^/.]+$/, '');
      return publicId;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

module.exports = {
  uploadMultipleImages,
  deleteMultipleImages,
  uploadImage,
  deleteImage,
  extractPublicId
};
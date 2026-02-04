const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,       
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

/**
 * Upload a single image to Cloudinary
 * @param {string} imageData 
 * @param {string} folder 
 * @returns {Promise<string>}
 */
const uploadImage = async (imageData, folder = 'powerev') => {
  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder: folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} images - Array of base64 image data or file paths
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Array<string>>} - Returns array of secure URLs
 */
const uploadMultipleImages = async (images, folder = 'powerev') => {
  try {
    const uploadPromises = images.map((image) => uploadImage(image, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple images upload error:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} imageUrl - URL of the image to delete
 * @returns {Promise<boolean>} - Returns true if deletion successful
 */
const deleteImage = async (imageUrl) => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} imageUrls - Array of image URLs to delete
 * @returns {Promise<boolean>} - Returns true if all deletions successful
 */
const deleteMultipleImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map((url) => deleteImage(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Multiple images delete error:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
};
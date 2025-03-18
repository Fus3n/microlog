require('dotenv').config();

const { v2: cloudinary } = require('cloudinary');


const FOLDERS = {
    POST_IMAGE: 'post_image',
    COMMENT_IMAGE: 'comment_image'
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (directory, postId, image) => {
    // Upload photo to folder post_image/post_id/post_id-filename
    const result = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: `${directory}/${postId}`,
        public_id: `${postId}-${image.name}`,
    });

    return result;  
}

// takes a list of images to delete 
const deleteFromCloudinary = async (images) => {
    try {
        for (const image of images) {
            const publicId = image.public_id;
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }
    } catch (error) {
        throw error;
    }
};


module.exports = { uploadToCloudinary, deleteFromCloudinary, FOLDERS };
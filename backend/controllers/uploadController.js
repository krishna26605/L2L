import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const uploadController = {
  // Upload image
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file to local storage
      fs.writeFileSync(filePath, req.file.buffer);

      // Generate public URL (adjust based on your server setup)
      const publicUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${fileName}`;

      res.json({
        success: true,
        imageUrl: publicUrl,
        fileName: fileName
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },

  // Delete image
  async deleteImage(req, res) {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const filePath = path.join(uploadDir, fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete the file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  },

  // Get user's uploaded images
  async getUserImages(req, res) {
    try {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      
      if (!fs.existsSync(uploadDir)) {
        return res.json({
          success: true,
          images: []
        });
      }

      const files = fs.readdirSync(uploadDir);
      const images = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        })
        .map(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file}`,
            uploadedAt: stats.birthtime.toISOString(),
            size: stats.size,
            contentType: `image/${path.extname(file).slice(1)}`
          };
        });

      res.json({
        success: true,
        images
      });
    } catch (error) {
      console.error('Get user images error:', error);
      res.status(500).json({ error: 'Failed to get user images' });
    }
  },

  // Get image info
  async getImageInfo(req, res) {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const filePath = path.join(uploadDir, fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const ext = path.extname(fileName).toLowerCase();

      const imageInfo = {
        fileName: fileName,
        url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${fileName}`,
        uploadedBy: req.user._id,
        uploadedAt: stats.birthtime.toISOString(),
        size: stats.size,
        contentType: `image/${ext.slice(1)}`,
        created: stats.birthtime.toISOString(),
        updated: stats.mtime.toISOString()
      };

      res.json({
        success: true,
        image: imageInfo
      });
    } catch (error) {
      console.error('Get image info error:', error);
      res.status(500).json({ error: 'Failed to get image info' });
    }
  }
};

import express from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(authController.verifyToken);

// Upload routes
router.post('/image', upload.single('image'), uploadController.uploadImage);
router.get('/images', uploadController.getUserImages);
router.get('/image/:fileName', uploadController.getImageInfo);
router.delete('/image/:fileName', uploadController.deleteImage);

export default router;

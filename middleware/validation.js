import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateUser = {
  createProfile: [
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('role')
      .isIn(['donor', 'ngo'])
      .withMessage('Role must be either "donor" or "ngo"'),
    handleValidationErrors
  ],
  updateProfile: [
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('photoURL')
      .optional()
      .isURL()
      .withMessage('Photo URL must be a valid URL'),
    handleValidationErrors
  ]
};

// Donation validation rules
export const validateDonation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('quantity')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Quantity is required and must be less than 50 characters'),
    body('foodType')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Food type must be between 2 and 50 characters'),
    body('expiryTime')
      .isISO8601()
      .withMessage('Expiry time must be a valid ISO 8601 date'),
    body('pickupWindow.start')
      .isISO8601()
      .withMessage('Pickup window start must be a valid ISO 8601 date'),
    body('pickupWindow.end')
      .isISO8601()
      .withMessage('Pickup window end must be a valid ISO 8601 date'),
    body('location.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('location.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    handleValidationErrors
  ],
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('quantity')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Quantity must be less than 50 characters'),
    body('foodType')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Food type must be between 2 and 50 characters'),
    body('expiryTime')
      .optional()
      .isISO8601()
      .withMessage('Expiry time must be a valid ISO 8601 date'),
    body('pickupWindow.start')
      .optional()
      .isISO8601()
      .withMessage('Pickup window start must be a valid ISO 8601 date'),
    body('pickupWindow.end')
      .optional()
      .isISO8601()
      .withMessage('Pickup window end must be a valid ISO 8601 date'),
    body('location.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('location.address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    handleValidationErrors
  ]
};

// Query parameter validation
export const validateQuery = {
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    handleValidationErrors
  ],
  location: [
    query('lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    query('lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage('Radius must be between 0.1 and 100 kilometers'),
    handleValidationErrors
  ],
  search: [
    query('q')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
  ]
};

// Parameter validation
export const validateParams = {
  id: [
    param('id')
      .isLength({ min: 1 })
      .withMessage('ID is required'),
    handleValidationErrors
  ],
  fileName: [
    param('fileName')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name is required and must be less than 255 characters'),
    handleValidationErrors
  ]
};

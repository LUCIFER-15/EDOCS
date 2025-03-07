const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/profile', isAuthenticated, userController.getProfile);

// Application routes
router.post('/application', isAuthenticated, upload.fields([
    { name: 'pancard', maxCount: 1 },
    { name: 'rationCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 }
]), userController.submitApplication);

router.get('/application', isAuthenticated, userController.getApplication);

module.exports = router; 
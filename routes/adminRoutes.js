const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware to check if admin is logged in
const isAdminAuthenticated = (req, res, next) => {
    if (req.session.adminId) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};

// Admin routes
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

// Application management routes
router.get('/applications', isAdminAuthenticated, adminController.getAllApplications);
router.get('/applications/:id', isAdminAuthenticated, adminController.getApplicationById);
router.put('/applications/:id/status', isAdminAuthenticated, adminController.updateApplicationStatus);
router.put('/applications/:id/payment', isAdminAuthenticated, adminController.updatePaymentStatus);

module.exports = router; 
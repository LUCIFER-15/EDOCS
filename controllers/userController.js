const User = require('../models/User');
const Application = require('../models/Application');
const fs = require('fs');
const mongoose = require('mongoose');

// Register a new user
exports.register = async (req, res) => {
    try {
        // Check MongoDB connection state
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
            return res.status(500).json({ 
                message: 'Database connection issue', 
                error: 'MongoDB not connected' 
            });
        }

        const { name, email, password, contactNumber } = req.body;

        console.log('Registration attempt:', { name, email, contactNumber });

        // Check if user already exists - with increased timeout and error handling
        let user;
        try {
            user = await User.findOne({ email })
                .maxTimeMS(30000) // Increase timeout for this query
                .exec();
        } catch (findError) {
            console.error('Error finding user:', findError);
            return res.status(500).json({ 
                message: 'Database query error', 
                error: findError.message 
            });
        }

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            contactNumber
        });

        // Save with explicit timeout
        try {
            await user.save({ maxTimeMS: 30000 });
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            return res.status(500).json({ 
                message: 'Error creating user', 
                error: saveError.message 
            });
        }

        // Create session
        req.session.userId = user._id;
        
        res.status(201).json({ 
            message: 'User registered successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create session
        req.session.userId = user._id;
        
        res.json({ 
            message: 'Login successful',
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout user
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit application
exports.submitApplication = async (req, res) => {
    try {
        const { nationality, income, domicileStatus } = req.body;
        const userId = req.session.userId;

        // Check if user already has an application
        const existingApplication = await Application.findOne({ user: userId });
        if (existingApplication) {
            return res.status(400).json({ message: 'You already have an application submitted' });
        }

        // Ensure files exist
        if (!req.files || !req.files.pancard || !req.files.rationCard || !req.files.aadhaarCard) {
            return res.status(400).json({ message: 'All document files are required' });
        }

        // Extract just the filename from the full path for each document
        const pancardFilename = req.files.pancard[0].filename || req.files.pancard[0].path.split('/').pop();
        const rationCardFilename = req.files.rationCard[0].filename || req.files.rationCard[0].path.split('/').pop();
        const aadhaarCardFilename = req.files.aadhaarCard[0].filename || req.files.aadhaarCard[0].path.split('/').pop();

        // Create new application with just the filenames and uploads/ prefix
        const application = new Application({
            user: userId,
            nationality,
            income,
            domicileStatus,
            documents: {
                pancard: `uploads/${pancardFilename}`,
                rationCard: `uploads/${rationCardFilename}`,
                aadhaarCard: `uploads/${aadhaarCardFilename}`
            }
        });

        await application.save();
        
        res.status(201).json({ 
            message: 'Application submitted successfully',
            applicationId: application._id
        });
    } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user application
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findOne({ user: req.session.userId });
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Ensure document paths are properly formatted
        const applicationData = application.toObject();
        
        // Check if documents exist and fix paths if needed
        if (applicationData.documents) {
            // Make sure all document paths start with 'uploads/'
            if (applicationData.documents.pancard && !applicationData.documents.pancard.startsWith('uploads/')) {
                // Handle absolute paths from Render
                if (applicationData.documents.pancard.includes('/opt/render/project/src/')) {
                    const filename = applicationData.documents.pancard.split('/').pop();
                    applicationData.documents.pancard = `uploads/${filename}`;
                } else {
                    applicationData.documents.pancard = `uploads/${applicationData.documents.pancard.split('/').pop()}`;
                }
            }
            
            if (applicationData.documents.rationCard && !applicationData.documents.rationCard.startsWith('uploads/')) {
                // Handle absolute paths from Render
                if (applicationData.documents.rationCard.includes('/opt/render/project/src/')) {
                    const filename = applicationData.documents.rationCard.split('/').pop();
                    applicationData.documents.rationCard = `uploads/${filename}`;
                } else {
                    applicationData.documents.rationCard = `uploads/${applicationData.documents.rationCard.split('/').pop()}`;
                }
            }
            
            if (applicationData.documents.aadhaarCard && !applicationData.documents.aadhaarCard.startsWith('uploads/')) {
                // Handle absolute paths from Render
                if (applicationData.documents.aadhaarCard.includes('/opt/render/project/src/')) {
                    const filename = applicationData.documents.aadhaarCard.split('/').pop();
                    applicationData.documents.aadhaarCard = `uploads/${filename}`;
                } else {
                    applicationData.documents.aadhaarCard = `uploads/${applicationData.documents.aadhaarCard.split('/').pop()}`;
                }
            }
        }
        
        res.json(applicationData);
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// In app.js or server initialization
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
} 
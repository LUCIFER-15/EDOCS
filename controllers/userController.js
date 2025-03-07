const User = require('../models/User');
const Application = require('../models/Application');
const fs = require('fs');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, contactNumber } = req.body;

        console.log('Registration attempt:', { name, email, contactNumber });

        // Check if user already exists
        let user = await User.findOne({ email }).maxTimeMS(20000); // Add timeout for this query
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

        await user.save();

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

        // Create new application
        const application = new Application({
            user: userId,
            nationality,
            income,
            domicileStatus,
            documents: {
                pancard: req.files.pancard[0].path,
                rationCard: req.files.rationCard[0].path,
                aadhaarCard: req.files.aadhaarCard[0].path
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
        res.json(application);
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
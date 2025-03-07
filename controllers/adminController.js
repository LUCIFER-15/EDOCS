const User = require('../models/User');
const Application = require('../models/Application');

// Admin login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin exists
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create session
        req.session.adminId = admin._id;
        
        res.json({ 
            message: 'Admin login successful',
            adminId: admin._id
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
};

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find().populate('user', 'name email contactNumber');
        res.json(applications);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id).populate('user', 'name email contactNumber');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json(application);
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, adminComments } = req.body;
        
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        application.status = status;
        application.adminComments = adminComments || application.adminComments;
        
        await application.save();
        
        res.json({ 
            message: 'Application status updated successfully',
            application
        });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        application.paymentStatus = paymentStatus;
        
        await application.save();
        
        res.json({ 
            message: 'Payment status updated successfully',
            application
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 
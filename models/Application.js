const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    income: {
        type: Number,
        required: true
    },
    domicileStatus: {
        type: String,
        required: true
    },
    documents: {
        pancard: {
            type: String, // File path
            required: true
        },
        rationCard: {
            type: String, // File path
            required: true
        },
        aadhaarCard: {
            type: String, // File path
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminComments: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'not_required'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
ApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Application', ApplicationSchema); 
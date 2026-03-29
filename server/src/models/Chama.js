import mongoose from 'mongoose';

const chamaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Chama name is required'],
        trim: true,
        maxlength: [150, 'Name too long']
    },
    description: { 
        type: String, 
        maxlength: 500 
    },
    contributionAmount: {
        type: Number,
        required: [true, 'Regular contribution amount is required'],
        min: [1, 'Must be at least KES 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Contribution amount must be a whole number in KES'
        }
    },
    meetingFrequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'monthly'
    },
    defaultLoanInterestRate: {
        type: Number,
        default: 0.10,      // 10% flat rate
        min: 0,
        max: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'dissolved'],
        default: 'active'
    }
}, { timestamps: true } );
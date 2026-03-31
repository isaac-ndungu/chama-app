import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['chairperson', 'treasurer', 'member'],
        required: true
    },
    approvedAt: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        default: ''
    }
}, { _id: false });

const rejectionSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['chairperson', 'treasurer', 'member'],
        required: true
    },
    rejectedAt: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        required: true
    }
}, { _id: false });

const repaymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        validate: {
            validator: v => Number.isInteger(v) && v > 0,
            message: 'Must be positive integer'
        }
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    mpesaRef: {
        type: String,
        uppercase: true,
        trim: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const loanSchema = new mongoose.Schema({
    chamaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Chama', 
        required: true, 
        index: true
     },
    borrowerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
     },
    requestedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
     },
    principalAmount: { 
        type: Number, required: true, 
        validate: { 
            validator: v => Number.isInteger(v) && v > 0 
        }
     },
    interestRate: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1
     },
    durationMonths: { 
        type: Number, 
        required: true, 
        min: 1
     },
    
    totalInterest: { 
        type: Number, 
        required: true
     },
    totalDue: { 
        type: Number, 
        required: true
     },
    monthlyInstalment: { 
        type: Number, 
        required: true
     },
    issuedAt: { 
        type: Date, 
        default: Date.now
     },
    dueDate: { 
        type: Date, 
        required: true
     },
    
    quorumRequired: { 
        type: Number, 
        required: true
     },
    approvals: [approvalSchema],
    rejections: [rejectionSchema],
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    repayments: [repaymentSchema],
    totalRepaid: { 
        type: Number, 
        default: 0
     },
    status: {
        type: String,
        enum: ['pending', 'active', 'settled', 'defaulted'],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.model('Loan', loanSchema);
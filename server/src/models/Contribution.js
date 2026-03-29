import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
    chamaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chama',
        required: true,
        index: true
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cycleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cycle',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: v => Number.isInteger(v) && v > 0,
            message: 'Amount must be a positive whole number in KES'
        }
    },
    mpesaRef: {
        type: String,
        required: [true, 'M-Pesa reference is required'],
        uppercase: true,
        trim: true
    },
    paymentDate: {
        type: Date,
        required: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recordedAt: {
        type: Date,
        default: Date.now
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending_verification', 'verified', 'disputed', 'rejected'],
        default: 'pending_verification'
    },
    disputeNote: {
        type: String
    }
}, { timestamps: true });



// Prevent duplicate M-Pesa references within the same chama
contributionSchema.index({ mpesaRef: 1, chamaId: 1 }, { unique: true });
contributionSchema.index({ chamaId: 1, cycleId: 1 });

export default mongoose.model('Contribution', contributionSchema);
import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
    chamaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chama',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['chairperson', 'treasurer', 'member'],
        default: 'member'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'exited'],
        default: 'active'
    },
    rotationPosition: { 
        type: Number
     },  

    joinedAt: { 
        type: Date, default: Date.now
     },
    invitedBy: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
     }
}, { timestamps: true });

// ensure uniqueness - one membership per user per chama
membershipSchema.index({ chamaId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);
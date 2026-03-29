import mongoose from 'mongoose';

const memberLedgerSchema = new mongoose.Schema({
    chamaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chama',
        required: true
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalContributed: {
        type: Number,
        default: 0
    },
    totalOwed: {
        type: Number,
        default: 0
    },
    potReceived: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


memberLedgerSchema.index({ chamaId: 1, memberId: 1 }, { unique: true });

export default mongoose.model('MemberLedger', memberLedgerSchema);
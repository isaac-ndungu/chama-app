import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    chamaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chama',
        required: true,
        index: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CONTRIBUTION_RECORDED', 'CONTRIBUTION_VERIFIED', 'CONTRIBUTION_DISPUTED', 'CONTRIBUTION_REJECTED',
            'LOAN_APPLIED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_REPAYMENT_RECORDED', 'LOAN_DEFAULTED',
            'MEMBER_INVITED', 'MEMBER_ROLE_CHANGED', 'MEMBER_SUSPENDED', 'MEMBER_EXITED',
            'CYCLE_CREATED', 'CYCLE_CLOSED', 'POT_DISBURSED',
            'CHAMA_CREATED', 'CHAMA_UPDATED', 'CHAMA_SETTINGS_UPDATED'
        ]
    },
    targetCollection: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    before: {
        type: mongoose.Schema.Types.Mixed
    },
    after: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    }
}, { timestamps: true, })

// ensure audit logs are never updated or deleted
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function () {
    throw new Error('Audit log entries are immutable');
});

export default mongoose.model('AuditLog', auditLogSchema);
import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema(
    {
        chamaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chama',
            required: true,
            index: true,
        },
        cycleNumber: {
            type: Number,
            required: true
        },

        potRecipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        potRecipientPosition: { 
            type: Number, required: true

         },
        startDate: { 
            type: Date, 
            required: true
         },
        endDate: { 
            type: Date, 
            required: true
         },

        expectedAmount: { 
            type: Number, 
            default: 0
         },
        actualAmount: {
            type: Number, 
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'collection', 'disbursed', 'closed'],
            default: 'active',
        },
        disbursementRef: { 
            type: String
         },   
        disbursedAt: {
             type: Date 
        },
        disbursedAmount: { 
            type: Number 
        },   
        recipientConfirmedAt: { 
            type: Date
         },
    },
    { timestamps: true }
);

// One active/disbursed cycle per chama at a time — enforced in controller logic
cycleSchema.index({ chamaId: 1, cycleNumber: 1 }, { unique: true });

export default mongoose.model('Cycle', cycleSchema);
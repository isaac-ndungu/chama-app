import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
    chamaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Chama', 
        required: true, 
        index: true
     },
    cycleNumber: { 
        type: Number, 
        required: true
     },
    startDate: { 
        type: Date, 
        required: true
     },
    endDate: { 
        type: Date, 
        required: true
     },
    potRecipientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
     },
    expectedAmount: { 
        type: Number
     },  
    actualAmount: { 
        type: Number, 
        default: 0
     },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'collection', 'disbursed', 'closed'],
        default: 'upcoming'
    },
    disbursementRef: { 
        type: String // M-Pesa reference 
     },   
    disbursedAt: { 
        type: Date
     }
}, { timestamps: true } );

// ensure that there is only one active cycle per chama at a time
cycleSchema.index({ chamaId: 1, cycleNumber: 1 }, { unique: true });

export default mongoose.model('Cycle', cycleSchema);
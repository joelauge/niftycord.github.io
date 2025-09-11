const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    tradeId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    offerer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    offererAddress: {
        type: String,
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    receiverAddress: {
        type: String,
        required: true
    },
    offeredNFTs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NFT'
    }],
    requestedNFTs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NFT'
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    message: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    transactionHash: {
        type: String,
        default: null
    },
    serverId: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

// Index for trade queries
tradeSchema.index({ offerer: 1, status: 1 });
tradeSchema.index({ receiver: 1, status: 1 });
tradeSchema.index({ status: 1, serverId: 1 });
tradeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Trade', tradeSchema);


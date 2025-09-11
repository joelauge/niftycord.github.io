const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    discordId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    address: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    publicKey: {
        type: String,
        required: true
    },
    mnemonic: {
        type: String,
        required: true
    },
    ss58Format: {
        type: Number,
        default: 0
    },
    balance: {
        free: {
            type: String,
            default: '0'
        },
        reserved: {
            type: String,
            default: '0'
        },
        total: {
            type: String,
            default: '0'
        }
    },
    nfts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NFT'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Update lastUpdated on save
walletSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Wallet', walletSchema);


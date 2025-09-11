const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    nftId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    attributes: [{
        trait_type: String,
        value: String
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
        index: true
    },
    ownerAddress: {
        type: String,
        required: true,
        index: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    creatorAddress: {
        type: String,
        required: true
    },
    collection: {
        type: String,
        default: 'NiftyCord Collection'
    },
    price: {
        type: String,
        default: '0'
    },
    isForSale: {
        type: Boolean,
        default: false
    },
    isTradable: {
        type: Boolean,
        default: true
    },
    blockchain: {
        type: String,
        default: 'polkadot'
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
    serverName: {
        type: String,
        required: true
    },
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
nftSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Index for marketplace queries
nftSchema.index({ isForSale: 1, serverId: 1 });
nftSchema.index({ owner: 1, isActive: 1 });
nftSchema.index({ collection: 1, isActive: 1 });

module.exports = mongoose.model('NFT', nftSchema);


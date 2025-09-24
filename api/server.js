const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import configuration
const config = require('./config');

// Import models
const NFT = require('./models/NFT');
const Wallet = require('./models/Wallet');

// Import authentication
require('./auth/discord');
const { requireAuth, requireWallet, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || config.API_PORT;

// Rate limiting (relaxed for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs (increased for development)
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        'https://niftycord.com',
        'https://niftycord.github.io',
        'https://*.railway.app'
    ],
    credentials: true
}));
app.use(express.json());

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve NFT detail page with server-side rendered meta tags for Discord unfurling
// This must come BEFORE express.static to intercept the request
app.get('/nft-detail.html', async (req, res) => {
    try {
        const nftId = req.query.id;
        console.log('🔍 NFT Detail Request:', { nftId, query: req.query });
        
        if (!nftId) {
            console.log('❌ No NFT ID provided, serving static page');
            return res.sendFile(path.join(__dirname, '../nft-detail.html'));
        }
        
        // Fetch NFT data by nftId (not MongoDB _id)
        console.log('🔍 Fetching NFT from database:', nftId);
        const nft = await NFT.findOne({ nftId: nftId }).populate('owner');
        console.log('📊 NFT found:', nft ? 'YES' : 'NO', nft ? { name: nft.name, price: nft.price } : '');
        
        if (!nft) {
            console.log('❌ NFT not found, serving static page');
            return res.sendFile(path.join(__dirname, '../nft-detail.html'));
        }
        
        // Read the HTML template
        const fs = require('fs');
        let html = fs.readFileSync(path.join(__dirname, '../nft-detail.html'), 'utf8');
        
        // Replace meta tags with actual NFT data
        const nftName = nft.name || 'Unnamed NFT';
        const nftDescription = nft.description || 'View this NFT on the NiftyCord marketplace';
        const nftImage = nft.image || 'https://niftycord.com/assets/images/niftycord_logo_word.png';
        const nftPrice = nft.price ? `${nft.price} DOT` : 'Not for sale';
        const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        
        // Update meta tags
        console.log('🔄 Replacing meta tags with NFT data:', { nftName, nftDescription, nftPrice });
        html = html.replace(
            /<meta property="og:title" id="og-title" content="[^"]*">/,
            `<meta property="og:title" content="${nftName} - NiftyCord Marketplace">`
        );
        html = html.replace(
            /<meta property="og:description" id="og-description" content="[^"]*">/,
            `<meta property="og:description" content="${nftDescription} | Price: ${nftPrice}">`
        );
        html = html.replace(
            /<meta property="og:image" id="og-image" content="[^"]*">/,
            `<meta property="og:image" content="${nftImage}">`
        );
        html = html.replace(
            /<meta property="og:url" id="og-url" content="">/,
            `<meta property="og:url" content="${currentUrl}">`
        );
        html = html.replace(
            /<meta name="twitter:title" id="twitter-title" content="[^"]*">/,
            `<meta name="twitter:title" content="${nftName} - NiftyCord Marketplace">`
        );
        html = html.replace(
            /<meta name="twitter:description" id="twitter-description" content="[^"]*">/,
            `<meta name="twitter:description" content="${nftDescription} | Price: ${nftPrice}">`
        );
        html = html.replace(
            /<meta name="twitter:image" id="twitter-image" content="[^"]*">/,
            `<meta name="twitter:image" content="${nftImage}">`
        );
        html = html.replace(
            /<title id="page-title">[^<]*<\/title>/,
            `<title>${nftName} - NiftyCord Marketplace</title>`
        );
        
        console.log('✅ Successfully rendered NFT detail page with meta tags');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        console.error('Error serving NFT detail page:', error);
        // Fallback to static page
        res.sendFile(path.join(__dirname, '../nft-detail.html'));
    }
});

app.use(express.static(path.join(__dirname, '../')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'niftycord-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB (same as your bot)
const connectDB = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('📍 Using connection string:', config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
        
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas (same as Discord bot)');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('🔄 Running in offline mode with sample data...');
        console.log('💡 Make sure to set MONGODB_URI environment variable with your Atlas connection string');
    }
};

connectDB();

// Authentication Routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/login?error=discord_auth_failed' }),
    (req, res) => {
        // Successful authentication, redirect to marketplace
        res.redirect('/marketplace');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

app.get('/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar,
                hasWallet: !!req.user.wallet
            }
        });
    } else {
        res.json({
            success: false,
            user: null
        });
    }
});

// Sample NFT data for offline mode
const sampleNFTs = [
    {
        id: '1',
        nftId: 'sample_nft_1',
        name: 'Sword of Sacrifice',
        description: 'A legendary sword with ancient powers',
        image: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Sword',
        collection: 'Gaming Items',
        price: '144.04',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: 2.05,
        currentValue: '266.6454898',
        usdValue: '$144.04',
        available: '1',
        totalValue: '$144.04'
    },
    {
        id: '2',
        nftId: 'sample_nft_2',
        name: 'Magic Hammer',
        description: 'A powerful hammer that can break any barrier',
        image: 'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Hammer',
        collection: 'Gaming Items',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: -2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '1',
        totalValue: '$2,134.325'
    },
    {
        id: '3',
        nftId: 'sample_nft_3',
        name: 'Helios Soothsayer',
        description: 'A mystical orb that reveals the future',
        image: 'https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Orb',
        collection: 'Mystical Items',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: 2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '50',
        totalValue: '$2,134.325'
    },
    {
        id: '4',
        nftId: 'sample_nft_4',
        name: 'Kilgeth Sword',
        description: 'A blade forged in the fires of Mount Kilgeth',
        image: 'https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=Blade',
        collection: 'Legendary Weapons',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: -2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '5',
        totalValue: '$2,134.325'
    },
    {
        id: '5',
        nftId: 'sample_nft_5',
        name: '+3 Wineskin of Healing',
        description: 'A magical wineskin that never runs empty',
        image: 'https://via.placeholder.com/300x300/FFEAA7/FFFFFF?text=Wineskin',
        collection: 'Healing Items',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: 2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '75',
        totalValue: '$2,134.325'
    },
    {
        id: '6',
        nftId: 'sample_nft_6',
        name: 'Pistol Grip',
        description: 'A precision grip for enhanced accuracy',
        image: 'https://via.placeholder.com/300x300/DDA0DD/FFFFFF?text=Pistol',
        collection: 'Weapon Accessories',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: -2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '25',
        totalValue: '$2,134.325'
    },
    {
        id: '7',
        nftId: 'sample_nft_7',
        name: 'Invisible Bag of Holding',
        description: 'A bag that can hold infinite items',
        image: 'https://via.placeholder.com/300x300/98D8C8/FFFFFF?text=Bag',
        collection: 'Storage Items',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: 2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '25',
        totalValue: '$2,134.325'
    },
    {
        id: '8',
        nftId: 'sample_nft_8',
        name: '+1 Lute of Songs',
        description: 'A musical instrument that charms all who hear it',
        image: 'https://via.placeholder.com/300x300/F7DC6F/FFFFFF?text=Lute',
        collection: 'Musical Instruments',
        price: '2134.325',
        isForSale: true,
        isTradable: true,
        blockchain: 'polkadot',
        marketChange: -2.05,
        currentValue: '19266.6454898',
        usdValue: '$2,134.325',
        available: '25',
        totalValue: '$2,134.325'
    }
];

// User-specific NFT endpoints
app.get('/api/my-nfts', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                success: true,
                data: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 0 },
                offline: true
            });
        }

        // Find user's wallet
        const wallet = await Wallet.findOne({ discordId: req.user.id });
        if (!wallet) {
            return res.json({
                success: true,
                data: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 0 }
            });
        }

        // Build query for user's NFTs
        const query = { owner: wallet._id, isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { collection: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query
        const nfts = await NFT.find(query)
            .populate('owner', 'discordId userId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await NFT.countDocuments(query);

        // Transform data for frontend
        const transformedNFTs = nfts.map(nft => ({
            id: nft._id,
            nftId: nft.nftId,
            name: nft.name,
            description: nft.description,
            image: nft.image,
            collection: nft.collection,
            price: nft.price,
            isForSale: nft.isForSale,
            isTradable: nft.isTradable,
            blockchain: nft.blockchain,
            owner: {
                discordId: nft.owner?.discordId,
                userId: nft.owner?.userId
            },
            createdAt: nft.createdAt,
            lastUpdated: nft.lastUpdated,
            marketChange: (Math.random() - 0.5) * 4,
            currentValue: nft.price,
            usdValue: `$${nft.price}`,
            available: nft.isForSale ? '1' : '0',
            totalValue: `$${nft.price}`
        }));

        res.json({
            success: true,
            data: transformedNFTs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user NFTs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your NFTs'
        });
    }
});

// Public NFT marketplace (all NFTs)
app.get('/api/nfts', optionalAuth, async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('🔄 Using sample data (MongoDB not connected)');
            const { page = 1, limit = 20, search = '' } = req.query;
            
            let filteredNFTs = sampleNFTs;
            if (search) {
                filteredNFTs = sampleNFTs.filter(nft => 
                    nft.name.toLowerCase().includes(search.toLowerCase()) ||
                    nft.collection.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedNFTs = filteredNFTs.slice(startIndex, endIndex);
            
            return res.json({
                success: true,
                data: paginatedNFTs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredNFTs.length,
                    pages: Math.ceil(filteredNFTs.length / limit)
                },
                offline: true
            });
        }

        const { page = 1, limit = 20, search = '', collection = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build query
        const query = { isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { collection: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (collection) {
            query.collection = { $regex: collection, $options: 'i' };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const nfts = await NFT.find(query)
            .populate('owner', 'discordId userId')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get total count for pagination
        const total = await NFT.countDocuments(query);

        // Transform data for frontend
        const transformedNFTs = nfts.map(nft => ({
            id: nft._id,
            nftId: nft.nftId,
            name: nft.name,
            description: nft.description,
            image: nft.image,
            collection: nft.collection,
            price: nft.price,
            isForSale: nft.isForSale,
            isTradable: nft.isTradable,
            blockchain: nft.blockchain,
            owner: {
                discordId: nft.owner?.discordId,
                userId: nft.owner?.userId
            },
            createdAt: nft.createdAt,
            lastUpdated: nft.lastUpdated,
            // Add market data (mock for now)
            marketChange: (Math.random() - 0.5) * 4, // Random change between -2% and +2%
            currentValue: nft.price,
            usdValue: `$${nft.price}`,
            available: nft.isForSale ? '1' : '0',
            totalValue: `$${nft.price}`
        }));

        res.json({
            success: true,
            data: transformedNFTs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch NFTs'
        });
    }
});

app.get('/api/nfts/:id', async (req, res) => {
    try {
        const nft = await NFT.findOne({ nftId: req.params.id }).populate('owner');
        
        if (!nft) {
            return res.status(404).json({
                success: false,
                error: 'NFT not found'
            });
        }

        res.json({
            success: true,
            data: nft
        });
    } catch (error) {
        console.error('Error fetching NFT:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch NFT'
        });
    }
});

app.get('/api/collections', async (req, res) => {
    try {
        const collections = await NFT.aggregate([
            { $match: { isActive: true } },
            { $group: { 
                _id: '$collection', 
                count: { $sum: 1 },
                totalValue: { $sum: { $toDouble: '$price' } },
                avgPrice: { $avg: { $toDouble: '$price' } }
            }},
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: collections
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch collections'
        });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('🔄 Using sample stats (MongoDB not connected)');
            return res.json({
                success: true,
                data: {
                    totalNFTs: sampleNFTs.length,
                    forSaleNFTs: sampleNFTs.filter(nft => nft.isForSale).length,
                    totalCollections: [...new Set(sampleNFTs.map(nft => nft.collection))].length,
                    totalMarketValue: sampleNFTs.reduce((sum, nft) => sum + parseFloat(nft.price), 0)
                },
                offline: true
            });
        }

        const totalNFTs = await NFT.countDocuments({ isActive: true });
        const forSaleNFTs = await NFT.countDocuments({ isActive: true, isForSale: true });
        const totalCollections = await NFT.distinct('collection', { isActive: true });
        
        // Calculate total market value
        const marketValue = await NFT.aggregate([
            { $match: { isActive: true, isForSale: true } },
            { $group: { _id: null, total: { $sum: { $toDouble: '$price' } } } }
        ]);

        res.json({
            success: true,
            data: {
                totalNFTs,
                forSaleNFTs,
                totalCollections: totalCollections.length,
                totalMarketValue: marketValue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    }
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

// Serve the marketplace page
app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(__dirname, '../marketplace.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 NiftyCord API server running on port ${PORT}`);
    console.log(`📊 Marketplace available at: http://localhost:${PORT}/marketplace`);
});

module.exports = app;

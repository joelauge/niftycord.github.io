// Railway-specific start script - only runs the API server
// This avoids Discord bot token issues on Railway

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting (relaxed for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: [
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

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://niftycord:password@niftycorddb.wjsbcq7.mongodb.net/?retryWrites=true&w=majority&appName=NiftyCordDB';

mongoose.connect(mongoUri)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });

// NFT Model (simplified for Railway)
const nftSchema = new mongoose.Schema({
    nftId: String,
    name: String,
    description: String,
    price: String,
    image: String,
    owner: {
        userId: String,
        username: String
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'pending'],
        default: 'available'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const NFT = mongoose.model('NFT', nftSchema);

// API Routes
app.get('/api/nfts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        
        const nfts = await NFT.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await NFT.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                nfts,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/nfts/:id', async (req, res) => {
    try {
        const nft = await NFT.findOne({ nftId: req.params.id });
        if (!nft) {
            return res.status(404).json({ success: false, error: 'NFT not found' });
        }
        res.json({ success: true, data: nft });
    } catch (error) {
        console.error('Error fetching NFT:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalNFTs = await NFT.countDocuments();
        const availableNFTs = await NFT.countDocuments({ status: 'available' });
        
        res.json({
            success: true,
            data: {
                totalNFTs,
                availableNFTs,
                offline: false
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.json({
            success: true,
            data: {
                totalNFTs: 0,
                availableNFTs: 0,
                offline: true
            }
        });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// NFT Detail Page with Server-Side Rendering
app.get('/nft-detail.html', async (req, res) => {
    try {
        const nftId = req.query.id;
        console.log('🔍 NFT Detail Request:', { nftId, query: req.query });
        
        if (!nftId) {
            return res.status(400).send('NFT ID is required');
        }
        
        // Fetch NFT from database
        console.log('🔍 Fetching NFT from database:', nftId);
        const nft = await NFT.findOne({ nftId: nftId });
        
        if (!nft) {
            console.log('❌ NFT not found:', nftId);
            return res.status(404).send('NFT not found');
        }
        
        console.log('📊 NFT found:', nft ? 'YES' : 'NO', nft ? { name: nft.name, price: nft.price } : '');
        
        // Read the HTML template
        const htmlPath = path.join(process.cwd(), 'nft-detail.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Replace meta tags with NFT data
        const nftName = nft.name || 'Unnamed NFT';
        const nftDescription = nft.description || 'No description provided';
        const nftPrice = `${nft.price || '0'} DOT`;
        const nftImage = nft.image || 'https://niftycord.github.io/assets/images/niftycord_logo_word.png';
        
        console.log('🔄 Replacing meta tags with NFT data:', {
            nftName,
            nftDescription,
            nftPrice
        });
        
        // Replace meta tags
        html = html.replace(/<title id="page-title">.*?<\/title>/, `<title>${nftName} - NiftyCord NFT Marketplace</title>`);
        html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${nftName}"`);
        html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${nftDescription}"`);
        html = html.replace(/<meta property="og:image" content=".*?"/, `<meta property="og:image" content="${nftImage}"`);
        html = html.replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${nftName}"`);
        html = html.replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${nftDescription}"`);
        html = html.replace(/<meta name="twitter:image" content=".*?"/, `<meta name="twitter:image" content="${nftImage}"`);
        
        console.log('✅ Successfully rendered NFT detail page with meta tags');
        res.send(html);
        
    } catch (error) {
        console.error('Error rendering NFT detail page:', error);
        res.status(500).send('Error rendering NFT detail page');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Railway API server running on port ${PORT}`);
    console.log(`📊 Marketplace available at: https://niftycordgithubio-production.up.railway.app/marketplace`);
});

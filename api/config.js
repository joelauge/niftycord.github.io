// Configuration for NiftyCord API Server
// This should match your Discord bot's MongoDB connection

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

module.exports = {
    // MongoDB Configuration - Use the same connection string as your Discord bot
    // Get this from your Discord bot's .env file or environment variables
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/niftycord',
    
    // API Configuration
    API_PORT: process.env.API_PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

#!/usr/bin/env node

// Auto-setup Discord OAuth using existing bot configuration
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function setupFromBot() {
    console.log('🤖 NiftyCord Auto-Setup from Bot Configuration');
    console.log('===============================================');
    console.log('');
    
    try {
        // Check if bot .env exists
        const botEnvPath = path.join(__dirname, '../niftycord-bot/.env');
        const apiEnvPath = path.join(__dirname, '.env');
        
        if (!fs.existsSync(botEnvPath)) {
            console.log('❌ Bot .env file not found at:', botEnvPath);
            console.log('Please run the manual setup instead: npm run setup-discord');
            process.exit(1);
        }
        
        // Read bot .env file
        const botEnvContent = fs.readFileSync(botEnvPath, 'utf8');
        const botEnvLines = botEnvContent.split('\n');
        
        let discordToken = '';
        let mongodbUri = '';
        
        // Extract Discord token and MongoDB URI from bot .env
        for (const line of botEnvLines) {
            if (line.startsWith('DISCORD_TOKEN=')) {
                discordToken = line.split('=')[1];
            } else if (line.startsWith('MONGODB_URI=')) {
                mongodbUri = line.split('=')[1];
            }
        }
        
        if (!discordToken) {
            console.log('❌ DISCORD_TOKEN not found in bot .env file');
            console.log('Please run the manual setup instead: npm run setup-discord');
            process.exit(1);
        }
        
        if (!mongodbUri) {
            console.log('❌ MONGODB_URI not found in bot .env file');
            console.log('Please run the manual setup instead: npm run setup-discord');
            process.exit(1);
        }
        
        console.log('✅ Found bot configuration');
        console.log('   - Discord Token: Found');
        console.log('   - MongoDB URI: Found');
        console.log('');
        
        // Generate session secret
        const sessionSecret = crypto.randomBytes(32).toString('hex');
        
        // Create API .env file
        const envContent = `# NiftyCord API Configuration
# MongoDB Atlas connection string (same as Discord bot)
MONGODB_URI=${mongodbUri}

# API Configuration
API_PORT=3001
NODE_ENV=development

# Discord OAuth Configuration
# You need to get these from your Discord application:
# 1. Go to https://discord.com/developers/applications
# 2. Select your NiftyCord bot application
# 3. Go to "General Information" for Application ID
# 4. Go to "OAuth2" → "General" for Client Secret
DISCORD_CLIENT_ID=YOUR_APPLICATION_ID_HERE
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
DISCORD_CALLBACK_URL=http://localhost:3001/auth/discord/callback

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Frontend URL
FRONTEND_URL=http://localhost:3001
`;
        
        fs.writeFileSync(apiEnvPath, envContent);
        
        console.log('✅ Created API .env file with bot configuration');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Go to: https://discord.com/developers/applications');
        console.log('2. Select your NiftyCord bot application');
        console.log('3. Go to "General Information" and copy the "Application ID"');
        console.log('4. Go to "OAuth2" → "General" and copy the "Client Secret"');
        console.log('5. Add redirect URI: http://localhost:3001/auth/discord/callback');
        console.log('6. Update the .env file with your Application ID and Client Secret');
        console.log('7. Run: npm start');
        console.log('');
        console.log('🔍 Quick Setup:');
        console.log('   - Application ID: Replace YOUR_APPLICATION_ID_HERE in .env');
        console.log('   - Client Secret: Replace YOUR_CLIENT_SECRET_HERE in .env');
        console.log('   - Redirect URI: Add http://localhost:3001/auth/discord/callback to Discord app');
        console.log('');
        console.log('🚀 Then test at: http://localhost:3001/login');
        
    } catch (error) {
        console.error('❌ Auto-setup failed:', error.message);
        console.log('Please run the manual setup instead: npm run setup-discord');
    }
}

setupFromBot();



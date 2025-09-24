#!/usr/bin/env node

// Discord OAuth Setup Script for NiftyCord
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setupDiscordOAuth() {
    console.log('🔐 NiftyCord Discord OAuth Setup');
    console.log('=================================');
    console.log('');
    console.log('Using your existing Discord bot application for OAuth authentication.');
    console.log('This is more secure and simpler since you already have the bot set up!');
    console.log('');
    
    try {
        console.log('📋 Step 1: Get Your Bot\'s Application ID');
        console.log('');
        console.log('1. Go to: https://discord.com/developers/applications');
        console.log('2. Select your existing NiftyCord bot application');
        console.log('3. Go to "General Information"');
        console.log('4. Copy the "Application ID" (this is your Client ID)');
        console.log('');
        
        const clientId = await askQuestion('Enter your Discord Application ID: ');
        
        if (!clientId || clientId.length < 15) {
            console.log('❌ Invalid Application ID. Please check your Discord application.');
            process.exit(1);
        }
        
        console.log('');
        console.log('📋 Step 2: Get Client Secret');
        console.log('');
        console.log('1. In your Discord application, go to "OAuth2" → "General"');
        console.log('2. Copy the "Client Secret"');
        console.log('');
        
        const clientSecret = await askQuestion('Enter your Discord Application Client Secret: ');
        
        if (!clientSecret || clientSecret.length < 30) {
            console.log('❌ Invalid Client Secret. Please check your Discord application.');
            process.exit(1);
        }
        
        console.log('');
        console.log('📋 Step 3: Set Redirect URI');
        console.log('');
        console.log('1. In your Discord application, go to "OAuth2" → "General"');
        console.log('2. Add redirect URI: http://localhost:3001/auth/discord/callback');
        console.log('3. Click "Save Changes"');
        console.log('');
        
        const callbackUrl = await askQuestion('Enter callback URL (press Enter for default): ') || 'http://localhost:3001/auth/discord/callback';
        
        console.log('');
        console.log('📋 Step 4: Generate Session Secret');
        console.log('');
        const sessionSecret = require('crypto').randomBytes(32).toString('hex');
        
        console.log('✅ Generated session secret');
        console.log('');
        
        // Create .env file content
        const envContent = `# NiftyCord API Configuration
# MongoDB Atlas connection string (same as Discord bot)
MONGODB_URI=${process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/niftycord'}

# API Configuration
API_PORT=3001
NODE_ENV=development

# Discord OAuth Configuration
DISCORD_CLIENT_ID=${clientId}
DISCORD_CLIENT_SECRET=${clientSecret}
DISCORD_CALLBACK_URL=${callbackUrl}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Frontend URL
FRONTEND_URL=http://localhost:3001
`;
        
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '.env');
        fs.writeFileSync(envPath, envContent);
        
        console.log('✅ Configuration saved to .env file');
        console.log('');
        console.log('🚀 Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Go to: http://localhost:3001/login');
        console.log('3. Click "Login with Discord"');
        console.log('4. You should be redirected to Discord and back to the marketplace!');
        console.log('');
        console.log('🔍 To verify the setup:');
        console.log('   - Check that you can login with Discord');
        console.log('   - Check that you see your Discord username in the marketplace');
        console.log('   - Check that you can see your NFTs (if any exist)');
        console.log('');
        console.log('⚠️  Important:');
        console.log('   - Keep your Client Secret secure');
        console.log('   - Don\'t commit the .env file to version control');
        console.log('   - For production, use environment variables instead of .env file');
        console.log('');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

setupDiscordOAuth();

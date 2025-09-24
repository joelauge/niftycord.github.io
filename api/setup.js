#!/usr/bin/env node

// NiftyCord API Setup Script
// This script helps you configure the API server to connect to your existing MongoDB Atlas cluster

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 NiftyCord API Setup');
console.log('========================');
console.log('');
console.log('This will help you connect the marketplace API to your existing MongoDB Atlas cluster.');
console.log('You need the same connection string that your Discord bot uses.');
console.log('');

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setup() {
    try {
        console.log('📋 Step 1: Get your MongoDB Atlas connection string');
        console.log('');
        console.log('You can find this in your Discord bot\'s .env file or environment variables.');
        console.log('It should look like: mongodb+srv://username:password@cluster.mongodb.net/niftycord');
        console.log('');
        
        const mongoUri = await askQuestion('Enter your MongoDB Atlas connection string: ');
        
        if (!mongoUri || !mongoUri.includes('mongodb+srv://')) {
            console.log('❌ Invalid connection string. Please make sure it starts with mongodb+srv://');
            process.exit(1);
        }
        
        console.log('');
        console.log('📋 Step 2: Choose API port (default: 3001)');
        const apiPort = await askQuestion('Enter API port (press Enter for 3001): ') || '3001';
        
        console.log('');
        console.log('📋 Step 3: Environment (default: development)');
        const nodeEnv = await askQuestion('Enter environment (press Enter for development): ') || 'development';
        
        // Create .env file
        const envContent = `# NiftyCord API Configuration
# MongoDB Atlas connection string (same as Discord bot)
MONGODB_URI=${mongoUri}

# API Configuration
API_PORT=${apiPort}
NODE_ENV=${nodeEnv}
`;
        
        const envPath = path.join(__dirname, '.env');
        fs.writeFileSync(envPath, envContent);
        
        console.log('');
        console.log('✅ Configuration saved to .env file');
        console.log('');
        console.log('🚀 Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Open: http://localhost:' + apiPort + '/marketplace');
        console.log('3. Your marketplace will now show real NFTs from your Discord bot!');
        console.log('');
        console.log('🔍 To verify the connection, check the console output for:');
        console.log('   ✅ Connected to MongoDB Atlas (same as Discord bot)');
        console.log('');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

setup();



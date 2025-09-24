#!/usr/bin/env node

// Start script that helps you set the MongoDB connection string
const { spawn } = require('child_process');
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

async function startWithEnv() {
    console.log('🚀 NiftyCord API - Quick Start');
    console.log('==============================');
    console.log('');
    
    const mongoUri = await askQuestion('Enter your MongoDB Atlas connection string: ');
    
    if (!mongoUri || !mongoUri.includes('mongodb+srv://')) {
        console.log('❌ Invalid connection string. Please make sure it starts with mongodb+srv://');
        process.exit(1);
    }
    
    console.log('');
    console.log('🚀 Starting API server with your MongoDB connection...');
    console.log('');
    
    // Set environment variable and start the server
    const env = {
        ...process.env,
        MONGODB_URI: mongoUri,
        API_PORT: '3001',
        NODE_ENV: 'development'
    };
    
    const server = spawn('node', ['server.js'], {
        env: env,
        stdio: 'inherit',
        cwd: __dirname
    });
    
    server.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
        rl.close();
    });
    
    server.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        rl.close();
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🔄 Shutting down server...');
        server.kill('SIGINT');
        rl.close();
    });
}

startWithEnv();



const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const http = require('http');
const polkadotService = require('./services/polkadot');
const nftUnfurler = require('./services/nftUnfurler');
require('dotenv').config();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Create commands collection
client.commands = new Collection();

// Import command files
const adminCommand = require('./commands/admin');
const walletCommand = require('./commands/wallet');
const marketplaceCommand = require('./commands/marketplace');
const tradeCommand = require('./commands/trade');
const helpCommand = require('./commands/help');
const testCommand = require('./commands/test');

// Add commands to collection
client.commands.set(adminCommand.data.name, adminCommand);
client.commands.set(walletCommand.data.name, walletCommand);
client.commands.set(marketplaceCommand.data.name, marketplaceCommand);
client.commands.set(tradeCommand.data.name, tradeCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(testCommand.data.name, testCommand);

// Bot ready event
client.once(Events.ClientReady, async () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    
    // Set bot activity
    client.user.setActivity('NFT Trading', { type: ActivityType.Playing });
    
    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/niftycord');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }

    // Initialize Polkadot service
    try {
        await polkadotService.initialize();
        console.log('✅ Polkadot service initialized');
    } catch (error) {
        console.error('❌ Polkadot service initialization error:', error);
    }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`❌ Command ${interaction.commandName} not found`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing command ${interaction.commandName}:`, error);
        
        const errorMessage = {
            content: '❌ There was an error while executing this command!',
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Handle message events for NFT unfurling
client.on(Events.MessageCreate, async (message) => {
    try {
        // Check if message should be processed for NFT unfurling
        if (!nftUnfurler.shouldProcessMessage(message)) {
            return;
        }

        // Process message and get NFT embeds
        const embeds = await nftUnfurler.processMessage(message.content);
        
        if (embeds.length > 0) {
            // Send embeds (Discord allows up to 10 embeds per message)
            const embedsToSend = embeds.slice(0, 10);
            
            await message.reply({
                embeds: embedsToSend,
                allowedMentions: { repliedUser: false } // Don't ping the user
            });
        }
    } catch (error) {
        console.error('Error processing message for NFT unfurling:', error);
        // Don't send error message to avoid spam
    }
});

// Handle errors
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            bot: client.user ? 'online' : 'offline',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Shutting down gracefully...');
    server.close();
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

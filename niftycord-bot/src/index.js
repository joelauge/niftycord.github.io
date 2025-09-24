const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const http = require('http');
const polkadotService = require('./services/polkadot');
const nftUnfurler = require('./services/nftUnfurler');
const ErrorHandler = require('./services/errorHandler');
const NFT = require('./models/NFT');
const Wallet = require('./models/Wallet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Environment variables loaded

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
const debugCommand = require('./commands/debug');
const myNftsCommand = require('./commands/my-nfts');
const testButtonsCommand = require('./commands/test-buttons');
const myNftsEnhancedCommand = require('./commands/my-nfts-enhanced');
const nftManagerCommand = require('./commands/nft-manager');
const buttonTestCommand = require('./commands/button-test');

// Add commands to collection
client.commands.set(adminCommand.data.name, adminCommand);
client.commands.set(walletCommand.data.name, walletCommand);
client.commands.set(marketplaceCommand.data.name, marketplaceCommand);
client.commands.set(tradeCommand.data.name, tradeCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(testCommand.data.name, testCommand);
client.commands.set(debugCommand.data.name, debugCommand);
client.commands.set(myNftsCommand.data.name, myNftsCommand);
client.commands.set(testButtonsCommand.data.name, testButtonsCommand);
client.commands.set(myNftsEnhancedCommand.data.name, myNftsEnhancedCommand);
client.commands.set(nftManagerCommand.data.name, nftManagerCommand);
client.commands.set(buttonTestCommand.data.name, buttonTestCommand);

// Function to create sample NFTs
async function createSampleNFTs() {
    try {
        // Check if any NFTs exist
        const existingNFTs = await NFT.countDocuments();
        if (existingNFTs > 0) {
            console.log(`✅ Found ${existingNFTs} existing NFTs`);
            return;
        }

        console.log('🎨 Creating sample NFTs...');

        // Create a sample wallet for the NFTs
        let sampleWallet = await Wallet.findOne({ discordId: 'sample_wallet' });
        if (!sampleWallet) {
            sampleWallet = new Wallet({
                userId: 'sample_user_123',
                discordId: 'sample_wallet',
                address: '5GmcABdg9DRWp8vMuWie8zuaa1QzmkhKAWDMcvJVisfHyCkn',
                publicKey: 'sample_public_key',
                mnemonic: 'sample mnemonic phrase',
                ss58Format: 0,
                balance: {
                    free: '1000',
                    reserved: '0',
                    total: '1000'
                }
            });
            await sampleWallet.save();
        }

        // Create sample NFTs
        const sampleNFTs = [
            {
                nftId: 'sample_nft_1',
                name: 'Digital Art #1',
                description: 'A beautiful piece of digital art showcasing modern creativity.',
                image: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Digital+Art+1',
                attributes: [
                    { trait_type: 'Type', value: 'Digital Art' },
                    { trait_type: 'Rarity', value: 'Common' },
                    { trait_type: 'Color', value: 'Red' }
                ],
                owner: sampleWallet._id,
                ownerAddress: sampleWallet.address,
                creator: sampleWallet._id,
                creatorAddress: sampleWallet.address,
                collection: 'Sample Collection',
                price: '10.5',
                isForSale: true,
                isTradable: true,
                blockchain: 'polkadot',
                transactionHash: 'sample_tx_1',
                serverId: 'sample_server',
                serverName: 'Sample Server',
                isActive: true
            },
            {
                nftId: 'sample_nft_2',
                name: 'Crypto Punk #42',
                description: 'A rare crypto punk with unique characteristics.',
                image: 'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Crypto+Punk+42',
                attributes: [
                    { trait_type: 'Type', value: 'Crypto Punk' },
                    { trait_type: 'Rarity', value: 'Rare' },
                    { trait_type: 'Color', value: 'Teal' }
                ],
                owner: sampleWallet._id,
                ownerAddress: sampleWallet.address,
                creator: sampleWallet._id,
                creatorAddress: sampleWallet.address,
                collection: 'Crypto Punks',
                price: '25.0',
                isForSale: true,
                isTradable: true,
                blockchain: 'polkadot',
                transactionHash: 'sample_tx_2',
                serverId: 'sample_server',
                serverName: 'Sample Server',
                isActive: true
            },
            {
                nftId: 'sample_nft_3',
                name: 'Gaming Item: Sword',
                description: 'A legendary sword from the fantasy realm.',
                image: 'https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Legendary+Sword',
                attributes: [
                    { trait_type: 'Type', value: 'Gaming Item' },
                    { trait_type: 'Rarity', value: 'Legendary' },
                    { trait_type: 'Power', value: '100' }
                ],
                owner: sampleWallet._id,
                ownerAddress: sampleWallet.address,
                creator: sampleWallet._id,
                creatorAddress: sampleWallet.address,
                collection: 'Gaming Items',
                price: '50.0',
                isForSale: true,
                isTradable: true,
                blockchain: 'polkadot',
                transactionHash: 'sample_tx_3',
                serverId: 'sample_server',
                serverName: 'Sample Server',
                isActive: true
            }
        ];

        for (const nftData of sampleNFTs) {
            const nft = new NFT(nftData);
            await nft.save();
        }

        // Update wallet with NFTs
        await Wallet.findByIdAndUpdate(sampleWallet._id, { 
            $addToSet: { nfts: { $each: sampleNFTs.map(nft => nft._id) } } 
        });

        console.log(`✅ Created ${sampleNFTs.length} sample NFTs`);
    } catch (error) {
        console.error('❌ Error creating sample NFTs:', error);
    }
}

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

    // Create sample NFTs if none exist
    try {
        await createSampleNFTs();
    } catch (error) {
        console.error('❌ Error creating sample NFTs:', error);
    }
});

// NFT action handlers
async function handleSellNFT(interaction) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    const NFT = require('./models/NFT');
    const Wallet = require('./models/Wallet');
    
    const nftId = interaction.customId.replace('sell_nft_', '');
    const wallet = await Wallet.findOne({ discordId: interaction.user.id });
    
    if (!wallet) {
        const embed = new EmbedBuilder()
            .setTitle('❌ No Wallet Found')
            .setDescription('You need to create a wallet first!')
            .setColor(0xFF0000);
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const nft = await NFT.findOne({ nftId: nftId, owner: wallet._id });
    if (!nft) {
        const embed = new EmbedBuilder()
            .setTitle('❌ NFT Not Found')
            .setDescription('NFT not found or you don\'t own it.')
            .setColor(0xFF0000);
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // Create a modal for price input
    const modal = new ModalBuilder()
        .setCustomId(`sell_modal_${nftId}`)
        .setTitle(`💰 List ${nft.name} for Sale`);

    const priceInput = new TextInputBuilder()
        .setCustomId('price_input')
        .setLabel('Price in DOT')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter price in DOT (e.g., 10.5)')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(10);

    const actionRow = new ActionRowBuilder().addComponents(priceInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

async function handleTradeNFT(interaction) {
    const { EmbedBuilder } = require('discord.js');
    
    await interaction.deferReply({ flags: 64 });
    
    const nftId = interaction.customId.replace('trade_nft_', '');
    
    const embed = new EmbedBuilder()
        .setTitle('🔄 Trade NFT')
        .setDescription(`To trade NFT **${nftId}**, use:\n\`/trade create ${nftId}\`\n\nThis will start a trade negotiation with another user.`)
        .setColor(0x00D4AA);
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleRemoveSale(interaction) {
    const { EmbedBuilder } = require('discord.js');
    const NFT = require('./models/NFT');
    const Wallet = require('./models/Wallet');
    
    await interaction.deferReply({ flags: 64 });
    
    const nftId = interaction.customId.replace('remove_sale_', '');
    const wallet = await Wallet.findOne({ discordId: interaction.user.id });
    
    if (!wallet) {
        const embed = new EmbedBuilder()
            .setTitle('❌ No Wallet Found')
            .setDescription('You need to create a wallet first!')
            .setColor(0xFF0000);
        return await interaction.editReply({ embeds: [embed] });
    }
    
    const nft = await NFT.findOne({ nftId: nftId, owner: wallet._id });
    if (!nft) {
        const embed = new EmbedBuilder()
            .setTitle('❌ NFT Not Found')
            .setDescription('NFT not found or you don\'t own it.')
            .setColor(0xFF0000);
        return await interaction.editReply({ embeds: [embed] });
    }
    
    // Remove from sale
    nft.isForSale = false;
    nft.price = '0';
    await nft.save();
    
    const embed = new EmbedBuilder()
        .setTitle('✅ NFT Removed from Sale')
        .setDescription(`**${nft.name}** is no longer for sale.`)
        .setColor(0x00D4AA);
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleUpdatePrice(interaction) {
    const { EmbedBuilder } = require('discord.js');
    
    await interaction.deferReply({ flags: 64 });
    
    const nftId = interaction.customId.replace('update_price_', '');
    
    const embed = new EmbedBuilder()
        .setTitle('📝 Update Price')
        .setDescription(`To update the price of NFT **${nftId}**, use:\n\`/marketplace sell ${nftId} <new_price>\`\n\nThis will update the listing price.`)
        .setColor(0x00D4AA);
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleNextNFT(interaction) {
    // For now, just show a message about multiple NFTs
    await interaction.deferReply({ flags: 64 });
    
    const embed = new EmbedBuilder()
        .setTitle('➡️ Multiple NFTs')
        .setDescription('You have multiple NFTs! Use `/my-nfts` to see all of them with pagination.')
        .setColor(0x00D4AA);
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleConfirmSell(interaction) {
    const { EmbedBuilder } = require('discord.js');
    const NFT = require('./models/NFT');
    const Wallet = require('./models/Wallet');
    
    await interaction.deferReply({ flags: 64 });
    
    // Parse the custom ID: confirm_sell_{nftId}_{price}
    const parts = interaction.customId.split('_');
    const nftId = parts[2];
    const price = parts[3];
    
    const wallet = await Wallet.findOne({ discordId: interaction.user.id });
    const nft = await NFT.findOne({ nftId: nftId, owner: wallet._id });
    
    if (!nft) {
        const embed = new EmbedBuilder()
            .setTitle('❌ NFT Not Found')
            .setDescription('NFT not found or you don\'t own it.')
            .setColor(0xFF0000);
        return await interaction.editReply({ embeds: [embed] });
    }
    
    // Update NFT to be for sale
    nft.isForSale = true;
    nft.price = price;
    await nft.save();
    
    const embed = new EmbedBuilder()
        .setTitle('✅ NFT Listed for Sale!')
        .setDescription(`**${nft.name}** is now available for purchase`)
        .addFields(
            { name: 'Price', value: `${price} DOT`, inline: true },
            { name: 'NFT ID', value: nftId, inline: true },
            { name: 'Status', value: '🟢 For Sale', inline: true }
        )
        .setColor(0x00D4AA)
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleCancelSell(interaction) {
    const { EmbedBuilder } = require('discord.js');
    
    await interaction.deferReply({ flags: 64 });
    
    const embed = new EmbedBuilder()
        .setTitle('❌ Sale Cancelled')
        .setDescription('NFT sale has been cancelled.')
        .setColor(0xFF0000)
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}

// Handle modal submissions
async function handleModalSubmit(interaction) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const NFT = require('./models/NFT');
    const Wallet = require('./models/Wallet');
    
    if (interaction.customId.startsWith('sell_modal_')) {
        const nftId = interaction.customId.replace('sell_modal_', '');
        const price = interaction.fields.getTextInputValue('price_input');
        
        // Validate price
        if (isNaN(price) || parseFloat(price) <= 0) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Price')
                .setDescription('Please enter a valid price greater than 0.')
                .setColor(0xFF0000);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Get NFT and wallet
        const wallet = await Wallet.findOne({ discordId: interaction.user.id });
        const nft = await NFT.findOne({ nftId: nftId, owner: wallet._id });
        
        if (!nft) {
            const embed = new EmbedBuilder()
                .setTitle('❌ NFT Not Found')
                .setDescription('NFT not found or you don\'t own it.')
                .setColor(0xFF0000);
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Show confirmation
        const embed = new EmbedBuilder()
            .setTitle('💰 Confirm NFT Sale')
            .setDescription(`**${nft.name}**`)
            .addFields(
                { name: 'Price', value: `${price} DOT`, inline: true },
                { name: 'NFT ID', value: nftId, inline: true },
                { name: 'Status', value: '🟡 Pending Confirmation', inline: true }
            )
            .setColor(0xFFA500)
            .setTimestamp();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_sell_${nftId}_${price}`)
                    .setLabel('✅ Confirm Sale')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`cancel_sell_${nftId}`)
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Danger)
            );
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
}

// Handle button interactions
async function handleButtonInteraction(interaction) {
    console.log(`🔘 Button clicked: ${interaction.customId} by ${interaction.user.username}`);
    
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const NFT = require('./models/NFT');
    const Wallet = require('./models/Wallet');

    switch (interaction.customId) {
        case 'marketplace_list_nfts':
            await interaction.deferReply({ flags: 64 });
            
            // Get user's wallet
            const wallet = await Wallet.findOne({ discordId: interaction.user.id });
            
            if (!wallet) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ No Wallet Found')
                    .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                    .setColor(0xFF0000)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Get user's NFTs
            const userNFTs = await NFT.find({ 
                owner: wallet._id, 
                isActive: true 
            })
            .populate('creator', 'address')
            .sort({ createdAt: -1 });

            if (userNFTs.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📦 Your NFT Collection')
                    .setDescription('You don\'t have any NFTs yet. Create some with `/admin mint`!')
                    .setColor(0xFFA500)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Show first NFT with individual actions
            const firstNFT = userNFTs[0];
            const status = firstNFT.isForSale ? `💰 ${firstNFT.price} DOT` : '🏠 Not for sale';
            
            const embed = new EmbedBuilder()
                .setTitle('📦 Your NFT Collection')
                .setDescription(`You own ${userNFTs.length} NFT(s)`)
                .addFields({
                    name: `${firstNFT.name} (${firstNFT.nftId})`,
                    value: `${status}\n*${firstNFT.description.substring(0, 50)}...*`,
                    inline: false
                })
                .setColor(0x00D4AA)
                .setTimestamp();

            // Create action buttons for the first NFT
            const row = new ActionRowBuilder();
            
            if (!firstNFT.isForSale) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`sell_nft_${firstNFT.nftId}`)
                        .setLabel('💰 List for Sale')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`trade_nft_${firstNFT.nftId}`)
                        .setLabel('🔄 Trade')
                        .setStyle(ButtonStyle.Primary)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`remove_sale_${firstNFT.nftId}`)
                        .setLabel('❌ Remove from Sale')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`update_price_${firstNFT.nftId}`)
                        .setLabel('📝 Update Price')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            // Add navigation buttons if there are multiple NFTs
            if (userNFTs.length > 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('nft_next')
                        .setLabel('➡️ Next NFT')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            await interaction.editReply({ embeds: [embed], components: [row] });
            break;

        case 'marketplace_refresh':
            await interaction.deferReply();
            
            // Re-run the marketplace browse command
            const marketplaceCommand = client.commands.get('marketplace');
            if (marketplaceCommand) {
                // Create a fake interaction object for the browse subcommand
                const fakeInteraction = {
                    ...interaction,
                    options: {
                        getSubcommand: () => 'browse'
                    }
                };
                await marketplaceCommand.execute(fakeInteraction);
            }
            break;

        case 'marketplace_help':
            await interaction.deferReply({ flags: 64 });
            
            const helpEmbed = new EmbedBuilder()
                .setTitle('❓ Marketplace Help')
                .setDescription('Here\'s how to use the NFT Marketplace:')
                .addFields(
                    { name: '📦 My NFTs', value: 'View your NFT collection', inline: true },
                    { name: '🌐 Web Marketplace', value: 'Open the full web interface', inline: true },
                    { name: '🔄 Refresh', value: 'Reload the marketplace', inline: true },
                    { name: '💰 List NFT', value: 'Use `/marketplace sell <nft_id> <price>` to list an NFT', inline: false },
                    { name: '🛒 Buy NFT', value: 'Use `/marketplace buy <nft_id>` to purchase an NFT', inline: false },
                    { name: '🔍 Search', value: 'Use `/marketplace search <query>` to find specific NFTs', inline: false }
                )
                .setColor(0x00D4AA)
                .setTimestamp();

            await interaction.editReply({ embeds: [helpEmbed] });
            break;

        // Handle test buttons
        case 'test_button_1':
            await interaction.reply({ content: '✅ Test Button 1 clicked!', ephemeral: true });
            break;
            
        case 'test_button_2':
            await interaction.reply({ content: '❌ Test Button 2 clicked!', ephemeral: true });
            break;

        // Handle confirmation buttons
        default:
            if (interaction.customId.startsWith('confirm_sell_')) {
                await handleConfirmSell(interaction);
            } else if (interaction.customId.startsWith('cancel_sell_')) {
                await handleCancelSell(interaction);
            } else if (interaction.customId.startsWith('sell_nft_')) {
                await handleSellNFT(interaction);
            } else if (interaction.customId.startsWith('trade_nft_')) {
                await handleTradeNFT(interaction);
            } else if (interaction.customId.startsWith('remove_sale_')) {
                await handleRemoveSale(interaction);
            } else if (interaction.customId.startsWith('update_price_')) {
                await handleUpdatePrice(interaction);
            } else if (interaction.customId === 'nft_next') {
                await handleNextNFT(interaction);
            } else {
                await interaction.reply({ content: 'Unknown button interaction.', ephemeral: true });
            }
    }
}

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`❌ Command ${interaction.commandName} not found`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing command ${interaction.commandName}:`, error);
            
            // Use intelligent error handling
            const subcommand = interaction.options?.getSubcommand?.() || '';
            await ErrorHandler.handleCommandError(interaction, error, interaction.commandName, subcommand);
        }
    } else if (interaction.isButton()) {
        // Handle button interactions
        console.log(`🔘 Button interaction detected: ${interaction.customId}`);
        try {
            await handleButtonInteraction(interaction);
        } catch (error) {
            console.error(`❌ Error handling button interaction:`, error);
            await ErrorHandler.handleCommandError(interaction, error, 'button', interaction.customId);
        }
    } else if (interaction.isModalSubmit()) {
        // Handle modal submissions
        console.log(`📝 Modal submitted: ${interaction.customId}`);
        try {
            await handleModalSubmit(interaction);
        } catch (error) {
            console.error(`❌ Error handling modal submission:`, error);
            await ErrorHandler.handleCommandError(interaction, error, 'modal', interaction.customId);
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
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is not defined in environment variables');
    process.exit(1);
}
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

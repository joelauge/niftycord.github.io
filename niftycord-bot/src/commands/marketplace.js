const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const NFT = require('../models/NFT');
const Wallet = require('../models/Wallet');
const polkadotService = require('../services/polkadot');
const ErrorHandler = require('../services/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marketplace')
        .setDescription('Browse and trade NFTs on the marketplace')
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription('Browse available NFTs')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search for specific NFTs')
                .addStringOption(option =>
                    option
                        .setName('query')
                        .setDescription('Search term')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your NFTs')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Put an NFT up for sale')
                .addStringOption(option =>
                    option
                        .setName('nft_id')
                        .setDescription('NFT ID to sell')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('price')
                        .setDescription('Price in DOT')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy an NFT from the marketplace')
                .addStringOption(option =>
                    option
                        .setName('nft_id')
                        .setDescription('NFT ID to buy')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'browse') {
            try {
                // Defer the reply to prevent timeout
                await interaction.deferReply();
                
                // Get NFTs for sale from all servers
                const nftsForSale = await NFT.find({ 
                    isForSale: true, 
                    isActive: true 
                })
                .populate('owner', 'address')
                .populate('creator', 'address')
                .sort({ createdAt: -1 })
                .limit(6);

                if (nftsForSale.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('🛒 NFT Marketplace')
                        .setDescription('No NFTs are currently for sale. Be the first to list one!')
                        .addFields({
                            name: '💡 Want to list your NFT?',
                            value: 'Click the buttons below to manage your NFTs or browse the web marketplace!',
                            inline: false
                        })
                        .setColor(0x00D4AA)
                        .setTimestamp();

                    // Create action row with buttons
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('marketplace_list_nfts')
                                .setLabel('📦 My NFTs')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setLabel('🌐 Web Marketplace')
                                .setStyle(ButtonStyle.Link)
                                .setURL('http://localhost:3001/marketplace'),
                            new ButtonBuilder()
                                .setCustomId('marketplace_help')
                                .setLabel('❓ Help')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    return await interaction.editReply({ embeds: [embed], components: [row] });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🛒 NFT Marketplace')
                    .setDescription('Browse available NFTs for trading')
                    .setColor(0x00D4AA)
                    .setTimestamp();

                // Add NFT fields
                nftsForSale.forEach((nft, index) => {
                    const fieldName = index < 3 ? 
                        (index === 0 ? '🔥 Trending' : index === 1 ? '💎 Rare' : '🆕 New') :
                        `NFT #${index + 1}`;
                    
                    embed.addFields({
                        name: fieldName,
                        value: `**${nft.name}** - ${nft.price} DOT\n*${nft.description.substring(0, 50)}...*`,
                        inline: true
                    });
                });

                // Add marketplace stats
                const totalNFTs = await NFT.countDocuments({ isActive: true });
                const totalForSale = await NFT.countDocuments({ isForSale: true, isActive: true });

                embed.addFields({
                    name: '📊 Marketplace Stats',
                    value: `**${totalForSale}** NFTs for sale\n**${totalNFTs}** Total NFTs\n**${interaction.guild.name}** Server`,
                    inline: false
                });

                // Create action row with buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('marketplace_list_nfts')
                            .setLabel('📦 My NFTs')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel('🌐 Web Marketplace')
                            .setStyle(ButtonStyle.Link)
                            .setURL('http://localhost:3001/marketplace'),
                        new ButtonBuilder()
                            .setCustomId('marketplace_refresh')
                            .setLabel('🔄 Refresh')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });

            } catch (error) {
                console.error('Marketplace browse error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Browsing Marketplace')
                    .setDescription('There was an error loading the marketplace. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'search') {
            try {
                // Defer the reply to prevent timeout
                await interaction.deferReply();
                
                const query = interaction.options.getString('query');
                
                // Search NFTs by name, description, or collection
                const searchResults = await NFT.find({
                    $and: [
                        { isActive: true },
                        {
                            $or: [
                                { name: { $regex: query, $options: 'i' } },
                                { description: { $regex: query, $options: 'i' } },
                                { collection: { $regex: query, $options: 'i' } }
                            ]
                        }
                    ]
                })
                .populate('owner', 'address')
                .populate('creator', 'address')
                .sort({ createdAt: -1 })
                .limit(6);

                if (searchResults.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle(`🔍 Search Results for "${query}"`)
                        .setDescription('No NFTs found matching your search.')
                        .setColor(0xFFA500)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`🔍 Search Results for "${query}"`)
                    .setDescription(`Found ${searchResults.length} NFT(s) matching your search`)
                    .setColor(0x00D4AA)
                    .setTimestamp();

                searchResults.forEach((nft, index) => {
                    const status = nft.isForSale ? `💰 ${nft.price} DOT` : '❌ Not for sale';
                    embed.addFields({
                        name: `Result ${index + 1}`,
                        value: `**${nft.name}**\n${status}\n*${nft.description.substring(0, 50)}...*`,
                        inline: true
                    });
                });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Marketplace search error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Search Error')
                    .setDescription('There was an error searching the marketplace. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'list') {
            try {
                // Defer the reply to prevent timeout
                await interaction.deferReply();
                
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

                const embed = new EmbedBuilder()
                    .setTitle('📦 Your NFT Collection')
                    .setDescription(`You own ${userNFTs.length} NFT(s)`)
                    .setColor(0x00D4AA)
                    .setTimestamp();

                userNFTs.forEach((nft, index) => {
                    const status = nft.isForSale ? `💰 ${nft.price} DOT` : '🏠 Not for sale';
                    embed.addFields({
                        name: `${nft.name} (${nft.nftId})`,
                        value: `${status}\n*${nft.description.substring(0, 50)}...*`,
                        inline: true
                    });
                });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('NFT list error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Listing NFTs')
                    .setDescription('There was an error loading your NFTs. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'sell') {
            try {
                const nftId = interaction.options.getString('nft_id');
                const price = interaction.options.getString('price');

                // Validate price
                if (isNaN(price) || parseFloat(price) <= 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Invalid Price')
                        .setDescription('Please enter a valid price greater than 0.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

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

                // Find the NFT
                const nft = await NFT.findOne({ 
                    nftId: nftId, 
                    owner: wallet._id, 
                    isActive: true 
                });

                if (!nft) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ NFT Not Found')
                        .setDescription('NFT not found or you don\'t own it.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                if (nft.isForSale) {
                    const embed = new EmbedBuilder()
                        .setTitle('⚠️ Already For Sale')
                        .setDescription('This NFT is already listed for sale.')
                        .setColor(0xFFA500)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Update NFT to be for sale
                nft.isForSale = true;
                nft.price = price;
                await nft.save();

                const embed = new EmbedBuilder()
                    .setTitle('💰 NFT Listed for Sale!')
                    .setDescription(`**${nft.name}** is now available for purchase`)
                    .addFields(
                        { name: 'Price', value: `${price} DOT`, inline: true },
                        { name: 'NFT ID', value: nftId, inline: true },
                        { name: 'Status', value: '🟢 For Sale', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('NFT sell error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Listing NFT')
                    .setDescription('There was an error listing your NFT for sale. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'buy') {
            try {
                // Defer the reply to prevent timeout
                await interaction.deferReply();
                
                const nftId = interaction.options.getString('nft_id');

                // Get buyer's wallet
                const buyerWallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (!buyerWallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Find the NFT
                const nft = await NFT.findOne({ 
                    nftId: nftId, 
                    isForSale: true, 
                    isActive: true 
                }).populate('owner', 'address');

                if (!nft) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ NFT Not Found')
                        .setDescription('NFT not found or not available for sale.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                if (nft.owner._id.toString() === buyerWallet._id.toString()) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Cannot Buy Own NFT')
                        .setDescription('You cannot buy your own NFT.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Check buyer's balance
                const buyerBalance = await polkadotService.getBalance(buyerWallet.address);
                const requiredAmount = parseFloat(nft.price);

                if (parseFloat(buyerBalance.free) < requiredAmount) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Insufficient Balance')
                        .setDescription(`You need ${nft.price} DOT but only have ${buyerBalance.free} DOT.`)
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Transfer NFT ownership
                const transferResult = await polkadotService.transferNFT(nftId, nft.ownerAddress, buyerWallet.address);

                // Update NFT ownership in database
                nft.owner = buyerWallet._id;
                nft.ownerAddress = buyerWallet.address;
                nft.isForSale = false;
                nft.price = '0';
                nft.transactionHash = transferResult.transactionHash;
                await nft.save();

                // Update wallet NFT arrays
                await Wallet.findByIdAndUpdate(nft.owner, { $pull: { nfts: nft._id } });
                await Wallet.findByIdAndUpdate(buyerWallet._id, { $addToSet: { nfts: nft._id } });

                const embed = new EmbedBuilder()
                    .setTitle('🎉 NFT Purchased Successfully!')
                    .setDescription(`You now own **${nft.name}**!`)
                    .addFields(
                        { name: 'Price Paid', value: `${nft.price} DOT`, inline: true },
                        { name: 'Transaction', value: `\`${transferResult.transactionHash}\``, inline: true },
                        { name: 'Status', value: '✅ Complete', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('NFT buy error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Buying NFT')
                    .setDescription('There was an error purchasing the NFT. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        } catch (error) {
            await ErrorHandler.handleCommandError(interaction, error, 'marketplace', subcommand);
        }
    },
};

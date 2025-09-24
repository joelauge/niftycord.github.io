const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Trade = require('../models/Trade');
const NFT = require('../models/NFT');
const Wallet = require('../models/Wallet');
const polkadotService = require('../services/polkadot');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('niftytrade')
        .setDescription('Trade NFTs with other users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription('Make a trade offer')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to trade with')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('offered_nft')
                        .setDescription('Your NFT to offer')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('requested_nft')
                        .setDescription('NFT you want in return')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Optional message for the trade')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a trade offer')
                .addStringOption(option =>
                    option
                        .setName('trade_id')
                        .setDescription('Trade offer ID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Reject a trade offer')
                .addStringOption(option =>
                    option
                        .setName('trade_id')
                        .setDescription('Trade offer ID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your pending trade offers')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('offers')
                .setDescription('List your pending trade offers (alias for list)')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'offer') {
            try {
                const user = interaction.options.getUser('user');
                const offeredNftId = interaction.options.getString('offered_nft');
                const requestedNftId = interaction.options.getString('requested_nft');
                const message = interaction.options.getString('message') || '';

                // Get offerer's wallet
                const offererWallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (!offererWallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Get receiver's wallet
                const receiverWallet = await Wallet.findOne({ discordId: user.id });
                
                if (!receiverWallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ User Has No Wallet')
                        .setDescription(`${user} needs to create a wallet first!`)
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Find offered NFT
                const offeredNft = await NFT.findOne({ 
                    nftId: offeredNftId, 
                    owner: offererWallet._id, 
                    isActive: true 
                });

                if (!offeredNft) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ NFT Not Found')
                        .setDescription('Offered NFT not found or you don\'t own it.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Find requested NFT
                const requestedNft = await NFT.findOne({ 
                    nftId: requestedNftId, 
                    owner: receiverWallet._id, 
                    isActive: true 
                });

                if (!requestedNft) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Requested NFT Not Found')
                        .setDescription('Requested NFT not found or user doesn\'t own it.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Create trade offer
                const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                const trade = new Trade({
                    tradeId: tradeId,
                    offerer: offererWallet._id,
                    offererAddress: offererWallet.address,
                    receiver: receiverWallet._id,
                    receiverAddress: receiverWallet.address,
                    offeredNFTs: [offeredNft._id],
                    requestedNFTs: [requestedNft._id],
                    message: message,
                    serverId: interaction.guild.id
                });

                await trade.save();

                const embed = new EmbedBuilder()
                    .setTitle('🤝 Trade Offer Sent!')
                    .setDescription(`You've sent a trade offer to ${user}`)
                    .addFields(
                        { name: 'Offering', value: `**${offeredNft.name}** (${offeredNftId})`, inline: true },
                        { name: 'Requesting', value: `**${requestedNft.name}** (${requestedNftId})`, inline: true },
                        { name: 'To', value: user.toString(), inline: true },
                        { name: 'Trade ID', value: `\`${tradeId}\``, inline: false },
                        { name: 'Status', value: '⏳ Pending', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Trade offer error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Creating Trade Offer')
                    .setDescription('There was an error creating the trade offer. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'accept') {
            try {
                const tradeId = interaction.options.getString('trade_id');

                // Find the trade
                const trade = await Trade.findOne({ 
                    tradeId: tradeId, 
                    receiver: interaction.user.id,
                    status: 'pending'
                })
                .populate('offeredNFTs')
                .populate('requestedNFTs')
                .populate('offerer', 'address')
                .populate('receiver', 'address');

                if (!trade) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Trade Not Found')
                        .setDescription('Trade not found or you are not the receiver.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Check if trade has expired
                if (trade.expiresAt < new Date()) {
                    trade.status = 'cancelled';
                    await trade.save();

                    const embed = new EmbedBuilder()
                        .setTitle('❌ Trade Expired')
                        .setDescription('This trade offer has expired.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Execute the trade on blockchain
                const offeredNft = trade.offeredNFTs[0];
                const requestedNft = trade.requestedNFTs[0];

                // Transfer NFTs
                const transfer1 = await polkadotService.transferNFT(
                    offeredNft.nftId, 
                    trade.offererAddress, 
                    trade.receiverAddress
                );
                
                const transfer2 = await polkadotService.transferNFT(
                    requestedNft.nftId, 
                    trade.receiverAddress, 
                    trade.offererAddress
                );

                // Update NFT ownership in database
                offeredNft.owner = trade.receiver;
                offeredNft.ownerAddress = trade.receiverAddress;
                offeredNft.transactionHash = transfer1.transactionHash;
                await offeredNft.save();

                requestedNft.owner = trade.offerer;
                requestedNft.ownerAddress = trade.offererAddress;
                requestedNft.transactionHash = transfer2.transactionHash;
                await requestedNft.save();

                // Update trade status
                trade.status = 'completed';
                trade.completedAt = new Date();
                trade.transactionHash = `${transfer1.transactionHash},${transfer2.transactionHash}`;
                await trade.save();

                const embed = new EmbedBuilder()
                    .setTitle('✅ Trade Completed!')
                    .setDescription('Trade has been completed successfully!')
                    .addFields(
                        { name: 'You Received', value: `**${offeredNft.name}**`, inline: true },
                        { name: 'You Gave', value: `**${requestedNft.name}**`, inline: true },
                        { name: 'Trade ID', value: `\`${tradeId}\``, inline: false },
                        { name: 'Status', value: '✅ Completed', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Trade accept error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Accepting Trade')
                    .setDescription('There was an error accepting the trade. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'reject') {
            try {
                const tradeId = interaction.options.getString('trade_id');

                const trade = await Trade.findOne({ 
                    tradeId: tradeId, 
                    receiver: interaction.user.id,
                    status: 'pending'
                });

                if (!trade) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Trade Not Found')
                        .setDescription('Trade not found or you are not the receiver.')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                trade.status = 'rejected';
                await trade.save();

                const embed = new EmbedBuilder()
                    .setTitle('❌ Trade Rejected')
                    .setDescription('You have rejected this trade offer.')
                    .addFields(
                        { name: 'Trade ID', value: `\`${tradeId}\``, inline: true },
                        { name: 'Status', value: '❌ Rejected', inline: true }
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Trade reject error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Rejecting Trade')
                    .setDescription('There was an error rejecting the trade. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === 'list' || subcommand === 'offers') {
            try {
                // Defer the reply to prevent timeout
                await interaction.deferReply();
                
                const wallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (!wallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                // Get user's pending trades
                const pendingTrades = await Trade.find({
                    $or: [
                        { offerer: wallet._id, status: 'pending' },
                        { receiver: wallet._id, status: 'pending' }
                    ]
                })
                .populate('offeredNFTs')
                .populate('requestedNFTs')
                .populate('offerer', 'address')
                .populate('receiver', 'address')
                .sort({ createdAt: -1 });

                if (pendingTrades.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('📋 Your Trade Offers')
                        .setDescription('You have no pending trade offers.')
                        .setColor(0xFFA500)
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle('📋 Your Trade Offers')
                    .setDescription(`You have ${pendingTrades.length} pending trade(s)`)
                    .setColor(0x00D4AA)
                    .setTimestamp();

                pendingTrades.forEach((trade, index) => {
                    const isOfferer = trade.offerer._id.toString() === wallet._id.toString();
                    const offeredNft = trade.offeredNFTs[0];
                    const requestedNft = trade.requestedNFTs[0];
                    
                    const role = isOfferer ? 'You offered' : 'You received offer';
                    const status = isOfferer ? '⏳ Waiting for response' : '⏳ Waiting for you';

                    embed.addFields({
                        name: `Trade ${index + 1} (${trade.tradeId})`,
                        value: `${role}\n**Offering:** ${offeredNft.name}\n**Requesting:** ${requestedNft.name}\n**Status:** ${status}`,
                        inline: true
                    });
                });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Trade list error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Listing Trades')
                    .setDescription('There was an error loading your trades. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }
    },
};

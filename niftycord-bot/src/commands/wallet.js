const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../models/Wallet');
const polkadotService = require('../services/polkadot');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('niftywallet')
        .setDescription('Create and manage your NiftyCord wallet')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new wallet')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Check your wallet balance')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('address')
                .setDescription('Get your wallet address')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nfts')
                .setDescription('View your NFTs')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            try {
                // Check if wallet already exists
                let wallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (wallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('⚠️ Wallet Already Exists!')
                        .setDescription('You already have a NiftyCord wallet!')
                        .addFields(
                            { name: 'Wallet Address', value: `\`${wallet.address}\``, inline: false },
                            { name: 'Balance', value: `${wallet.balance.free} DOT`, inline: true },
                            { name: 'NFTs', value: wallet.nfts.length.toString(), inline: true }
                        )
                        .setColor(0xFFA500)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                // Create new wallet with Polkadot
                const walletData = await polkadotService.createWallet();
                
                // Save to database
                wallet = new Wallet({
                    userId: interaction.user.id,
                    discordId: interaction.user.id,
                    address: walletData.address,
                    publicKey: walletData.publicKey,
                    mnemonic: walletData.mnemonic,
                    ss58Format: walletData.ss58Format,
                    balance: {
                        free: '0',
                        reserved: '0',
                        total: '0'
                    }
                });

                await wallet.save();

                const embed = new EmbedBuilder()
                    .setTitle('💳 Wallet Created!')
                    .setDescription('Your NiftyCord wallet has been created successfully!')
                    .addFields(
                        { name: 'Wallet Address', value: `\`${walletData.address}\``, inline: false },
                        { name: 'Balance', value: '0.0 DOT', inline: true },
                        { name: 'NFTs', value: '0', inline: true },
                        { name: 'Network', value: 'Polkadot', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Wallet creation error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Creating Wallet')
                    .setDescription('There was an error creating your wallet. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }

        if (subcommand === 'balance') {
            try {
                const wallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (!wallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                // Get real balance from Polkadot
                const balance = await polkadotService.getBalance(wallet.address);
                
                const embed = new EmbedBuilder()
                    .setTitle('💰 Wallet Balance')
                    .setDescription('Your current wallet balance')
                    .addFields(
                        { name: 'Free Balance', value: `${balance.free} DOT`, inline: true },
                        { name: 'Reserved', value: `${balance.reserved} DOT`, inline: true },
                        { name: 'Total', value: `${balance.total} DOT`, inline: true },
                        { name: 'NFTs', value: wallet.nfts.length.toString(), inline: true },
                        { name: 'Address', value: `\`${wallet.address}\``, inline: false }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Balance check error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Getting Balance')
                    .setDescription('There was an error getting your balance. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }

        if (subcommand === 'address') {
            try {
                const wallet = await Wallet.findOne({ discordId: interaction.user.id });
                
                if (!wallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle('📍 Wallet Address')
                    .setDescription('Your NiftyCord wallet address')
                    .addFields(
                        { name: 'Address', value: `\`${wallet.address}\``, inline: false },
                        { name: 'Network', value: 'Polkadot', inline: true },
                        { name: 'SS58 Format', value: wallet.ss58Format.toString(), inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Address check error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Getting Address')
                    .setDescription('There was an error getting your address. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }

        if (subcommand === 'nfts') {
            try {
                const wallet = await Wallet.findOne({ discordId: interaction.user.id }).populate('nfts');
                
                if (!wallet) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No Wallet Found')
                        .setDescription('You need to create a wallet first! Use `/niftywallet create`')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                if (wallet.nfts.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('🎨 Your NFTs')
                        .setDescription('You don\'t have any NFTs yet!')
                        .addFields(
                            { name: 'Get NFTs', value: 'Use `/niftymarketplace browse` to find NFTs to buy or trade!', inline: false }
                        )
                        .setColor(0x00D4AA)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎨 Your NFTs')
                    .setDescription(`You have ${wallet.nfts.length} NFT${wallet.nfts.length === 1 ? '' : 's'}`)
                    .setColor(0x00D4AA)
                    .setTimestamp();

                // Add NFT fields (limit to 25 due to Discord embed limits)
                const nftsToShow = wallet.nfts.slice(0, 25);
                for (let i = 0; i < nftsToShow.length; i++) {
                    const nft = nftsToShow[i];
                    embed.addFields({
                        name: `${i + 1}. ${nft.name}`,
                        value: `**Collection:** ${nft.collection}\n**ID:** \`${nft.nftId}\`\n**Status:** ${nft.isForSale ? '🟢 For Sale' : '🔒 Not for Sale'}`,
                        inline: true
                    });
                }

                if (wallet.nfts.length > 25) {
                    embed.setFooter({ text: `Showing 25 of ${wallet.nfts.length} NFTs` });
                }

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('NFTs check error:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Getting NFTs')
                    .setDescription('There was an error getting your NFTs. Please try again later.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const NFT = require('../models/NFT');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test commands for development')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create-sample-nft')
                .setDescription('Create a sample NFT for testing unfurling')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('NFT name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('NFT description')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('image')
                        .setDescription('NFT image URL')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unfurl-test')
                .setDescription('Test NFT unfurling with sample links')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create-sample-nft') {
            try {
                const name = interaction.options.getString('name');
                const description = interaction.options.getString('description');
                const image = interaction.options.getString('image') || 'https://via.placeholder.com/300x300?text=NFT';

                // Create sample NFT
                const nft = new NFT({
                    nftId: `test_${Date.now()}`,
                    name: name,
                    description: description,
                    image: image,
                    attributes: [
                        { trait_type: 'Collection', value: 'Test Collection' },
                        { trait_type: 'Rarity', value: 'Common' },
                        { trait_type: 'Type', value: 'Test NFT' }
                    ],
                    owner: interaction.user.id,
                    ownerAddress: '5GmcABdg9DRWp8vMuWie8zuaa1QzmkhKAWDMcvJVisfHyCkn',
                    creator: interaction.user.id,
                    creatorAddress: '5GmcABdg9DRWp8vMuWie8zuaa1QzmkhKAWDMcvJVisfHyCkn',
                    collection: 'Test Collection',
                    price: '10.5',
                    isForSale: true,
                    isTradable: true,
                    blockchain: 'polkadot',
                    transactionHash: `test_tx_${Date.now()}`,
                    serverId: interaction.guild.id,
                    serverName: interaction.guild.name,
                    isActive: true
                });

                await nft.save();

                const embed = new EmbedBuilder()
                    .setTitle('✅ Sample NFT Created!')
                    .setDescription(`**${name}** has been created for testing unfurling.`)
                    .addFields(
                        { name: 'NFT ID', value: `\`${nft.nftId}\``, inline: true },
                        { name: 'Collection', value: 'Test Collection', inline: true },
                        { name: 'Price', value: '10.5 DOT', inline: true }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Error creating sample NFT:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error Creating Sample NFT')
                    .setDescription('There was an error creating the sample NFT.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }

        if (subcommand === 'unfurl-test') {
            try {
                // Get a random NFT from the database
                const nft = await NFT.findOne({ isActive: true });
                
                if (!nft) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ No NFTs Found')
                        .setDescription('No NFTs found in the database. Create some NFTs first!')
                        .setColor(0xFF0000)
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🧪 Unfurl Test')
                    .setDescription('Try pasting these links in a message to test unfurling:')
                    .addFields(
                        { 
                            name: 'Full URL', 
                            value: `https://niftycord.com/nft/${nft.nftId}`, 
                            inline: false 
                        },
                        { 
                            name: 'Short URL', 
                            value: `nft/${nft.nftId}`, 
                            inline: false 
                        },
                        { 
                            name: 'Marketplace URL', 
                            value: `https://niftycord.com/marketplace/${nft.nftId}`, 
                            inline: false 
                        }
                    )
                    .setColor(0x00D4AA)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error('Error in unfurl test:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error in Unfurl Test')
                    .setDescription('There was an error running the unfurl test.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};

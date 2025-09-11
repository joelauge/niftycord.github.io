const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('niftyhelp')
        .setDescription('Get help and information about NiftyCord commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 NiftyCord Help')
            .setDescription('Here are all the available commands:')
            .addFields(
                { 
                    name: '🔧 Admin Commands', 
                    value: '`/admin setup` - Set up the bot\n`/admin mint` - Create NFT collections\n`/admin status` - Check bot status', 
                    inline: false 
                },
                { 
                    name: '💳 Wallet Commands', 
                    value: '`/niftywallet create` - Create a wallet\n`/niftywallet balance` - Check balance\n`/niftywallet address` - Get wallet address', 
                    inline: false 
                },
                { 
                    name: '🛒 Marketplace Commands', 
                    value: '`/marketplace browse` - Browse NFTs\n`/marketplace search` - Search for NFTs', 
                    inline: false 
                },
                { 
                    name: '🤝 Trading Commands', 
                    value: '`/niftytrade offer` - Make trade offer\n`/niftytrade accept` - Accept trade offer', 
                    inline: false 
                },
                { 
                    name: '❓ Help', 
                    value: '`/niftyhelp` - Show this help message', 
                    inline: false 
                }
            )
            .setColor(0x00D4AA)
            .setTimestamp()
            .setFooter({ text: 'NiftyCord - NFT Trading Made Easy' });

        await interaction.reply({ embeds: [embed] });
    },
};

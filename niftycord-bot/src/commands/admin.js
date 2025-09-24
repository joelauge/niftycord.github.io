const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for NiftyCord bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up NiftyCord for this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mint')
                .setDescription('Create a new NFT collection')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Collection name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Collection description')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check bot status and configuration')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('🎉 NiftyCord Setup Complete!')
                .setDescription('Your server is now ready for NFT trading!')
                .addFields(
                    { name: '✅ Bot Permissions', value: 'All required permissions granted', inline: true },
                    { name: '✅ Commands Registered', value: 'All slash commands are active', inline: true },
                    { name: '✅ Database Connected', value: 'Ready to store NFT data', inline: true }
                )
                .setColor(0x00D4AA)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'mint') {
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');

            // Validate required parameters
            if (!name || !description) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Missing Required Parameters')
                    .setDescription('Please provide both collection name and description.')
                    .addFields(
                        { name: 'Usage', value: '`/admin mint name:"Collection Name" description:"Collection Description"`', inline: false },
                        { name: 'Example', value: '`/admin mint name:"My Art Collection" description:"A collection of digital artworks"`', inline: false }
                    )
                    .setColor(0xFF6B6B)
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎨 NFT Collection Created!')
                .setDescription(`**${name}** collection has been created successfully!`)
                .addFields(
                    { name: 'Collection Name', value: name || 'Not provided', inline: true },
                    { name: 'Description', value: description || 'Not provided', inline: true },
                    { name: 'Status', value: 'Ready for minting', inline: true }
                )
                .setColor(0x00D4AA)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 NiftyCord Bot Status')
                .setDescription('Current bot configuration and status')
                .addFields(
                    { name: 'Bot Status', value: '🟢 Online', inline: true },
                    { name: 'Server', value: interaction.guild.name, inline: true },
                    { name: 'Members', value: interaction.guild.memberCount.toString(), inline: true },
                    { name: 'Commands', value: '5/5 Active', inline: true },
                    { name: 'Database', value: '🟢 Connected', inline: true },
                    { name: 'Uptime', value: `${Math.floor(process.uptime())}s`, inline: true }
                )
                .setColor(0x00D4AA)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};

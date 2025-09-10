/**
 * Discord Application Configuration
 * This file contains the Discord application settings for NiftyCord bot installation
 */

const DiscordConfig = {
    // Discord Application Settings
    // Replace these with your actual Discord application credentials
    clientId: '834820829941727342', // Get this from Discord Developer Portal
    clientSecret: 'YOUR_DISCORD_CLIENT_SECRET', // Keep this secure, server-side only - DO NOT COMMIT TO GIT
    
    // OAuth2 Settings
    redirectUri: 'https://niftycord.com/services/install-success.html',
    scope: 'bot applications.commands',
    permissions: '8', // Administrator permissions (adjust as needed)
    
    // Bot Invite URL (for manual installation)
    getBotInviteUrl: function() {
        const baseUrl = 'https://discord.com/api/oauth2/authorize';
        const params = new URLSearchParams({
            client_id: this.clientId,
            permissions: this.permissions,
            scope: this.scope
        });
        return `${baseUrl}?${params.toString()}`;
    },
    
    // OAuth2 Authorization URL
    getAuthUrl: function(guildId = null) {
        const baseUrl = 'https://discord.com/api/oauth2/authorize';
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: encodeURIComponent(this.redirectUri),
            response_type: 'code',
            scope: this.scope,
            permissions: this.permissions
        });
        
        if (guildId) {
            params.append('guild_id', guildId);
        }
        
        return `${baseUrl}?${params.toString()}`;
    },
    
    // Required Bot Permissions
    requiredPermissions: [
        'Send Messages',
        'Use Slash Commands',
        'Embed Links',
        'Attach Files',
        'Read Message History',
        'Add Reactions',
        'Manage Messages',
        'Administrator' // For full functionality
    ],
    
    // Bot Features
    features: [
        'NFT Trading Commands',
        'Wallet Management',
        'Marketplace Integration',
        'Asset Minting',
        'Cross-Server Trading',
        'Rich Embeds',
        'Interactive Buttons'
    ],
    
    // Installation Instructions
    installationSteps: [
        'Click "Install to Discord" button',
        'Select your Discord server',
        'Review and grant permissions',
        'Complete installation',
        'Start using NiftyCord commands'
    ],
    
    // Post-Installation Commands
    quickStartCommands: [
        '/admin setup - Configure your server',
        '/admin mint - Create NFT collections',
        '/niftywallet - Create user wallets',
        '/marketplace - Browse NFTs',
        '/niftytrade - Start trading',
        '/niftyhelp - Get help'
    ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordConfig;
} else {
    window.DiscordConfig = DiscordConfig;
}
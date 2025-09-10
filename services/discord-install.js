/**
 * Discord Bot Installation Handler
 * Handles OAuth2 flow for installing NiftyCord bot to Discord servers
 */

class DiscordInstallHandler {
    constructor() {
        // Load configuration
        this.config = typeof DiscordConfig !== 'undefined' ? DiscordConfig : {
            clientId: '834820829941727342',
            redirectUri: 'https://niftycord.com/services/install-success.html',
            scope: 'bot applications.commands',
            permissions: '8'
        };
        
        this.clientId = this.config.clientId;
        this.redirectUri = this.config.redirectUri;
        this.scope = this.config.scope;
        this.permissions = this.config.permissions;
    }

    /**
     * Generate Discord OAuth2 authorization URL
     * @param {string} guildId - Optional guild ID for direct server installation
     * @returns {string} - Authorization URL
     */
    generateAuthUrl(guildId = null) {
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
    }

    /**
     * Start the Discord bot installation process
     * @param {string} guildId - Optional guild ID for direct server installation
     */
    installBot(guildId = null) {
        try {
            const authUrl = this.generateAuthUrl(guildId);
            
            // Store installation state in session storage
            sessionStorage.setItem('niftycord_install_started', 'true');
            sessionStorage.setItem('niftycord_install_timestamp', Date.now().toString());
            
            // Redirect to Discord OAuth
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error starting Discord installation:', error);
            this.showError('Failed to start Discord installation. Please try again.');
        }
    }

    /**
     * Handle OAuth callback and show success/error messages
     */
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const guildId = urlParams.get('guild_id');

        if (error) {
            this.showError(`Discord installation failed: ${error}`);
            return;
        }

        if (code) {
            this.showSuccess(guildId);
        } else {
            this.showError('No authorization code received from Discord.');
        }
    }

    /**
     * Show success message after installation
     * @param {string} guildId - Guild ID where bot was installed
     */
    showSuccess(guildId) {
        const successContainer = document.getElementById('install-success');
        const errorContainer = document.getElementById('install-error');
        
        if (successContainer) {
            successContainer.style.display = 'block';
            successContainer.innerHTML = `
                <div class="success-message">
                    <div class="success-icon">✅</div>
                    <h2>NiftyCord Bot Installed Successfully!</h2>
                    <p>Your Discord server is now ready for NFT trading. Here's what you can do next:</p>
                    <ul class="next-steps">
                        <li>🔧 Use <code>/admin setup</code> to configure your server</li>
                        <li>🎨 Use <code>/admin mint</code> to create NFT collections</li>
                        <li>👥 Your members can use <code>/niftywallet</code> to create wallets</li>
                        <li>🏪 Use <code>/marketplace</code> to browse and trade NFTs</li>
                    </ul>
                    <div class="action-buttons">
                        <button onclick="window.close()" class="btn btn-primary">Close Window</button>
                        <button onclick="window.open('https://discord.com/channels/@me', '_blank')" class="btn btn-secondary">Open Discord</button>
                    </div>
                </div>
            `;
        }

        if (errorContainer) {
            errorContainer.style.display = 'none';
        }

        // Track successful installation
        this.trackInstallation('success', guildId);
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const successContainer = document.getElementById('install-success');
        const errorContainer = document.getElementById('install-error');
        
        if (errorContainer) {
            errorContainer.style.display = 'block';
            errorContainer.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">❌</div>
                    <h2>Installation Failed</h2>
                    <p>${message}</p>
                    <div class="action-buttons">
                        <button onclick="window.location.href='index.html'" class="btn btn-primary">Try Again</button>
                        <button onclick="window.close()" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            `;
        }

        if (successContainer) {
            successContainer.style.display = 'none';
        }

        // Track failed installation
        this.trackInstallation('error', null, message);
    }

    /**
     * Track installation events for analytics
     * @param {string} status - 'success' or 'error'
     * @param {string} guildId - Guild ID if successful
     * @param {string} errorMessage - Error message if failed
     */
    trackInstallation(status, guildId = null, errorMessage = null) {
        // You can integrate with your analytics service here
        console.log('Installation tracked:', {
            status,
            guildId,
            errorMessage,
            timestamp: new Date().toISOString()
        });

        // Example: Send to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'discord_install', {
                event_category: 'bot_installation',
                event_label: status,
                value: status === 'success' ? 1 : 0
            });
        }
    }

    /**
     * Check if user has necessary permissions to install bot
     * @returns {boolean} - True if user can install bot
     */
    canInstallBot() {
        // This would typically check if user is logged in to Discord
        // For now, we'll assume they can install
        return true;
    }

    /**
     * Get bot invite URL for manual installation
     * @returns {string} - Bot invite URL
     */
    getBotInviteUrl() {
        const baseUrl = 'https://discord.com/api/oauth2/authorize';
        const params = new URLSearchParams({
            client_id: this.clientId,
            permissions: this.permissions,
            scope: this.scope
        });

        return `${baseUrl}?${params.toString()}`;
    }
}

// Initialize the Discord installation handler
const discordInstall = new DiscordInstallHandler();

// Auto-handle callback if we're on the success page
if (window.location.pathname.includes('install-success')) {
    document.addEventListener('DOMContentLoaded', () => {
        discordInstall.handleCallback();
    });
}

// Export for use in other scripts
window.DiscordInstallHandler = DiscordInstallHandler;
window.discordInstall = discordInstall;
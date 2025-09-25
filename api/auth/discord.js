const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const Wallet = require('../models/Wallet');

// Discord OAuth Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/auth/discord/callback',
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔐 Discord OAuth login attempt:', profile.username);
        
        // Find or create user wallet
        let wallet = await Wallet.findOne({ discordId: profile.id });
        
        if (!wallet) {
            // Create new wallet for new user
            wallet = new Wallet({
                userId: profile.id,
                discordId: profile.id,
                address: `discord_${profile.id}`, // Placeholder address
                publicKey: `pub_${profile.id}`,
                mnemonic: 'not_generated', // Will be generated when they create wallet
                ss58Format: 0,
                balance: {
                    free: '0',
                    reserved: '0',
                    total: '0'
                },
                nfts: [],
                isActive: true
            });
            
            await wallet.save();
            console.log('✅ Created new wallet for user:', profile.username);
        }
        
        // Return user profile with wallet info
        const user = {
            id: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            wallet: wallet,
            guilds: profile.guilds || []
        };
        
        return done(null, user);
    } catch (error) {
        console.error('❌ Discord OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const wallet = await Wallet.findOne({ discordId: id }).populate('nfts');
        if (!wallet) {
            return done(null, false);
        }
        
        const user = {
            id: wallet.discordId,
            username: wallet.userId, // We'll update this with real Discord data
            wallet: wallet
        };
        
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;



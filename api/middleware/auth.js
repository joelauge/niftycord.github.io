// Authentication middleware for protected routes

function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            loginUrl: '/auth/discord'
        });
    }
}

function requireWallet(req, res, next) {
    if (req.isAuthenticated() && req.user.wallet) {
        return next();
    } else {
        return res.status(403).json({
            success: false,
            error: 'Wallet required. Please create a wallet first.',
            createWalletUrl: '/wallet/create'
        });
    }
}

function optionalAuth(req, res, next) {
    // This middleware doesn't block requests, just adds user info if available
    next();
}

module.exports = {
    requireAuth,
    requireWallet,
    optionalAuth
};



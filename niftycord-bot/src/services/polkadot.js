const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate, mnemonicToMiniSecret, blake2AsU8a } = require('@polkadot/util-crypto');

class PolkadotService {
    constructor() {
        this.api = null;
        this.keyring = null;
        this.isConnected = false;
    }

    async initialize() {
        if (this.api && this.isConnected) {
            console.log('Polkadot API already connected.');
            return;
        }

        const provider = new WsProvider(process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io');
        this.api = await ApiPromise.create({ provider });
        await this.api.isReady;

        this.keyring = new Keyring({ 
            type: 'sr25519', 
            ss58Format: parseInt(process.env.POLKADOT_SS58_FORMAT) || 0 
        });

        this.isConnected = true;
        console.log(`Connected to Polkadot blockchain at ${process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io'}`);
        console.log(`Chain: ${this.api.genesisHash.toHex()}`);
        console.log(`Node name: ${this.api.runtimeVersion.specName}`);
        console.log(`Node version: ${this.api.runtimeVersion.implVersion}`);
    }

    async createWallet() {
        if (!this.keyring) {
            throw new Error('Polkadot keyring not initialized. Call initialize() first.');
        }

        const mnemonic = mnemonicGenerate();
        const pair = this.keyring.addFromUri(mnemonic);

        return {
            address: pair.address,
            publicKey: pair.publicKey.toHex(),
            mnemonic: mnemonic,
            ss58Format: parseInt(process.env.POLKADOT_SS58_FORMAT) || 0
        };
    }

    async getBalance(address) {
        if (!this.api || !this.isConnected) {
            throw new Error('Polkadot API not connected. Call initialize() first.');
        }

        const { data: balance } = await this.api.query.system.account(address);
        
        // Convert to DOT (assuming 10^10 Planck for Polkadot)
        const free = (balance.free.toBigInt() / BigInt(10**10)).toString();
        const reserved = (balance.reserved.toBigInt() / BigInt(10**10)).toString();
        const total = (balance.frozen.toBigInt() / BigInt(10**10)).toString(); // Use frozen for total

        return {
            free: free,
            reserved: reserved,
            total: total
        };
    }

    async createNFT(metadata) {
        if (!this.isConnected) {
            throw new Error('Polkadot service not initialized');
        }

        try {
            // This is a simplified NFT creation - in reality, you'd use a specific NFT pallet
            // For now, we'll create a unique identifier and store metadata
            const nftId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            return {
                id: nftId,
                name: metadata.name || 'Unnamed NFT',
                description: metadata.description || 'No description provided',
                image: metadata.image || 'https://via.placeholder.com/300x300?text=NFT',
                attributes: metadata.attributes || [],
                owner: metadata.owner,
                createdAt: new Date().toISOString(),
                blockchain: 'polkadot'
            };
        } catch (error) {
            console.error('❌ Failed to create NFT:', error);
            throw error;
        }
    }

    async transferNFT(nftId, fromAddress, toAddress) {
        if (!this.isConnected) {
            throw new Error('Polkadot service not initialized');
        }

        try {
            // This would be a real blockchain transaction in a production environment
            // For now, we'll simulate the transfer
            console.log(`Transferring NFT ${nftId} from ${fromAddress} to ${toAddress}`);
            
            return {
                success: true,
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                nftId: nftId,
                from: fromAddress,
                to: toAddress,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to transfer NFT:', error);
            throw error;
        }
    }

    async getNetworkInfo() {
        if (!this.isConnected) {
            throw new Error('Polkadot service not initialized');
        }

        try {
            const [chain, nodeName, nodeVersion] = await Promise.all([
                this.api.rpc.system.chain(),
                this.api.rpc.system.name(),
                this.api.rpc.system.version()
            ]);

            return {
                chain: chain.toString(),
                nodeName: nodeName.toString(),
                nodeVersion: nodeVersion.toString(),
                ss58Format: this.keyring.getSS58Format()
            };
        } catch (error) {
            console.error('❌ Failed to get network info:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.api) {
            await this.api.disconnect();
            this.isConnected = false;
            console.log('🔌 Disconnected from Polkadot');
        }
    }
}

// Create singleton instance
const polkadotService = new PolkadotService();

// Export functions directly for compatibility
module.exports = {
    initialize: () => polkadotService.initialize(),
    createWallet: () => polkadotService.createWallet(),
    getBalance: (address) => polkadotService.getBalance(address),
    createNFT: (metadata) => polkadotService.createNFT(metadata),
    transferNFT: (nftId, fromAddress, toAddress) => polkadotService.transferNFT(nftId, fromAddress, toAddress),
    getApi: () => polkadotService.api,
    getKeyring: () => polkadotService.keyring
};

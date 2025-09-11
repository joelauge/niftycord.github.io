const { EmbedBuilder } = require('discord.js');
const NFT = require('../models/NFT');

class NFTUnfurlerService {
    constructor() {
        // NFT URL patterns to match
        this.urlPatterns = [
            /https?:\/\/niftycord\.com\/nft\/([a-zA-Z0-9]+)/gi,
            /https?:\/\/niftycord\.com\/marketplace\/([a-zA-Z0-9]+)/gi,
            /nft\/([a-zA-Z0-9]+)/gi, // Short form
            /marketplace\/([a-zA-Z0-9]+)/gi // Short form
        ];
    }

    /**
     * Check if a message contains NFT links
     * @param {string} content - Message content
     * @returns {Array} Array of found NFT IDs
     */
    extractNFTIds(content) {
        const nftIds = new Set();
        
        for (const pattern of this.urlPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    nftIds.add(match[1]);
                }
            }
        }
        
        return Array.from(nftIds);
    }

    /**
     * Create a rich embed for an NFT
     * @param {Object} nft - NFT document from database
     * @returns {EmbedBuilder} Discord embed
     */
    createNFTEmbed(nft) {
        const embed = new EmbedBuilder()
            .setTitle(`🎨 ${nft.name}`)
            .setDescription(nft.description)
            .setColor(0x00D4AA)
            .setTimestamp();

        // Add NFT image if available
        if (nft.image) {
            embed.setImage(nft.image);
        }

        // Add fields
        const fields = [
            { name: 'Collection', value: nft.collection || 'Unknown', inline: true },
            { name: 'NFT ID', value: `\`${nft.nftId}\``, inline: true },
            { name: 'Blockchain', value: nft.blockchain || 'Polkadot', inline: true }
        ];

        // Add price if for sale
        if (nft.isForSale && nft.price) {
            fields.push({ name: 'Price', value: `💰 ${nft.price} DOT`, inline: true });
        } else {
            fields.push({ name: 'Status', value: '🔒 Not for Sale', inline: true });
        }

        // Add owner info
        if (nft.ownerAddress) {
            fields.push({ name: 'Owner', value: `\`${nft.ownerAddress.slice(0, 10)}...${nft.ownerAddress.slice(-8)}\``, inline: true });
        }

        // Add server info
        if (nft.serverName) {
            fields.push({ name: 'Server', value: nft.serverName, inline: true });
        }

        // Add attributes if available
        if (nft.attributes && nft.attributes.length > 0) {
            const attributeText = nft.attributes
                .slice(0, 3) // Limit to first 3 attributes
                .map(attr => `**${attr.trait_type}:** ${attr.value}`)
                .join('\n');
            fields.push({ name: 'Attributes', value: attributeText, inline: false });
        }

        embed.addFields(fields);

        // Add footer with creation date
        if (nft.createdAt) {
            embed.setFooter({ 
                text: `Created ${new Date(nft.createdAt).toLocaleDateString()}` 
            });
        }

        return embed;
    }

    /**
     * Process a message and return NFT embeds
     * @param {string} content - Message content
     * @returns {Promise<Array>} Array of NFT embeds
     */
    async processMessage(content) {
        const nftIds = this.extractNFTIds(content);
        
        if (nftIds.length === 0) {
            return [];
        }

        const embeds = [];
        
        for (const nftId of nftIds) {
            try {
                const nft = await NFT.findOne({ nftId: nftId });
                
                if (nft) {
                    const embed = this.createNFTEmbed(nft);
                    embeds.push(embed);
                } else {
                    // Create a placeholder embed for unknown NFTs
                    const embed = new EmbedBuilder()
                        .setTitle('❓ Unknown NFT')
                        .setDescription(`NFT with ID \`${nftId}\` not found in the marketplace.`)
                        .setColor(0xFFA500)
                        .addFields(
                            { name: 'NFT ID', value: `\`${nftId}\``, inline: true },
                            { name: 'Status', value: 'Not Found', inline: true }
                        )
                        .setTimestamp();
                    
                    embeds.push(embed);
                }
            } catch (error) {
                console.error(`Error processing NFT ${nftId}:`, error);
            }
        }

        return embeds;
    }

    /**
     * Check if a message should be processed for NFT unfurling
     * @param {Object} message - Discord message object
     * @returns {boolean} Whether to process the message
     */
    shouldProcessMessage(message) {
        // Don't process bot messages
        if (message.author.bot) return false;
        
        // Don't process empty messages
        if (!message.content || message.content.trim().length === 0) return false;
        
        // Check if message contains NFT links
        const nftIds = this.extractNFTIds(message.content);
        return nftIds.length > 0;
    }
}

module.exports = new NFTUnfurlerService();

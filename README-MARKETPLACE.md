# NiftyCord NFT Marketplace

A comprehensive NFT marketplace dashboard that integrates with your NiftyCord Discord bot to display and manage NFTs across all Discord servers.

## 🎨 Features

- **Real-time NFT Data**: Fetches NFTs directly from your Discord bot's MongoDB database
- **Responsive Design**: Matches the design from your reference image with dark theme
- **Search & Filter**: Search NFTs by name, collection, or description
- **Pagination**: Load more NFTs as you scroll
- **Live Stats**: Real-time statistics about your NFT collection
- **Mobile Friendly**: Responsive design that works on all devices

## 🚀 Quick Start

### 1. Start the API Server

```bash
cd api
npm install
npm start
```

The API server will run on `http://localhost:3001`

### 2. Access the Marketplace

Open your browser and go to:
- **Local**: `http://localhost:3001/marketplace`
- **Direct**: `http://localhost:3001/marketplace.html`

### 3. Connect to Your Discord Bot Database

Make sure your Discord bot is running and connected to MongoDB. The API server will automatically connect to the same database.

## 📁 File Structure

```
├── marketplace.html          # Main marketplace dashboard
├── api/
│   ├── server.js            # Express API server
│   ├── models/
│   │   ├── NFT.js          # NFT model
│   │   └── Wallet.js       # Wallet model
│   └── package.json        # API dependencies
└── README-MARKETPLACE.md   # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `api` directory:

```env
MONGODB_URI=mongodb://localhost:27017/niftycord
API_PORT=3001
```

### API Endpoints

- `GET /api/nfts` - Fetch NFTs with pagination and search
- `GET /api/nfts/:id` - Get specific NFT details
- `GET /api/collections` - Get all collections
- `GET /api/stats` - Get marketplace statistics
- `GET /health` - Health check

## 🎯 Features Breakdown

### Dashboard Components

1. **Sidebar Navigation**
   - Home, Marketplace, Prices, NFTs/Items/Assets
   - Promotions, Activities, Notifications, Settings
   - Dark mode toggle

2. **Balance Section**
   - Total NFT count
   - Marketplace balance
   - Progress bars for different metrics

3. **NFT Table**
   - Asset name with icons
   - Coin type (ENJ, etc.)
   - 24h market change
   - Current value in USD
   - Available quantity
   - Total value

4. **Interactive Features**
   - Real-time search
   - Load more functionality
   - Responsive design

## 🔌 Integration with Discord Bot

The marketplace automatically connects to your Discord bot's database and displays:

- All NFTs from all Discord servers
- Real-time pricing and availability
- Owner information
- Collection details
- Trading status

## 🎨 Customization

### Styling

The marketplace uses CSS custom properties for easy theming:

```css
:root {
    --primary-color: #00D4AA;
    --secondary-color: #FF6B6B;
    --dark-bg: #1a1a1a;
    --card-bg: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #404040;
}
```

### Adding New Features

1. **New API Endpoints**: Add to `api/server.js`
2. **New UI Components**: Modify `marketplace.html`
3. **Database Queries**: Update the models in `api/models/`

## 🚀 Deployment

### Production Setup

1. **Environment Variables**:
   ```env
   MONGODB_URI=your_production_mongodb_uri
   API_PORT=3001
   NODE_ENV=production
   ```

2. **PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start api/server.js --name "niftycord-api"
   ```

3. **Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
       }
   }
   ```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if the API server is running
   - Verify MongoDB connection
   - Check CORS settings

2. **No NFTs Displayed**
   - Ensure Discord bot is running
   - Check database connection
   - Verify NFT data exists

3. **Search Not Working**
   - Check browser console for errors
   - Verify API endpoint is accessible
   - Test with sample data

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📱 Mobile Support

The marketplace is fully responsive and includes:
- Mobile-optimized sidebar
- Touch-friendly buttons
- Responsive table layout
- Mobile navigation

## 🔐 Security

- CORS enabled for cross-origin requests
- Input validation on all API endpoints
- MongoDB injection protection
- Rate limiting (can be added)

## 🎉 Next Steps

1. **Add User Authentication**: Connect Discord OAuth
2. **Real-time Updates**: WebSocket integration
3. **Advanced Filtering**: Collection, price range, rarity
4. **Trading Interface**: Buy/sell functionality
5. **Analytics Dashboard**: Trading statistics

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API logs
3. Test with sample data first
4. Verify database connectivity

---

**Built with ❤️ for the NiftyCord community**



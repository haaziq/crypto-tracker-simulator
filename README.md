# 🚀 Real-Time Crypto Dashboard

A high-performance cryptocurrency price tracker built with React Native and Node.js, featuring real-time WebSocket data streaming with binary serialization (FlatBuffers). This project demonstrates production-grade architecture patterns for real-time data applications.

![Performance Targets](https://img.shields.io/badge/Latency%20P99-<300ms-success)
![Frame Rate](https://img.shields.io/badge/Frame%20Rate-60fps-success)
![Update Frequency](https://img.shields.io/badge/Updates-10--30Hz-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [Running the Project](#-running-the-project)
- [Testing](#-testing)
- [Performance Targets](#-performance-targets)
- [Project Structure](#-project-structure)
- [Key Concepts](#-key-concepts)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### Real-Time Data Streaming
- **WebSocket connection** with auto-reconnect
- **Binary serialization** using FlatBuffers (<10ms deserialization)
- **Bidirectional communication** (commands + responses)
- **50+ concurrent crypto streams** at 10-30Hz

### UI Features
- **List view** - Compact crypto cards with price info
- **Charts view** - Real-time Skia-powered price charts
- **Filter panel** - Select specific cryptos and update frequencies
- **Performance metrics overlay** - Real-time latency/FPS monitoring

### Performance
- **60fps sustained** UI rendering
- **<300ms P99 latency** end-to-end
- **GPU-accelerated charts** using React Native Skia
- **Atomic state management** with Jotai (granular re-renders)
- **Virtualized lists** for memory efficiency

## 🛠 Tech Stack

### Mobile App (React Native)

| Technology | Purpose |
|------------|---------|
| **Expo SDK 52+** | React Native framework with dev client |
| **TypeScript** | Type safety across the codebase |
| **React Native Skia** | GPU-accelerated charts and animations |
| **Jotai** | Atomic state management with atom families |
| **FlatBuffers** | Binary deserialization (TypeScript) |
| **WebSocket API** | Real-time bidirectional communication |

### Backend (Node.js)

| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | JavaScript runtime |
| **TypeScript** | Type-safe server code |
| **ws** | WebSocket server implementation |
| **FlatBuffers** | Binary serialization (Node.js) |
| **CoinGecko API** | Live cryptocurrency price data |

## 🏗 Architecture

### Data Flow

```
CoinGecko API
    ↓
Backend Service (Plain Objects)
    ↓
FlatBuffers Encoder (Binary)
    ↓
WebSocket (Binary Stream)
    ↓
Mobile App WebSocket Manager
    ↓
FlatBuffers Adapter (Decode to Plain Objects)
    ↓
View Models (Plain TypeScript Objects)
    ↓
Jotai State Atoms (Atom Family Pattern)
    ↓
React Components (Granular Re-renders)
```

### Key Patterns

- **Adapter Pattern** - Clean separation between FlatBuffers and app code
- **Singleton Pattern** - WebSocket manager and price history
- **Atom Family Pattern** - Per-crypto state (only changed cryptos re-render)
- **View Model Pattern** - Components never see FlatBuffers objects directly

## 📦 Prerequisites

### Required

- **Node.js 20+** (Node 18 reached EOL April 2025)
  ```bash
  node --version  # Should show v20.x.x or higher
  ```

- **FlatBuffers Compiler** (for schema code generation)
  ```bash
  # macOS
  brew install flatbuffers
  
  # Linux
  sudo apt-get install flatbuffers-compiler
  
  # Windows - Download from github.com/google/flatbuffers/releases
  
  # Verify
  flatc --version
  ```

### For Mobile Development

**iOS (macOS only):**
- Xcode 16.2+ (from Mac App Store)
- Xcode Command Line Tools
  ```bash
  xcode-select --install
  ```
- CocoaPods
  ```bash
  sudo gem install cocoapods
  ```

**Android (all platforms):**
- Android Studio (with Android SDK)
- Environment variables in `~/.zshrc` or `~/.bash_profile`:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crypto-dashboard
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate FlatBuffers TypeScript code
npm run gen-schema

# Verify type checking
npm run type-check
```

**Configuration:**

Create `.env` file in `backend/` directory:

```env
PORT=8080
COINGECKO_API_KEY=your_api_key_here  # Optional, use for higher rate limits
```

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Generate FlatBuffers TypeScript code
npm run gen-schema

# Install iOS pods (macOS only)
npx pod-install
```

**Configuration:**

Create `.env.development` file in `mobile/` directory:

```env
# For iOS Simulator / Android Emulator (localhost)
WEBSOCKET_URL=ws://localhost:8080

# For physical device on same network
# WEBSOCKET_URL=ws://YOUR_IP_ADDRESS:8080
# Find your IP: ifconfig (macOS/Linux) or ipconfig (Windows)
```

## 🎯 Running the Project

### Start Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

**Expected output:**
```
WebSocket server started on ws://localhost:8080
Fetched 50 cryptocurrencies from CoinGecko
Streaming at 10 Hz
```

### Start Mobile App

Open a new terminal:

```bash
cd mobile

# Start Expo dev server
npm start
```

**Then press:**
- `i` for iOS simulator (macOS only)
- `a` for Android emulator
- Scan QR code with Expo Go app for physical device

**Expected behavior:**
- App connects to WebSocket server automatically
- Crypto list populates with real-time prices
- Performance metrics overlay shows connection status

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Type checking
npm run type-check

# Test WebSocket connection manually
node -e "
  const WebSocket = require('ws');
  const ws = new WebSocket('ws://localhost:8080');
  ws.on('open', () => console.log('✅ Connected'));
  ws.on('message', (data) => console.log('📦 Received data:', data.length, 'bytes'));
"
```

### Mobile App Tests

#### Performance Testing

1. Open app and enable **Performance Metrics Overlay** (toggle button)
2. Switch to **Charts** tab to stress test with Skia rendering
3. Verify metrics meet targets:
   - ✅ P99 Latency < 300ms (green)
   - ✅ Frame Rate ≥ 60fps (green)
   - ✅ Deserialization < 10ms (green)

#### Feature Testing

**List View:**
- Verify all cryptos display with correct prices
- Check color coding (green ▲ for gains, red ▼ for losses)
- Scroll performance (smooth 60fps)

**Charts View:**
- Verify smooth Skia-rendered line charts
- Check auto-scaling and gradient fills
- Confirm real-time updates (points increase over time)

**Filter Panel:**
- Change update frequency (10Hz → 20Hz → 30Hz)
- Select/deselect specific cryptos
- Apply filters and verify only selected cryptos stream

### Connection Testing

**Test auto-reconnect:**
1. Stop backend server (`Ctrl+C`)
2. Observe app shows "Reconnecting..." status
3. Restart backend server
4. Verify app reconnects automatically

**Test latency:**
1. Use physical device on WiFi (not simulator)
2. Check metrics overlay for realistic latency values
3. P99 should be under 300ms on good network

## 📊 Performance Targets

| Metric | Target | Measured In |
|--------|--------|-------------|
| **P99 Latency** | < 300ms | WebSocket round-trip |
| **Frame Rate** | ≥ 60fps | UI rendering |
| **Deserialization** | < 10ms | FlatBuffers decode |
| **Update Frequency** | 10-30 Hz | Configurable |
| **Concurrent Streams** | 50+ cryptos | Simultaneous updates |

**Why these targets?**
- Mirrors production requirements for real-time sports platforms (e.g., Hudl)
- Ensures smooth user experience even under heavy load
- Tests React Native performance optimization techniques

## 📁 Project Structure

```
crypto-dashboard/
├── backend/                    # Node.js WebSocket server
│   ├── src/
│   │   ├── server.ts          # Main server entry point
│   │   ├── services/
│   │   │   └── CryptoDataService.ts  # CoinGecko API integration
│   │   ├── utils/
│   │   │   └── FlatBuffersAdapter.ts # Binary serialization
│   │   ├── types/
│   │   │   ├── commands.ts    # WebSocket command types
│   │   │   └── models.ts      # Data models
│   │   └── schemas/
│   │       └── crypto.fbs     # FlatBuffers schema
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                     # React Native app
│   ├── App.tsx                # Main app component
│   ├── src/
│   │   ├── core/
│   │   │   ├── networking/
│   │   │   │   ├── WebSocketManager.ts    # WebSocket client
│   │   │   │   └── FlatBuffersAdapter.ts  # Binary deserialization
│   │   │   ├── state/
│   │   │   │   ├── atoms/
│   │   │   │   │   └── cryptoAtoms.ts     # Jotai state
│   │   │   │   └── PriceHistoryManager.ts # Chart data tracking
│   │   │   └── types/
│   │   │       ├── commands.ts            # Command types
│   │   │       └── viewModels.ts          # View models
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   │   ├── CryptoCard.tsx         # Single crypto card
│   │   │   │   ├── CryptoList.tsx         # Virtualized list
│   │   │   │   └── MetricsOverlay.tsx     # Performance metrics
│   │   │   ├── charts/
│   │   │   │   ├── SkiaLineChart.tsx      # GPU-accelerated chart
│   │   │   │   ├── CryptoChartCard.tsx    # Chart with crypto info
│   │   │   │   └── ChartPanel.tsx         # All charts view
│   │   │   └── controls/
│   │   │       └── FilterPanel.tsx        # Filter & settings
│   │   ├── config/
│   │   │   └── env.ts                     # Environment config
│   │   └── schemas/
│   │       └── crypto.fbs                 # FlatBuffers schema
│   ├── package.json
│   ├── app.config.ts                      # Expo configuration
│   └── tsconfig.json
│
└── schemas/                    # Shared FlatBuffers schemas
    └── crypto.fbs             # Single source of truth
```

## 💡 Key Concepts

### FlatBuffers Binary Serialization

**Why FlatBuffers?**
- Zero-copy deserialization (no parsing step)
- 10-100x faster than JSON
- Smaller payload size (saves bandwidth)
- Schema-driven (type safety across backend/frontend)

**Schema File (`crypto.fbs`):**
```flatbuffers
table Crypto {
  symbol: string;
  name: string;
  price: float;
  price_change_24h: float;
  // ... more fields
}

table WorldState {
  cryptos: [Crypto];
  frame_id: uint64;
  timestamp: uint64;
}
```

### Jotai Atom Family Pattern

**Problem:** Traditional Redux would re-render ALL crypto cards when ANY price changes.

**Solution:** Atom family creates a separate atom per crypto:

```typescript
// Each crypto gets its own atom
const cryptoAtomFamily = atomFamily((symbol: string) => 
  atom<CryptoViewModel | null>(null)
);

// Component only subscribes to BTC atom
const [btc] = useAtom(cryptoAtomFamily('BTC'));
// Only re-renders when BTC changes, not when ETH/SOL/etc change!
```

**Result:** 50x reduction in unnecessary re-renders.

### React Native Skia for Charts

**Why Skia?**
- Runs on **UI thread** (not JS thread) → no bridge overhead
- **GPU-accelerated** → 60fps even with complex animations
- **Declarative API** → React-like component model
- Used by Flutter, Chrome, Android → battle-tested

**Performance comparison:**
- React Native Animated: ~30fps with 50 charts
- React Native Skia: 60fps with 100+ charts

### WebSocket Bidirectional Communication

**Binary data (server → client):**
- FlatBuffers crypto price updates
- Sent at 10-30 Hz (configurable)
- ~2-5KB per message (50 cryptos)

**JSON commands (client → server):**
```typescript
// Filter specific cryptos
ws.send(JSON.stringify({
  type: "FILTER_COINS",
  payload: { symbols: ["BTC", "ETH"] }
}));

// Change update frequency
ws.send(JSON.stringify({
  type: "CHANGE_FREQUENCY", 
  payload: { frequency: 20 }
}));
```

**JSON responses (server → client):**
```typescript
{
  type: "FILTER_APPLIED",
  payload: { symbols: ["BTC", "ETH"], appliedAt: 1234567890 }
}
```

## 🐛 Troubleshooting

### Backend Issues

**Error: `flatc: command not found`**
```bash
# Install FlatBuffers compiler first
brew install flatbuffers  # macOS
```

**Error: `Address already in use :::8080`**
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or change port in backend/.env
PORT=8081
```

**Error: CoinGecko API rate limit**
- Free tier: 10-30 calls/minute
- Solution: Add delays or get API key from coingecko.com

### Mobile App Issues

**Error: `Unable to resolve module 'flatbuffers'`**
```bash
cd mobile
npm install
# Then rebuild
```

**Error: WebSocket connection fails**
```bash
# Check backend is running
curl http://localhost:8080

# For physical device, use network IP
# Find your IP:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update mobile/.env.development with your IP
WEBSOCKET_URL=ws://192.168.1.X:8080
```

**Error: iOS build fails**
```bash
cd mobile
npx pod-install
npm run ios
```

**Error: Charts not rendering**
- Check Skia is installed: `npm list @shopify/react-native-skia`
- Rebuild app: `npm run ios` or `npm run android`
- Clear cache: `npx expo start -c`

### Performance Issues

**High latency (>300ms P99)**
- Check network connection
- Use physical device on WiFi (not cellular)
- Verify backend is running locally (not remote server)

**Low frame rate (<60fps)**
- Close other apps to free memory
- Use release build (not debug): `npm run build`
- Check for console.log spam (remove in production)

**Charts lagging**
- Reduce update frequency to 10Hz
- Limit visible charts (virtualization should help)
- Check device performance (Skia requires OpenGL ES 2.0+)

## 📚 Additional Resources

- [FlatBuffers Documentation](https://google.github.io/flatbuffers/)
- [Jotai Documentation](https://jotai.org/)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

**Haaziq Uvais**

---

Built with ⚡️ for high-performance real-time data streaming

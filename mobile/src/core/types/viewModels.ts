/**
 * View Models
 *
 * CRITICAL ARCHITECTURE PRINCIPLE:
 * These are plain JavaScript objects that React components use.
 * They are NEVER FlatBuffers objects.
 *
 * FlatBuffers objects only exist in the adapter layer.
 * Components only see these clean, simple interfaces.
 */

/**
 * Cryptocurrency data view model
 *
 * This is what components receive and display.
 * All properties (not methods like FlatBuffers).
 * Easy to destructure, debug, and test.
 */
export interface CryptoViewModel {
  symbol: string; // "BTC"
  name: string; // "Bitcoin"
  price: number; // 50000.00
  priceChange24h: number; // 2.5 (can be negative)
  marketCap: number; // 1000000000000
  volume24h: number; // 50000000000
  high24h: number; // 51000.00
  low24h: number; // 48000.00
  lastUpdated: number; // Unix timestamp in milliseconds
}

/**
 * Complete world state view model
 *
 * This is the decoded version of what server sends.
 * Plain object with plain array of plain objects.
 */
export interface WorldStateViewModel {
  cryptos: CryptoViewModel[];
  frameId: number;
  timestamp: number;
  totalCryptos: number;
}

/**
 * Performance metrics view model
 *
 * Tracks real-time performance of the app.
 * These values determine if we meet Hudl requirements.
 */
export interface PerformanceMetrics {
  // Latency metrics (in milliseconds)
  latencyP50: number; // Median
  latencyP95: number; // 95th percentile
  latencyP99: number; // 99th percentile - MUST BE < 300ms
  averageLatency: number;
  maxLatency: number;
  minLatency: number;

  // Frame rate metrics
  currentFrameRate: number; // MUST BE >= 60fps
  frameDropCount: number;
  frameDropPercentage: number;

  // Throughput metrics
  messagesReceived: number;
  bytesReceived: number;
  bytesPerSecond: number;
  messagesPerSecond: number;

  // Deserialization performance
  averageDeserializeTime: number; // MUST BE < 10ms
  maxDeserializeTime: number;
  minDeserializeTime: number;

  // Connection metrics
  isConnected: boolean;
  connectionUptime: number; // Milliseconds
  reconnectAttempts: number;
  lastReconnectAt: number | null;
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "ERROR";

/**
 * Filter state
 */
export interface FilterState {
  selectedSymbols: string[];
  frequency: 10 | 20 | 30;
}

/**
 * Helper type for latency samples
 * Used internally for calculating percentiles
 */
export interface LatencySample {
  timestamp: number;
  latency: number;
}
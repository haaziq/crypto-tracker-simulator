/**
 * Data Models
 *
 * These are plain TypeScript interfaces representing business logic data.
 * They are NOT FlatBuffers objects - those are only used at serialization boundaries.
 */

/**
 * Internal cryptocurrency data model
 * This is what your backend business logic uses
 *
 * Normalized field names, consistent types
 */
export interface CryptoData {
  symbol: string; // "BTC" (uppercase)
  name: string; // "Bitcoin"
  price: number; // 50000.00
  priceChange24h: number; // 2.5 (percentage)
  marketCap: number; // 1000000000000
  volume24h: number; // 50000000000
  high24h: number; // 51000.00
  low24h: number; // 48000.00
  lastUpdated: number; // Unix timestamp in milliseconds
}

/**
 * Complete world state - all crypto data for one frame
 */
export interface WorldState {
  cryptos: CryptoData[];
  frameId: number;
  timestamp: number;
  totalCryptos: number;
}

/**
 * Client filter preferences
 * Stored per WebSocket connection
 */
export interface ClientFilter {
  symbols: string[]; // Which coins client wants to see
  frequency: number; // Update frequency in Hz (10, 20, 30)
}

/**
 * Performance metrics tracked by server
 */
export interface ServerMetrics {
  totalMessagesSent: number;
  totalBytesSent: number;
  activeConnections: number;
  averageMessageSize: number;
  messagesPerSecond: number;
  uptime: number; // Milliseconds since server start
}
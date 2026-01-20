/**
 * Price History Manager
 *
 * Tracks historical price data for each cryptocurrency.
 * Used to render real-time charts showing price movements.
 *
 * Features:
 * - Stores last N price points per crypto
 * - Circular buffer for memory efficiency
 * - Timestamps for accurate time-based charts
 * - Calculates min/max for chart scaling
 */

export interface PricePoint {
  timestamp: number; // Unix timestamp in milliseconds
  price: number;
}

export interface PriceHistory {
  symbol: string;
  points: PricePoint[];
  minPrice: number;
  maxPrice: number;
}

export class PriceHistoryManager {
  private static instance: PriceHistoryManager | null = null;
  
  // Store price history per symbol
  private histories: Map<string, PricePoint[]> = new Map();
  
  // Configuration
  private readonly MAX_POINTS = 100; // Keep last 100 points (~10 seconds at 10Hz)
  
  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): PriceHistoryManager {
    if (!PriceHistoryManager.instance) {
      PriceHistoryManager.instance = new PriceHistoryManager();
    }
    return PriceHistoryManager.instance;
  }
  
  /**
   * Add a price point for a symbol
   */
  addPrice(symbol: string, price: number, timestamp: number = Date.now()): void {
    // Get or create history array for this symbol
    let history = this.histories.get(symbol);
    
    if (!history) {
      history = [];
      this.histories.set(symbol, history);
    }
    
    // Add new point
    history.push({ timestamp, price });
    
    // Limit to MAX_POINTS (remove oldest if exceeded)
    if (history.length > this.MAX_POINTS) {
      history.shift();
    }
  }
  
  /**
   * Get price history for a symbol
   */
  getHistory(symbol: string): PriceHistory | null {
    const points = this.histories.get(symbol);
    
    if (!points || points.length === 0) {
      return null;
    }
    
    // Calculate min/max for chart scaling
    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      symbol,
      points: [...points], // Return copy to prevent mutation
      minPrice,
      maxPrice,
    };
  }
  
  /**
   * Get all symbols with history
   */
  getAllSymbols(): string[] {
    return Array.from(this.histories.keys());
  }
  
  /**
   * Clear history for a symbol
   */
  clearHistory(symbol: string): void {
    this.histories.delete(symbol);
  }
  
  /**
   * Clear all histories
   */
  clearAll(): void {
    this.histories.clear();
  }
  
  /**
   * Get number of points for a symbol
   */
  getPointCount(symbol: string): number {
    return this.histories.get(symbol)?.length || 0;
  }
}

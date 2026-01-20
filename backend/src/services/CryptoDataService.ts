import { CryptoData } from "../types/models";

/**
 * CryptoDataService with Simulated Data
 *
 * Generates realistic-looking cryptocurrency prices without external API calls.
 * Perfect for testing and development.
 */
export class CryptoDataService {
  private cryptoCache: Map<string, CryptoData> = new Map();
  
  // Simulated crypto data with base prices
  private readonly CRYPTOS = [
    { symbol: "BTC", name: "Bitcoin", basePrice: 45000 },
    { symbol: "ETH", name: "Ethereum", basePrice: 2500 },
    { symbol: "SOL", name: "Solana", basePrice: 95 },
    { symbol: "ADA", name: "Cardano", basePrice: 0.45 },
    { symbol: "DOT", name: "Polkadot", basePrice: 6.5 },
    { symbol: "AVAX", name: "Avalanche", basePrice: 35 },
    { symbol: "LINK", name: "Chainlink", basePrice: 14.5 },
    { symbol: "MATIC", name: "Polygon", basePrice: 0.85 },
    { symbol: "UNI", name: "Uniswap", basePrice: 8.5 },
    { symbol: "LTC", name: "Litecoin", basePrice: 72 },
    { symbol: "XLM", name: "Stellar", basePrice: 0.12 },
    { symbol: "ALGO", name: "Algorand", basePrice: 0.18 },
    { symbol: "ATOM", name: "Cosmos", basePrice: 9.2 },
    { symbol: "XTZ", name: "Tezos", basePrice: 0.95 },
    { symbol: "FIL", name: "Filecoin", basePrice: 5.5 },
  ];

  /**
   * Start the service - initializes crypto data
   */
  async start(): Promise<void> {
    console.log("CryptoDataService: Starting with simulated data...");
    
    // Initialize cache with base prices
    this.initializePrices();
    
    // Update prices every second to simulate market movement
    setInterval(() => {
      this.updatePrices();
    }, 1000);

    console.log(`CryptoDataService: Tracking ${this.CRYPTOS.length} cryptocurrencies`);
  }

  /**
   * Initialize crypto cache with starting prices
   */
  private initializePrices(): void {
    this.CRYPTOS.forEach((coin) => {
      const priceChange24h = this.randomChange(-10, 10); // -10% to +10%
      const currentPrice = coin.basePrice * (1 + priceChange24h / 100);
      
      const crypto: CryptoData = {
        symbol: coin.symbol,
        name: coin.name,
        price: currentPrice,
        priceChange24h: priceChange24h,
        marketCap: currentPrice * this.randomBetween(100_000_000, 1_000_000_000),
        volume24h: currentPrice * this.randomBetween(10_000_000, 100_000_000),
        high24h: currentPrice * this.randomBetween(1.01, 1.05),
        low24h: currentPrice * this.randomBetween(0.95, 0.99),
        lastUpdated: Date.now(),
      };

      this.cryptoCache.set(crypto.symbol, crypto);
    });
  }

  /**
   * Update prices with realistic market movements
   */
  private updatePrices(): void {
    this.cryptoCache.forEach((crypto, symbol) => {
      // Simulate gradual price change (-1% to +1% per second)
      const priceChange = this.randomChange(-1, 1);
      const newPrice = crypto.price * (1 + priceChange / 100);
      
      // Update 24h change slightly
      const change24hDrift = this.randomChange(-0.5, 0.5);
      const newChange24h = crypto.priceChange24h + change24hDrift;
      
      // Update high/low if needed
      const newHigh = Math.max(crypto.high24h, newPrice);
      const newLow = Math.min(crypto.low24h, newPrice);

      this.cryptoCache.set(symbol, {
        ...crypto,
        price: newPrice,
        priceChange24h: newChange24h,
        high24h: newHigh,
        low24h: newLow,
        marketCap: newPrice * this.randomBetween(100_000_000, 1_000_000_000),
        volume24h: newPrice * this.randomBetween(10_000_000, 100_000_000),
        lastUpdated: Date.now(),
      });
    });
  }

  /**
   * Get current prices with micro variations (called 10-30 times/sec)
   */
  getCurrentPrices(): CryptoData[] {
    const cryptos: CryptoData[] = [];

    this.cryptoCache.forEach((crypto) => {
      // Add tiny random variation for smooth updates (±0.05%)
      const microVariation = 1 + this.randomChange(-0.05, 0.05) / 100;

      cryptos.push({
        ...crypto,
        price: crypto.price * microVariation,
        lastUpdated: Date.now(),
      });
    });

    return cryptos;
  }

  /**
   * Get filtered prices for specific symbols
   */
  getFilteredPrices(symbols: string[]): CryptoData[] {
    if (symbols.length === 0) {
      return this.getCurrentPrices();
    }

    return this.getCurrentPrices().filter((crypto) =>
      symbols.includes(crypto.symbol)
    );
  }

  /**
   * Get count of tracked cryptocurrencies
   */
  getCryptoCount(): number {
    return this.cryptoCache.size;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Generate random number between min and max
   */
  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random percentage change between min and max
   */
  private randomChange(min: number, max: number): number {
    return this.randomBetween(min, max);
  }
}

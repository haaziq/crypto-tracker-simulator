import { Builder } from "flatbuffers";
import { Crypto, WorldState } from "../generated/crypto-dashboard";
import { CryptoData } from "../types/models";

/**
 * FlatBuffersAdapter
 *
 * CRITICAL ARCHITECTURE PATTERN:
 *
 * This is the ONLY place in the backend that deals with FlatBuffers objects.
 * All other code works with plain CryptoData objects.
 *
 * Responsibilities:
 * - Convert plain CryptoData[] → binary FlatBuffers format
 * - Handle FlatBuffers Builder API complexity
 * - Track encoding performance
 *
 * Public API:
 * - encode(cryptos) → Uint8Array (binary data)
 * - getMetrics() → { avgEncodeTime, totalEncoded }
 */
export class FlatBuffersAdapter {
  private static frameCounter = 0;
  private static totalEncodeTime = 0;
  private static totalEncoded = 0;

  /**
   * Encode an array of CryptoData into FlatBuffers binary format
   *
   * @param cryptos - Array of plain crypto data objects
   * @returns Uint8Array - Binary buffer ready to send over WebSocket
   */
  static encode(cryptos: CryptoData[]): Uint8Array {
    const startTime = performance.now();

    // Create FlatBuffers builder
    // 1024 is initial size, grows automatically if needed
    const builder = new Builder(1024);

    // Step 1: Build Crypto objects
    // We must build from bottom-up (inner objects first)
    const cryptoOffsets: number[] = [];

    for (const crypto of cryptos) {
      // Build strings first (FlatBuffers requirement)
      const symbolOffset = builder.createString(crypto.symbol);
      const nameOffset = builder.createString(crypto.name);

      // Build Crypto table
      Crypto.startCrypto(builder);
      Crypto.addSymbol(builder, symbolOffset);
      Crypto.addName(builder, nameOffset);
      Crypto.addPrice(builder, crypto.price);
      Crypto.addPriceChange24h(builder, crypto.priceChange24h);
      Crypto.addMarketCap(builder, crypto.marketCap);
      Crypto.addVolume24h(builder, crypto.volume24h);
      Crypto.addHigh24h(builder, crypto.high24h);
      Crypto.addLow24h(builder, crypto.low24h);
      Crypto.addLastUpdated(builder, BigInt(crypto.lastUpdated));

      const cryptoOffset = Crypto.endCrypto(builder);
      cryptoOffsets.push(cryptoOffset);
    }

    // Step 2: Build array of Crypto objects
    const cryptosVectorOffset = WorldState.createCryptosVector(
      builder,
      cryptoOffsets
    );

    // Step 3: Build WorldState (root object)
    WorldState.startWorldState(builder);
    WorldState.addCryptos(builder, cryptosVectorOffset);
    WorldState.addFrameId(builder, BigInt(this.frameCounter++));
    WorldState.addTimestamp(builder, BigInt(Date.now()));
    WorldState.addTotalCryptos(builder, cryptos.length);

    const worldStateOffset = WorldState.endWorldState(builder);

    // Step 4: Finish building and get binary buffer
    builder.finish(worldStateOffset);

    const buffer = builder.asUint8Array();

    // Track performance
    const encodeTime = performance.now() - startTime;
    this.totalEncodeTime += encodeTime;
    this.totalEncoded++;

    // Warn if encoding is slow
    if (encodeTime > 5) {
      console.warn(
        `FlatBuffers encoding took ${encodeTime.toFixed(2)}ms (expected <5ms)`
      );
    }

    return buffer;
  }

  /**
   * Get encoding performance metrics
   */
  static getMetrics() {
    return {
      averageEncodeTime:
        this.totalEncoded > 0 ? this.totalEncodeTime / this.totalEncoded : 0,
      totalEncoded: this.totalEncoded,
      currentFrameId: this.frameCounter,
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  static resetMetrics() {
    this.totalEncodeTime = 0;
    this.totalEncoded = 0;
    this.frameCounter = 0;
  }
}
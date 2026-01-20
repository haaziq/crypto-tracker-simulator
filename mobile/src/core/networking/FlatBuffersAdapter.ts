import { ByteBuffer } from "flatbuffers";
import { WorldState, Crypto } from "../../../generated/crypto-dashboard";
import { CryptoViewModel, WorldStateViewModel } from "../types/viewModels";

/**
 * FlatBuffers Adapter (Mobile)
 *
 * CRITICAL ARCHITECTURE PATTERN:
 * This is the ONLY file in the mobile app that touches FlatBuffers objects.
 *
 * Input:  Uint8Array (binary data from WebSocket)
 * Output: WorldStateViewModel (plain JavaScript object)
 *
 * All other code works with plain view models.
 * React components NEVER see FlatBuffers objects.
 */
export class FlatBuffersAdapter {
  private static totalDecodeTime = 0;
  private static totalDecoded = 0;
  private static minDecodeTime = Infinity;
  private static maxDecodeTime = 0;

  /**
   * Decode binary FlatBuffers data to plain view model
   *
   * This is the public API - takes binary, returns plain object.
   *
   * @param buffer - Binary data received from WebSocket
   * @returns Plain WorldStateViewModel object
   */
  static decode(buffer: Uint8Array): WorldStateViewModel {
    const startTime = performance.now();

    try {
      // Step 1: Create FlatBuffers ByteBuffer from raw bytes
      const bb = new ByteBuffer(buffer);

      // Step 2: Get root WorldState object (FlatBuffers object - DON'T let this escape!)
      const worldState = WorldState.getRootAsWorldState(bb);

      // Step 3: Convert FlatBuffers object → plain view model
      const viewModel = this.toViewModel(worldState);

      // Track performance
      const decodeTime = performance.now() - startTime;
      this.updateMetrics(decodeTime);

      // Warn if deserialization exceeds budget
      if (decodeTime > 10) {
        console.warn(
          `⚠️ Deserialization took ${decodeTime.toFixed(2)}ms (budget: <10ms)`
        );
      }

      return viewModel;
    } catch (error) {
      console.error("FlatBuffers decode error:", error);
      throw new Error("Failed to decode binary data");
    }
  }

  /**
   * Convert FlatBuffers WorldState → plain view model
   *
   * PRIVATE: FlatBuffers objects stay inside this function
   */
  private static toViewModel(worldState: WorldState): WorldStateViewModel {
    const cryptos: CryptoViewModel[] = [];

    // Iterate through FlatBuffers array
    const length = worldState.cryptosLength();
    for (let i = 0; i < length; i++) {
      const fbCrypto = worldState.cryptos(i);
      if (fbCrypto) {
        // Convert each FlatBuffers Crypto → plain CryptoViewModel
        cryptos.push(this.cryptoToViewModel(fbCrypto));
      }
    }

    return {
      cryptos,
      frameId: Number(worldState.frameId()), // BigInt → number
      timestamp: Number(worldState.timestamp()), // BigInt → number
      totalCryptos: worldState.totalCryptos(),
    };
  }

  /**
   * Convert FlatBuffers Crypto → plain CryptoViewModel
   *
   * PRIVATE: FlatBuffers Crypto object stays inside this function
   */
  private static cryptoToViewModel(fbCrypto: Crypto): CryptoViewModel {
    return {
      // Extract properties from FlatBuffers methods
      symbol: fbCrypto.symbol() || "",
      name: fbCrypto.name() || "",
      price: fbCrypto.price(),
      priceChange24h: fbCrypto.priceChange24h(),
      marketCap: fbCrypto.marketCap(),
      volume24h: fbCrypto.volume24h(),
      high24h: fbCrypto.high24h(),
      low24h: fbCrypto.low24h(),
      lastUpdated: Number(fbCrypto.lastUpdated()),
    };
  }

  /**
   * Update performance metrics
   */
  private static updateMetrics(decodeTime: number): void {
    this.totalDecodeTime += decodeTime;
    this.totalDecoded++;
    this.minDecodeTime = Math.min(this.minDecodeTime, decodeTime);
    this.maxDecodeTime = Math.max(this.maxDecodeTime, decodeTime);
  }

  /**
   * Get adapter performance metrics
   */
  static getMetrics() {
    return {
      averageDecodeTime:
        this.totalDecoded > 0 ? this.totalDecodeTime / this.totalDecoded : 0,
      minDecodeTime: this.minDecodeTime === Infinity ? 0 : this.minDecodeTime,
      maxDecodeTime: this.maxDecodeTime,
      totalDecoded: this.totalDecoded,
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  static resetMetrics(): void {
    this.totalDecodeTime = 0;
    this.totalDecoded = 0;
    this.minDecodeTime = Infinity;
    this.maxDecodeTime = 0;
  }

  /**
   * Validate that buffer looks like valid FlatBuffers data
   *
   * @param buffer - Binary data to validate
   * @returns true if buffer appears valid
   */
  static isValidBuffer(buffer: Uint8Array): boolean {
    // Minimum FlatBuffers buffer size
    if (buffer.length < 8) {
      return false;
    }

    // FlatBuffers starts with offset to root table
    // This is a simple sanity check, not exhaustive validation
    return true;
  }
}
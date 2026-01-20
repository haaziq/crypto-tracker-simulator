import { getDefaultStore } from "jotai";
import { FlatBuffersAdapter } from "./FlatBuffersAdapter";
import {
  allCryptosAtom,
  cryptoAtomFamily,
  connectionStatusAtom,
  performanceMetricsAtom,
} from "../state/atoms/cryptoAtoms";
import {
  ClientCommand,
  ServerResponse,
  isServerResponse,
  isFilterAppliedResponse,
  isFrequencyChangedResponse,
  isMetricsResponse,
  isErrorResponse,
} from "../types/commands";
import { WorldStateViewModel } from "../types/viewModels";
import { PriceHistoryManager } from "../state/PriceHistoryManager";

/**
 * WebSocket Manager (Singleton)
 *
 * Responsibilities:
 * - Manage WebSocket connection lifecycle
 * - Handle binary FlatBuffers messages (crypto data)
 * - Handle JSON messages (commands/responses)
 * - Update Jotai state atoms
 * - Track performance metrics
 * - Auto-reconnect on disconnect
 *
 * Usage:
 *   const manager = WebSocketManager.getInstance();
 *   manager.connect('ws://localhost:8080');
 */
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;

  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private store = getDefaultStore();

  // Configuration
  private url: string = "";
  private reconnectDelay = 2000; // ms
  private maxReconnectDelay = 30000; // ms
  private currentReconnectDelay = 2000;

  // Performance tracking
  private latencySamples: number[] = [];
  private readonly MAX_SAMPLES = 1000;
  private messagesReceived = 0;
  private bytesReceived = 0;
  private connectionStartTime = 0;
  private reconnectAttempts = 0;

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string): void {
    this.url = url;

    // Update connection status
    this.store.set(connectionStatusAtom, "CONNECTING");

    console.log(`WebSocket: Connecting to ${url}...`);

    try {
      this.ws = new WebSocket(url);

      // CRITICAL: Set binary type for FlatBuffers
      this.ws.binaryType = "arraybuffer";

      this.setupEventHandlers();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.store.set(connectionStatusAtom, "ERROR");
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket: Connected ✅");
      this.store.set(connectionStatusAtom, "CONNECTED");
      this.connectionStartTime = Date.now();
      this.currentReconnectDelay = this.reconnectDelay; // Reset backoff
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.store.set(connectionStatusAtom, "ERROR");
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket: Disconnected", event.code, event.reason);
      this.store.set(connectionStatusAtom, "DISCONNECTED");

      // Auto-reconnect if not closed intentionally
      if (event.code !== 1000) {
        // 1000 = normal closure
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming WebSocket message
   *
   * Can be:
   * - Binary (ArrayBuffer): FlatBuffers crypto data
   * - Text (string): JSON command responses
   */
  private handleMessage(event: MessageEvent): void {
    const receiveTime = Date.now();

    // Check message type
    if (event.data instanceof ArrayBuffer) {
      // Binary message - FlatBuffers crypto data
      this.handleBinaryMessage(new Uint8Array(event.data), receiveTime);
    } else if (typeof event.data === "string") {
      // Text message - JSON response
      this.handleTextMessage(event.data);
    } else {
      console.warn("WebSocket: Unknown message type", typeof event.data);
    }
  }

  /**
   * Handle binary FlatBuffers message
   */
  private handleBinaryMessage(buffer: Uint8Array, receiveTime: number): void {
    try {
      // Decode FlatBuffers binary → plain view model
      const worldState: WorldStateViewModel = FlatBuffersAdapter.decode(buffer);

      // Extract server timestamp from data
      const serverTimestamp = worldState.timestamp;
      const latency = receiveTime - serverTimestamp;

      // Update state with crypto data
      this.updateCryptoState(worldState);

      // Track performance metrics
      this.trackPerformance(buffer.length, latency);
    } catch (error) {
      console.error("Error processing binary message:", error);
    }
  }

  /**
   * Handle JSON text message
   */
  private handleTextMessage(text: string): void {
    try {
      const response = JSON.parse(text);

      if (!isServerResponse(response)) {
        console.warn("Invalid server response:", response);
        return;
      }

      // Handle different response types
      if (isFilterAppliedResponse(response)) {
        console.log("Filter applied:", response.payload.symbols);
      } else if (isFrequencyChangedResponse(response)) {
        console.log("Frequency changed:", response.payload.frequency);
      } else if (isMetricsResponse(response)) {
        console.log("Server metrics:", response.payload);
      } else if (isErrorResponse(response)) {
        console.error("Server error:", response.payload.message);
      }
    } catch (error) {
      console.error("Error parsing JSON message:", error);
    }
  }

  /**
   * Update Jotai atoms with crypto data
   *
   * Uses atom family for granular updates.
   * Only components using changed atoms re-render.
   */
  private updateCryptoState(worldState: WorldStateViewModel): void {
    const historyManager = PriceHistoryManager.getInstance();
    
    // Update individual crypto atoms and track price history
    worldState.cryptos.forEach((crypto) => {
      const atom = cryptoAtomFamily(crypto.symbol);
      this.store.set(atom, crypto);
      
      // Track price history for charts
      historyManager.addPrice(crypto.symbol, crypto.price, worldState.timestamp);
    });

    // Update all cryptos array (for list views)
    this.store.set(allCryptosAtom, worldState.cryptos);
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(byteSize: number, latency: number): void {
    // Update counters
    this.messagesReceived++;
    this.bytesReceived += byteSize;

    // Track latency samples
    this.latencySamples.push(latency);
    if (this.latencySamples.length > this.MAX_SAMPLES) {
      this.latencySamples.shift(); // Remove oldest
    }

    // Calculate metrics
    const metrics = this.calculateMetrics();

    // Update performance atom
    this.store.set(performanceMetricsAtom, metrics);

    // Warn if performance degrades
    if (metrics.latencyP99 > 300) {
      console.warn(
        `⚠️ P99 latency: ${metrics.latencyP99.toFixed(0)}ms (target: <300ms)`
      );
    }
  }

  /**
   * Calculate performance metrics from samples
   */
  private calculateMetrics() {
    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const count = sorted.length;

    // Percentile calculation
    const p50 = sorted[Math.floor(count * 0.5)] || 0;
    const p95 = sorted[Math.floor(count * 0.95)] || 0;
    const p99 = sorted[Math.floor(count * 0.99)] || 0;

    // Average
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? sum / count : 0;

    // Min/Max
    const min = Math.min(...this.latencySamples);
    const max = Math.max(...this.latencySamples);

    // Throughput
    const uptime = (Date.now() - this.connectionStartTime) / 1000; // seconds
    const bytesPerSecond = uptime > 0 ? this.bytesReceived / uptime : 0;
    const messagesPerSecond = uptime > 0 ? this.messagesReceived / uptime : 0;

    // Adapter metrics
    const adapterMetrics = FlatBuffersAdapter.getMetrics();

    return {
      // Latency
      latencyP50: p50,
      latencyP95: p95,
      latencyP99: p99,
      averageLatency: avg,
      maxLatency: max,
      minLatency: min === Infinity ? 0 : min,

      // Frame rate (calculated elsewhere, placeholder for now)
      currentFrameRate: 60,
      frameDropCount: 0,
      frameDropPercentage: 0,

      // Throughput
      messagesReceived: this.messagesReceived,
      bytesReceived: this.bytesReceived,
      bytesPerSecond,
      messagesPerSecond,

      // Deserialization
      averageDeserializeTime: adapterMetrics.averageDecodeTime,
      maxDeserializeTime: adapterMetrics.maxDecodeTime,
      minDeserializeTime: adapterMetrics.minDecodeTime,

      // Connection
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      connectionUptime: uptime * 1000,
      reconnectAttempts: this.reconnectAttempts,
      lastReconnectAt: null,
    };
  }

  /**
   * Send JSON command to server
   */
  sendCommand(command: ClientCommand): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected, cannot send command");
      return;
    }

    const json = JSON.stringify(command);
    this.ws.send(json);

    console.log("Sent command:", command.type);
  }

  /**
   * Send filter command
   */
  sendFilterCommand(symbols: string[]): void {
    this.sendCommand({
      type: "FILTER_COINS",
      payload: { symbols },
    });
  }

  /**
   * Send frequency change command
   */
  sendFrequencyCommand(frequency: 10 | 20 | 30): void {
    this.sendCommand({
      type: "CHANGE_FREQUENCY",
      payload: { frequency },
    });
  }

  /**
   * Request server metrics
   */
  requestMetrics(): void {
    this.sendCommand({
      type: "GET_METRICS",
      payload: {},
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    this.store.set(connectionStatusAtom, "RECONNECTING");

    console.log(
      `WebSocket: Reconnecting in ${this.currentReconnectDelay}ms ` +
        `(attempt ${this.reconnectAttempts})...`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.url);
    }, this.currentReconnectDelay);

    // Exponential backoff (double delay, max 30s)
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect"); // Normal closure
      this.ws = null;
    }

    this.store.set(connectionStatusAtom, "DISCONNECTED");
    console.log("WebSocket: Disconnected by client");
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.calculateMetrics();
  }
}
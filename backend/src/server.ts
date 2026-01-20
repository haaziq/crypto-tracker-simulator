import { WebSocket, WebSocketServer } from "ws";
import dotenv from "dotenv";
import { CryptoDataService } from "./services/CryptoDataService";
import { FlatBuffersAdapter } from "./utils/FlatBuffersAdapter";
import {
  ClientCommand,
  ServerResponse,
  isClientCommand,
  isFilterCoinsCommand,
  isChangeFrequencyCommand,
  isGetMetricsCommand,
} from "./types/commands";
import { ClientFilter } from "./types/models";

// Load environment variables
dotenv.config();

/**
 * ClientConnection
 *
 * Tracks per-client state and preferences
 */
interface ClientConnection {
  ws: WebSocket;
  filter: ClientFilter;
  connectedAt: number;
  messagesSent: number;
}

/**
 * WebSocket Server for Real-Time Crypto Data Streaming
 *
 * Architecture:
 * - Maintains set of connected clients
 * - Sends binary FlatBuffers updates at configured frequency
 * - Receives JSON commands from clients
 * - Tracks performance metrics
 */
class CryptoWebSocketServer {
  private wss: WebSocketServer;
  private cryptoService: CryptoDataService;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private updateIntervals: Map<WebSocket, NodeJS.Timeout> = new Map();

  // Configuration
  private readonly PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  private readonly DEFAULT_FREQUENCY = 10; // Hz

  // Metrics
  private totalMessagesSent = 0;
  private totalBytesSent = 0;
  private serverStartTime = Date.now();

  constructor() {
    // Create WebSocket server
    this.wss = new WebSocketServer({ port: this.PORT });

    // Create crypto data service
    this.cryptoService = new CryptoDataService();

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupEventHandlers(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.wss.on("error", (error: Error) => {
      console.error("WebSocket Server Error:", error);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: WebSocket): void {
    console.log("Client connected");

    // Create client connection record
    const client: ClientConnection = {
      ws,
      filter: {
        symbols: [], // Empty = all coins
        frequency: this.DEFAULT_FREQUENCY,
      },
      connectedAt: Date.now(),
      messagesSent: 0,
    };

    this.clients.set(ws, client);

    // Start sending data updates
    this.startDataStream(ws, client);

    // Setup message handler (for JSON commands)
    ws.on("message", (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // Setup close handler
    ws.on("close", () => {
      this.handleDisconnect(ws);
    });

    // Setup error handler
    ws.on("error", (error: Error) => {
      console.error("Client error:", error);
      this.handleDisconnect(ws);
    });

    // Send welcome message (JSON)
    this.sendResponse(ws, {
      type: "METRICS",
      payload: {
        activeConnections: this.clients.size,
        messagesPerSecond: 0,
        totalMessagesSent: this.totalMessagesSent,
        uptime: Date.now() - this.serverStartTime,
      },
    });
  }

  /**
   * Start streaming binary data to client
   */
  private startDataStream(ws: WebSocket, client: ClientConnection): void {
    // Calculate interval from frequency (Hz to ms)
    const intervalMs = 1000 / client.filter.frequency;

    const interval = setInterval(() => {
      // Check if client is still connected
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      // Get crypto data (filtered or all)
      const cryptos =
        client.filter.symbols.length > 0
          ? this.cryptoService.getFilteredPrices(client.filter.symbols)
          : this.cryptoService.getCurrentPrices();

      // Encode to binary
      const binaryData = FlatBuffersAdapter.encode(cryptos);

      // Send binary data
      ws.send(binaryData);

      // Track metrics
      client.messagesSent++;
      this.totalMessagesSent++;
      this.totalBytesSent += binaryData.length;
    }, intervalMs);

    // Store interval for cleanup
    this.updateIntervals.set(ws, interval);
  }

  /**
   * Handle incoming message from client
   *
   * Can be:
   * - JSON text (commands)
   * - Binary data (not used in this project, but supported)
   */
  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      // Check if message is text (JSON) or binary
      const text = data.toString("utf8");

      // Try to parse as JSON
      if (text.startsWith("{")) {
        const message = JSON.parse(text);

        if (isClientCommand(message)) {
          this.handleCommand(ws, message);
        } else {
          this.sendError(ws, "Invalid command format");
        }
      } else {
        // Binary message from client (not expected)
        console.log("Received binary message from client (not handled)");
      }
    } catch (error) {
      console.error("Error handling message:", error);
      this.sendError(ws, "Failed to parse message");
    }
  }

  /**
   * Handle client command (JSON)
   */
  private handleCommand(ws: WebSocket, command: ClientCommand): void {
    const client = this.clients.get(ws);
    if (!client) return;

    console.log("Received command:", command.type);

    if (isFilterCoinsCommand(command)) {
      // Update filter
      client.filter.symbols = command.payload.symbols;

      // Send acknowledgment
      this.sendResponse(ws, {
        type: "FILTER_APPLIED",
        payload: {
          symbols: command.payload.symbols,
          appliedAt: Date.now(),
        },
      });

      console.log(`Filter applied: ${command.payload.symbols.join(", ")}`);
    } else if (isChangeFrequencyCommand(command)) {
      // Update frequency
      const oldFrequency = client.filter.frequency;
      client.filter.frequency = command.payload.frequency;

      // Restart stream with new frequency
      const oldInterval = this.updateIntervals.get(ws);
      if (oldInterval) {
        clearInterval(oldInterval);
      }
      this.startDataStream(ws, client);

      // Send acknowledgment
      this.sendResponse(ws, {
        type: "FREQUENCY_CHANGED",
        payload: {
          frequency: command.payload.frequency,
          appliedAt: Date.now(),
        },
      });

      console.log(
        `Frequency changed: ${oldFrequency}Hz → ${command.payload.frequency}Hz`
      );
    } else if (isGetMetricsCommand(command)) {
      // Send current metrics
      this.sendResponse(ws, {
        type: "METRICS",
        payload: {
          activeConnections: this.clients.size,
          messagesPerSecond: this.calculateMessagesPerSecond(),
          totalMessagesSent: this.totalMessagesSent,
          uptime: Date.now() - this.serverStartTime,
        },
      });
    }
  }

  /**
   * Send JSON response to client
   */
  private sendResponse(ws: WebSocket, response: ServerResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Send error response to client
   */
  private sendError(ws: WebSocket, message: string, code?: string): void {
    this.sendResponse(ws, {
      type: "ERROR",
      payload: { message, code },
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: WebSocket): void {
    console.log("Client disconnected");

    // Clear update interval
    const interval = this.updateIntervals.get(ws);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(ws);
    }

    // Remove client
    this.clients.delete(ws);
  }

  /**
   * Calculate current messages per second across all clients
   */
  private calculateMessagesPerSecond(): number {
    const uptime = (Date.now() - this.serverStartTime) / 1000; // seconds
    return uptime > 0 ? this.totalMessagesSent / uptime : 0;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    console.log("=".repeat(50));
    console.log("Crypto WebSocket Server");
    console.log("=".repeat(50));

    // Start crypto data service
    await this.cryptoService.start();

    console.log(`Server running on ws://localhost:${this.PORT}`);
    console.log(`Default update frequency: ${this.DEFAULT_FREQUENCY}Hz`);
    console.log("Waiting for connections...\n");

    // Log metrics every 10 seconds
    setInterval(() => {
      this.logMetrics();
    }, 10000);
  }

  /**
   * Log server metrics
   */
  private logMetrics(): void {
    const avgMessageSize =
      this.totalMessagesSent > 0
        ? this.totalBytesSent / this.totalMessagesSent
        : 0;

    console.log("\n--- Server Metrics ---");
    console.log(`Active connections: ${this.clients.size}`);
    console.log(`Total messages sent: ${this.totalMessagesSent}`);
    console.log(
      `Total data sent: ${(this.totalBytesSent / 1024).toFixed(2)} KB`
    );
    console.log(`Average message size: ${avgMessageSize.toFixed(0)} bytes`);
    console.log(
      `Messages/second: ${this.calculateMessagesPerSecond().toFixed(1)}`
    );
    console.log(
      `Uptime: ${((Date.now() - this.serverStartTime) / 1000).toFixed(0)}s`
    );

    const encoderMetrics = FlatBuffersAdapter.getMetrics();
    console.log(
      `Avg encode time: ${encoderMetrics.averageEncodeTime.toFixed(2)}ms`
    );
    console.log("--------------------\n");
  }
}

// Start the server
const server = new CryptoWebSocketServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
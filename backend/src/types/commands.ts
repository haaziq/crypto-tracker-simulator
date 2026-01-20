/**
 * Command and Response Types
 *
 * These define the JSON messages sent between client and server.
 * Commands: Client → Server
 * Responses: Server → Client
 */

// ============================================================================
// CLIENT COMMANDS (JSON messages from mobile app to server)
// ============================================================================

/**
 * Client wants to filter which cryptocurrencies they receive
 *
 * Example:
 * {
 *   "type": "FILTER_COINS",
 *   "payload": {
 *     "symbols": ["BTC", "ETH", "SOL"]
 *   }
 * }
 */
export interface FilterCoinsCommand {
  type: "FILTER_COINS";
  payload: {
    symbols: string[]; // Array of coin symbols to receive
  };
}

/**
 * Client wants to change update frequency
 *
 * Example:
 * {
 *   "type": "CHANGE_FREQUENCY",
 *   "payload": {
 *     "frequency": 20
 *   }
 * }
 */
export interface ChangeFrequencyCommand {
  type: "CHANGE_FREQUENCY";
  payload: {
    frequency: 10 | 20 | 30; // Hz (updates per second)
  };
}

/**
 * Client requests current server metrics
 */
export interface GetMetricsCommand {
  type: "GET_METRICS";
  payload: {}; // No payload needed
}

/**
 * Union type of all possible client commands
 */
export type ClientCommand =
  | FilterCoinsCommand
  | ChangeFrequencyCommand
  | GetMetricsCommand;

// ============================================================================
// SERVER RESPONSES (JSON messages from server to client)
// ============================================================================

/**
 * Acknowledges filter was applied
 *
 * Example:
 * {
 *   "type": "FILTER_APPLIED",
 *   "payload": {
 *     "symbols": ["BTC", "ETH", "SOL"],
 *     "appliedAt": 1705622400000
 *   }
 * }
 */
export interface FilterAppliedResponse {
  type: "FILTER_APPLIED";
  payload: {
    symbols: string[];
    appliedAt: number; // Unix timestamp
  };
}

/**
 * Acknowledges frequency change
 */
export interface FrequencyChangedResponse {
  type: "FREQUENCY_CHANGED";
  payload: {
    frequency: number;
    appliedAt: number;
  };
}

/**
 * Sends server metrics to client
 */
export interface MetricsResponse {
  type: "METRICS";
  payload: {
    activeConnections: number;
    messagesPerSecond: number;
    totalMessagesSent: number;
    uptime: number;
  };
}

/**
 * Error response for invalid commands or failures
 *
 * Example:
 * {
 *   "type": "ERROR",
 *   "payload": {
 *     "message": "Invalid symbol: INVALID",
 *     "code": "INVALID_SYMBOL"
 *   }
 * }
 */
export interface ErrorResponse {
  type: "ERROR";
  payload: {
    message: string;
    code?: string; // Optional error code
  };
}

/**
 * Union type of all possible server responses
 */
export type ServerResponse =
  | FilterAppliedResponse
  | FrequencyChangedResponse
  | MetricsResponse
  | ErrorResponse;

// ============================================================================
// TYPE GUARDS (for runtime type checking)
// ============================================================================

/**
 * Type guard to check if a message is a ClientCommand
 */
export function isClientCommand(data: any): data is ClientCommand {
  return (
    data &&
    typeof data === "object" &&
    typeof data.type === "string" &&
    data.payload !== undefined
  );
}

/**
 * Type guard for specific command types
 */
export function isFilterCoinsCommand(
  cmd: ClientCommand
): cmd is FilterCoinsCommand {
  return cmd.type === "FILTER_COINS";
}

export function isChangeFrequencyCommand(
  cmd: ClientCommand
): cmd is ChangeFrequencyCommand {
  return cmd.type === "CHANGE_FREQUENCY";
}

export function isGetMetricsCommand(
  cmd: ClientCommand
): cmd is GetMetricsCommand {
  return cmd.type === "GET_METRICS";
}
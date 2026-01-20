/**
 * Command and Response Types (Mobile Side)
 *
 * These match the backend types exactly.
 * Commands: Mobile → Server (JSON)
 * Responses: Server → Mobile (JSON)
 */

// ============================================================================
// COMMANDS (Mobile sends to server)
// ============================================================================

export interface FilterCoinsCommand {
  type: "FILTER_COINS";
  payload: {
    symbols: string[];
  };
}

export interface ChangeFrequencyCommand {
  type: "CHANGE_FREQUENCY";
  payload: {
    frequency: 10 | 20 | 30;
  };
}

export interface GetMetricsCommand {
  type: "GET_METRICS";
  payload: {};
}

export type ClientCommand =
  | FilterCoinsCommand
  | ChangeFrequencyCommand
  | GetMetricsCommand;

// ============================================================================
// RESPONSES (Server sends to mobile)
// ============================================================================

export interface FilterAppliedResponse {
  type: "FILTER_APPLIED";
  payload: {
    symbols: string[];
    appliedAt: number;
  };
}

export interface FrequencyChangedResponse {
  type: "FREQUENCY_CHANGED";
  payload: {
    frequency: number;
    appliedAt: number;
  };
}

export interface MetricsResponse {
  type: "METRICS";
  payload: {
    activeConnections: number;
    messagesPerSecond: number;
    totalMessagesSent: number;
    uptime: number;
  };
}

export interface ErrorResponse {
  type: "ERROR";
  payload: {
    message: string;
    code?: string;
  };
}

export type ServerResponse =
  | FilterAppliedResponse
  | FrequencyChangedResponse
  | MetricsResponse
  | ErrorResponse;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isServerResponse(data: any): data is ServerResponse {
  return (
    data &&
    typeof data === "object" &&
    typeof data.type === "string" &&
    data.payload !== undefined
  );
}

export function isFilterAppliedResponse(
  res: ServerResponse
): res is FilterAppliedResponse {
  return res.type === "FILTER_APPLIED";
}

export function isFrequencyChangedResponse(
  res: ServerResponse
): res is FrequencyChangedResponse {
  return res.type === "FREQUENCY_CHANGED";
}

export function isMetricsResponse(res: ServerResponse): res is MetricsResponse {
  return res.type === "METRICS";
}

export function isErrorResponse(res: ServerResponse): res is ErrorResponse {
  return res.type === "ERROR";
}
import Constants from "expo-constants";

/**
 * Environment Configuration
 *
 * Provides type-safe access to app configuration
 * Values come from app.config.ts extra field
 */

interface PerformanceTargets {
  maxLatencyP99: number;
  maxCommandLatency: number;
  minFrameRate: number;
  maxDeserializeTime: number;
}

interface Config {
  websocketUrl: string;
  performanceTargets: PerformanceTargets;
  env: "development" | "staging" | "production";
}

// Get config from Constants
const extra = Constants.expoConfig?.extra;

if (!extra) {
  throw new Error("App configuration not found");
}

export const config: Config = {
  websocketUrl: extra.websocketUrl,
  performanceTargets: extra.performanceTargets,
  env: extra.env,
};

// Validate configuration
if (!config.websocketUrl) {
  throw new Error("WEBSOCKET_URL not configured");
}

console.log("App Configuration:");
console.log("- WebSocket URL:", config.websocketUrl);
console.log("- Environment:", config.env);
console.log("- Performance Targets:", config.performanceTargets);
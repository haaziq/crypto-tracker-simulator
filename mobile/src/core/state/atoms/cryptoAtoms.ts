import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import {
  CryptoViewModel,
  PerformanceMetrics,
  ConnectionStatus,
  FilterState,
} from "../../types/viewModels";

/**
 * Jotai Atoms for Crypto Dashboard
 *
 * Architecture:
 * - Atom Family for per-crypto data (only re-renders affected crypto cards)
 * - Single atoms for global state (connection, performance, filters)
 * - Derived atoms for computed values (top gainers, etc.)
 *
 * Why Jotai:
 * - Atomic updates (only re-render what changed)
 * - No global store setup
 * - Great TypeScript support
 * - Minimal boilerplate
 */

// ============================================================================
// CRYPTO DATA ATOMS (Atom Family)
// ============================================================================

/**
 * Atom family for cryptocurrency data
 *
 * Creates an atom for each crypto symbol on-demand.
 * When BTC price updates, only BTC card re-renders.
 *
 * Usage:
 *   const btcAtom = cryptoAtomFamily('BTC');
 *   const [btcData] = useAtom(btcAtom);
 */
export const cryptoAtomFamily = atomFamily((symbol: string) =>
  atom<CryptoViewModel | null>(null)
);

/**
 * Derived atom: All cryptocurrency data as an array
 *
 * Usage in components that need all cryptos (like a list)
 */
export const allCryptosAtom = atom<CryptoViewModel[]>([]);

/**
 * Derived atom: Top gainers (top 10 by 24h change)
 */
export const topGainersAtom = atom((get) => {
  const allCryptos = get(allCryptosAtom);

  return [...allCryptos]
    .filter((c) => c.priceChange24h > 0)
    .sort((a, b) => b.priceChange24h - a.priceChange24h)
    .slice(0, 10);
});

/**
 * Derived atom: Top losers (top 10 by 24h change)
 */
export const topLosersAtom = atom((get) => {
  const allCryptos = get(allCryptosAtom);

  return [...allCryptos]
    .filter((c) => c.priceChange24h < 0)
    .sort((a, b) => a.priceChange24h - b.priceChange24h)
    .slice(0, 10);
});

// ============================================================================
// CONNECTION STATE ATOMS
// ============================================================================

/**
 * WebSocket connection status
 */
export const connectionStatusAtom = atom<ConnectionStatus>("DISCONNECTED");

/**
 * Current WebSocket URL
 */
export const websocketUrlAtom = atom<string>("");

/**
 * Last connection error message
 */
export const connectionErrorAtom = atom<string | null>(null);

// ============================================================================
// PERFORMANCE METRICS ATOMS
// ============================================================================

/**
 * Real-time performance metrics
 *
 * Updated every frame to track:
 * - Latency (P50, P95, P99)
 * - Frame rate
 * - Deserialization time
 * - Throughput
 */
export const performanceMetricsAtom = atom<PerformanceMetrics>({
  // Latency
  latencyP50: 0,
  latencyP95: 0,
  latencyP99: 0,
  averageLatency: 0,
  maxLatency: 0,
  minLatency: 0,

  // Frame rate
  currentFrameRate: 0,
  frameDropCount: 0,
  frameDropPercentage: 0,

  // Throughput
  messagesReceived: 0,
  bytesReceived: 0,
  bytesPerSecond: 0,
  messagesPerSecond: 0,

  // Deserialization
  averageDeserializeTime: 0,
  maxDeserializeTime: 0,
  minDeserializeTime: 0,

  // Connection
  isConnected: false,
  connectionUptime: 0,
  reconnectAttempts: 0,
  lastReconnectAt: null,
});

/**
 * Derived atom: Performance status (pass/fail based on Hudl targets)
 */
export const performanceStatusAtom = atom((get) => {
  const metrics = get(performanceMetricsAtom);

  return {
    latencyOk: metrics.latencyP99 < 300, // Target: <300ms
    frameRateOk: metrics.currentFrameRate >= 60, // Target: 60fps
    deserializeOk: metrics.averageDeserializeTime < 10, // Target: <10ms
    allOk:
      metrics.latencyP99 < 300 &&
      metrics.currentFrameRate >= 60 &&
      metrics.averageDeserializeTime < 10,
  };
});

// ============================================================================
// FILTER STATE ATOMS
// ============================================================================

/**
 * Selected symbols filter
 * Empty array = show all
 */
export const selectedSymbolsAtom = atom<string[]>([]);

/**
 * Update frequency (Hz)
 */
export const updateFrequencyAtom = atom<10 | 20 | 30>(10);

/**
 * Combined filter state
 */
export const filterStateAtom = atom<FilterState>((get) => ({
  selectedSymbols: get(selectedSymbolsAtom),
  frequency: get(updateFrequencyAtom),
}));

// ============================================================================
// UI STATE ATOMS
// ============================================================================

/**
 * Show/hide performance overlay
 */
export const showMetricsOverlayAtom = atom<boolean>(true);

/**
 * Show/hide filter panel
 */
export const showFilterPanelAtom = atom<boolean>(false);

/**
 * Current view mode (list, grid, chart)
 */
export const viewModeAtom = atom<"list" | "grid" | "chart">("list");
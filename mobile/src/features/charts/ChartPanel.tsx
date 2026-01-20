import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAtom } from "jotai";
import {
  allCryptosAtom,
  connectionStatusAtom,
} from "../../core/state/atoms/cryptoAtoms";
import { CryptoChartCard } from "./CryptoChartCard";

/**
 * ChartPanel Component
 *
 * Displays a scrollable list of price charts for all cryptocurrencies.
 *
 * Features:
 * - Real-time charts using Skia
 * - Virtualized list for performance
 * - Auto-updates as new prices arrive
 * - Shows loading/error states
 *
 * Performance:
 * - FlatList virtualizes (only renders visible charts)
 * - Each chart uses Skia (GPU-accelerated)
 * - Only individual chart cards re-render when their data changes
 */

export const ChartPanel = () => {
  const [cryptos] = useAtom(allCryptosAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);

  // Loading state
  if (connectionStatus === "CONNECTING") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.statusText}>Connecting to server...</Text>
      </View>
    );
  }

  // Disconnected state
  if (connectionStatus === "DISCONNECTED" || connectionStatus === "ERROR") {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Disconnected from server</Text>
        <Text style={styles.statusText}>
          {connectionStatus === "ERROR"
            ? "Connection error"
            : "Reconnecting..."}
        </Text>
      </View>
    );
  }

  // Empty state (connected but no data yet)
  if (cryptos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>Waiting for data...</Text>
      </View>
    );
  }

  // Render charts
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Live Price Charts</Text>
        <Text style={styles.subtitle}>
          Showing {cryptos.length} cryptocurrencies
        </Text>
      </View>

      {/* Chart list */}
      <FlatList
        data={cryptos}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => <CryptoChartCard symbol={item.symbol} />}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={5}
        windowSize={11}
        // Styling
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  statusText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
  },
});

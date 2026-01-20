import React from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAtom } from "jotai";
import {
  allCryptosAtom,
  connectionStatusAtom,
} from "../../core/state/atoms/cryptoAtoms";
import { CryptoCard } from "./CryptoCard";

/**
 * CryptoList Component
 *
 * Displays a virtualized list of all cryptocurrencies.
 *
 * Features:
 * - Virtualization (only render visible items)
 * - Pull-to-refresh (future enhancement)
 * - Loading and error states
 * - Performance optimized for 50+ items
 *
 * Performance notes:
 * - FlatList virtualizes (doesn't render off-screen items)
 * - keyExtractor uses symbol (stable, unique)
 * - getItemLayout for faster scrolling
 */

const ITEM_HEIGHT = 120; // Approximate height of CryptoCard

export const CryptoList = () => {
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

  // Render list
  return (
    <View style={styles.container}>
      <FlatList
        data={cryptos}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => <CryptoCard symbol={item.symbol} />}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        // Optional: Enable for even better performance
        // getItemLayout={(data, index) => ({
        //   length: ITEM_HEIGHT,
        //   offset: ITEM_HEIGHT * index,
        //   index,
        // })}

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
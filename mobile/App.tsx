import React, { useEffect, useState } from "react";
import { StyleSheet, View, StatusBar, SafeAreaView, TouchableOpacity, Text } from "react-native";
import { WebSocketManager } from "./src/core/networking/WebSocketManager";
import { config } from "./src/config/env";
import { CryptoList } from "./src/features/dashboard/CryptoList";
import { MetricsOverlay } from "./src/features/dashboard/MetricsOverlay";
import { FilterPanel } from "./src/features/controls/FilterPanel";
import { ChartPanel } from "./src/features/charts/ChartPanel";

/**
 * Main App Component
 *
 * Responsibilities:
 * - Initialize WebSocket connection on mount
 * - Render main UI layout
 * - Handle app lifecycle
 * - Clean up on unmount
 */

type ViewMode = "list" | "charts" | "filter";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    console.log("=".repeat(50));
    console.log("Crypto Dashboard - Mobile App");
    console.log("=".repeat(50));
    console.log("Environment:", config.env);
    console.log("WebSocket URL:", config.websocketUrl);
    console.log("Performance Targets:", config.performanceTargets);
    console.log("=".repeat(50));

    // Get WebSocket manager instance
    const wsManager = WebSocketManager.getInstance();

    // Connect to server
    wsManager.connect(config.websocketUrl);

    // Cleanup on unmount
    return () => {
      console.log("App unmounting, disconnecting WebSocket...");
      wsManager.disconnect();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      <View style={styles.container}>
        {/* Navigation tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, viewMode === "list" && styles.tabActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={[styles.tabText, viewMode === "list" && styles.tabTextActive]}>
              List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === "charts" && styles.tabActive]}
            onPress={() => setViewMode("charts")}
          >
            <Text style={[styles.tabText, viewMode === "charts" && styles.tabTextActive]}>
              Charts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, viewMode === "filter" && styles.tabActive]}
            onPress={() => setViewMode("filter")}
          >
            <Text style={[styles.tabText, viewMode === "filter" && styles.tabTextActive]}>
              Filters
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on view mode */}
        {viewMode === "list" && <CryptoList />}
        {viewMode === "charts" && <ChartPanel />}
        {viewMode === "filter" && <FilterPanel />}

        <MetricsOverlay />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3B82F6",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#3B82F6",
  },
});
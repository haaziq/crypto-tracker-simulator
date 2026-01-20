import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useAtom } from "jotai";
import { cryptoAtomFamily } from "../../core/state/atoms/cryptoAtoms";
import { PriceHistoryManager, PriceHistory } from "../../core/state/PriceHistoryManager";
import { SkiaLineChart } from "./SkiaLineChart";

/**
 * CryptoChartCard Component
 *
 * Displays a single cryptocurrency chart with current price info.
 *
 * Features:
 * - Real-time price chart using Skia
 * - Auto-updates as new prices arrive
 * - Color-coded based on trend (green = up, red = down)
 * - Shows current price and 24h change
 *
 * Performance:
 * - Only re-renders when this crypto's data changes
 * - Chart renders on GPU thread
 */

interface CryptoChartCardProps {
  symbol: string;
}

const CHART_WIDTH = Dimensions.get("window").width - 32; // Screen width minus padding
const CHART_HEIGHT = 150;

export const CryptoChartCard = ({ symbol }: CryptoChartCardProps) => {
  const [crypto] = useAtom(cryptoAtomFamily(symbol));
  const [history, setHistory] = useState<PriceHistory | null>(null);

  // Update chart every 500ms (smooth updates without overloading)
  useEffect(() => {
    const updateChart = () => {
      const historyManager = PriceHistoryManager.getInstance();
      const newHistory = historyManager.getHistory(symbol);
      setHistory(newHistory);
    };

    // Initial update
    updateChart();

    // Set up interval
    const interval = setInterval(updateChart, 500);

    return () => clearInterval(interval);
  }, [symbol]);

  // Handle loading state
  if (!crypto) {
    return (
      <View style={styles.card}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  // Destructure crypto data
  const { name, price, priceChange24h } = crypto;

  // Determine trend color
  const isPositive = priceChange24h >= 0;
  const trendColor = isPositive ? "#10B981" : "#EF4444"; // Green or Red
  const changeIcon = isPositive ? "▲" : "▼";

  // Chart colors based on trend
  const strokeColor = trendColor;
  const gradientStartColor = isPositive
    ? "rgba(16, 185, 129, 0.3)" // Green with transparency
    : "rgba(239, 68, 68, 0.3)"; // Red with transparency
  const gradientEndColor = isPositive
    ? "rgba(16, 185, 129, 0.0)"
    : "rgba(239, 68, 68, 0.0)"; // Fade to transparent

  return (
    <View style={styles.card}>
      {/* Header with symbol, name, and price */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>
            ${price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.change, { color: trendColor }]}>
            {changeIcon} {Math.abs(priceChange24h).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Skia Chart */}
      <View style={styles.chartContainer}>
        {history && history.points.length > 0 ? (
          <SkiaLineChart
            data={history.points}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            strokeColor={strokeColor}
            gradientStartColor={gradientStartColor}
            gradientEndColor={gradientEndColor}
          />
        ) : (
          <View style={[styles.emptyChart, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
            <Text style={styles.emptyText}>Collecting data...</Text>
          </View>
        )}
      </View>

      {/* Chart info */}
      {history && history.points.length > 0 && (
        <View style={styles.chartInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>High</Text>
            <Text style={styles.infoValue}>
              ${history.maxPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Low</Text>
            <Text style={styles.infoValue}>
              ${history.minPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Points</Text>
            <Text style={styles.infoValue}>{history.points.length}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  symbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  emptyChart: {
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  chartInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  loading: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
